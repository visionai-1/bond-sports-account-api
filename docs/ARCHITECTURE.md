# Architecture

Project architecture and design of the Account Management API. This is a single, modular
NestJS application backed by PostgreSQL via TypeORM. It favors clarity over cleverness: thin
controllers, business logic in services, and a lightweight repository layer over the database.

For the data model see [`DATABASE.md`](DATABASE.md); for the HTTP contract see [`API.md`](API.md);
for the rationale behind key choices see [`DECISIONS.md`](DECISIONS.md).

## High-level overview

```txt
                 HTTP (JSON)
                     │
        ┌────────────▼─────────────┐
        │   AccountsController      │  thin — routing, UUID/DTO validation only
        └────────────┬─────────────┘
                     │ calls
        ┌────────────▼─────────────┐
        │     AccountsService       │  business rules + DB-transaction orchestration
        └───┬───────────────────┬───┘
            │                   │
 ┌──────────▼────────┐ ┌────────▼───────────────┐
 │ AccountRepository  │ │ TransactionRepository  │  data access (TypeORM)
 └──────────┬────────┘ └────────┬───────────────┘
            │                   │
        ┌───▼───────────────────▼───┐
        │        PostgreSQL          │  accounts, transactions
        └───────────────────────────┘

Cross-cutting: LoggingModule (global) — RequestLoggingInterceptor + AppLoggerService
```

The NestJS app runs on the host; PostgreSQL (and pgAdmin for inspection) run in Docker Compose.
See [`LOCAL_DEVOPS_RUNBOOK.md`](LOCAL_DEVOPS_RUNBOOK.md).

## Layers

| Layer | Responsibility | Key files |
|---|---|---|
| Controller | HTTP routing, param/DTO validation; no business logic | `accounts/accounts.controller.ts` |
| Service | Business rules, validation ordering, DB-transaction boundaries | `accounts/accounts.service.ts` |
| Repository | Encapsulated database access (queries, locking, inserts) | `accounts/repositories/account.repository.ts`, `transactions/repositories/transaction.repository.ts` |
| Entity | Table mapping (columns, types, indexes, relations) | `accounts/entities/account.entity.ts`, `transactions/entities/transaction.entity.ts` |
| Helpers/Errors | Decimal money math, UTC date ranges, domain→HTTP errors | `common/helpers/*`, `common/errors/index.ts` |

The service decides **what** must happen; the repository decides **how** data is read/written. The
repository layer is deliberately small — no generic repository framework.

## Modules

The application is composed of feature modules wired together by the root `AppModule`
(`src/app.module.ts`).

### AppModule (root)
- `ConfigModule.forRoot({ isGlobal: true })` — loads `.env` once, globally.
- `TypeOrmModule.forRootAsync` — builds the Postgres connection from `DB_*` env vars;
  `autoLoadEntities: true`; `synchronize` is enabled only when `DB_SYNCHRONIZE=true` (local dev).
- Imports `LoggingModule`, `AccountsModule`, `TransactionsModule`.

### AccountsModule (`src/accounts/`)
- Owns the `Account` entity (`TypeOrmModule.forFeature([Account])`).
- Provides `AccountsService` and `AccountRepository`; exposes `AccountsController`.
- Imports `TransactionsModule` to reuse `TransactionRepository` (records + withdrawal sums).

### TransactionsModule (`src/transactions/`)
- Data-only module: owns the `Transaction` entity and `TransactionRepository`.
- **Exports** `TransactionRepository` so `AccountsService` can write transaction records and query
  withdrawal totals/statements. There is no `TransactionsService` — transaction logic is
  orchestrated by `AccountsService` and executed by the repository.

### LoggingModule (`src/common/logging/`)
- `@Global()`. Registers a `RequestLoggingInterceptor` via `APP_INTERCEPTOR` (logs method, path,
  status, duration) and exports `AppLoggerService` (wraps the built-in Nest `Logger`).
- Local console logging only — no external logging/observability infrastructure.

## Request flow (write operations)

`POST /accounts/:accountId/deposit` and `/withdraw` both run inside a single database transaction
opened by `dataSource.transaction(...)` in `AccountsService`:

1. **Lock** the account row with `SELECT … FOR UPDATE` (`AccountRepository.findByIdForUpdate`,
   `pessimistic_write`) using the transactional `EntityManager`.
2. **Validate** (withdrawal order): account exists → account is active → amount is positive →
   balance is sufficient → daily withdrawal limit not exceeded. Deposit validates: exists → active
   → amount positive.
3. **Update** the balance with decimal-safe math (`Money.add` / `Money.subtract`).
4. **Insert** the matching `DEPOSIT`/`WITHDRAWAL` transaction record
   (`TransactionRepository.createInTransaction`).
5. **Commit** — the balance change and the transaction row commit together, or both roll back.

This guarantees the core invariant: **a balance never changes without a corresponding transaction
record, and vice versa.** The row lock serializes concurrent withdrawals so the account cannot be
overdrawn by a race.

`GET /accounts/:accountId/statement` is read-only: it resolves a `[from, toExclusive)` UTC range,
confirms the account exists, and returns ordered transactions for the period.

## Data layer and database

Two tables, UUID primary keys, money as `numeric(19,4)`, timestamps as `timestamptz`. Schema is
created from the entities (TypeORM `synchronize`) in local/assessment mode; no migrations.

### `accounts`
| Column | Type | Notes |
|---|---|---|
| `account_id` | uuid PK | generated |
| `person_id` | uuid | account owner |
| `balance` | numeric(19,4) | default `0`; returned as **string** by the pg driver |
| `daily_withdrawal_limit` | numeric(19,4) | per-account daily cap |
| `active_flag` | boolean | default `true` |
| `account_type` | enum | `CHECKING` \| `SAVINGS` |
| `create_date` | timestamptz | `@CreateDateColumn` |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| `transaction_id` | uuid PK | generated |
| `account_id` | uuid FK | → `accounts.account_id` (`@ManyToOne`) |
| `value` | numeric(19,4) | transaction amount (string) |
| `type` | enum | `DEPOSIT` \| `WITHDRAWAL` |
| `transaction_date` | timestamptz | `@CreateDateColumn` |

**Relations:** `Account 1───* Transaction` (`@OneToMany` / `@ManyToOne` on `account_id`).

**Indexes** (on `transactions`, supporting the hot read paths):
- `idx_transactions_account` (`account_id`)
- `idx_transactions_account_date` (`account_id`, `transaction_date`) — statement queries
- `idx_transactions_account_type_date` (`account_id`, `type`, `transaction_date`) — daily
  withdrawal-sum queries

### Repository responsibilities
- `AccountRepository`: `createAccount`, `findById`, `findByIdForUpdate` (locking), `save`
  (transactional `EntityManager`).
- `TransactionRepository`: `createInTransaction`, `getTotalWithdrawals`
  (DB-side `COALESCE(SUM(value),0)` — no JS float math), `findByAccountAndPeriod`
  (`>= from AND < toExclusive`, ordered).

## Cross-cutting design

- **Money** — all monetary values are `numeric(19,4)` and handled as decimal strings via the
  `Money` helper; floating-point arithmetic is never used (sums computed in SQL).
- **Dates** — statement/daily-limit windows use UTC ranges (`statementUtcRange`, `todayUtcRange`)
  with an exclusive upper bound so a whole-day `to` includes the entire day.
- **Validation** — a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`)
  validates DTOs; `ParseUUIDPipe` validates path IDs at the controller boundary.
- **Errors** — domain errors in `common/errors` extend Nest `HttpException` subclasses, mapping to
  HTTP status without a custom filter: not found → `404`, inactive → `409`, invalid amount /
  invalid period → `400`, insufficient funds / daily-limit exceeded → `422`.

## Out of scope (by design)

No auth, microservices, CQRS/event sourcing, Redis/Kafka/RabbitMQ, payment providers, or Swagger.
The API is intentionally not containerized for this assessment; only the database stack runs in
Docker. See [`DECISIONS.md`](DECISIONS.md).
