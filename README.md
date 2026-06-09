# Account Management API

A small, production-style REST API for account management and banking transactions
(deposits, withdrawals, daily withdrawal limits, and account statements). Built for the
BOND Sports backend technical assessment.

Every deposit and withdrawal updates the account balance **and** writes a transaction record
inside a single database transaction, so the two can never drift apart. Withdrawals are
validated and serialized with row locking to prevent concurrent overdrafts.

## Tech Stack

- TypeScript
- NestJS
- PostgreSQL
- TypeORM
- Jest

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env

# 3. Start the local database stack (PostgreSQL + pgAdmin) in Docker
npm run dev:db

# 4. Run typecheck + build + tests
npm run dev:check

# 5. Run the API in watch mode (on the host, not in Docker)
npm run dev:api      # alias for npm run start:dev
```

The API listens on `http://localhost:3000` (configurable via `PORT`).

For a detailed local Docker/PostgreSQL runbook, see [`docs/LOCAL_DEVOPS_RUNBOOK.md`](docs/LOCAL_DEVOPS_RUNBOOK.md).

### Environment Variables

Defined in `.env` (copy from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port the API listens on |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `bond_sports_account` | Database name |
| `DB_SYNCHRONIZE` | `true` | Local dev only: auto-create schema from entities. Keep `false` in non-dev environments. |
| `PGADMIN_PORT` | `5051` | Host port for the pgAdmin UI |
| `PGADMIN_DEFAULT_EMAIL` | `admin@bond-sports.com` | pgAdmin login email |
| `PGADMIN_DEFAULT_PASSWORD` | `admin` | pgAdmin login password |

### Docker Compose (PostgreSQL + pgAdmin)

`docker-compose.yml` provides the **local database stack** for development: PostgreSQL 16 and
pgAdmin. The NestJS API is **not** containerized — it runs on the host with `npm run start:dev`.

```bash
npm run dev:db          # start PostgreSQL + pgAdmin in the background
npm run dev:db:ps       # list stack containers
npm run dev:db:logs     # follow postgres + pgadmin logs
npm run dev:db:stop     # stop containers (keeps data)
npm run dev:db:down     # remove containers (keeps the data volume)
npm run dev:db:clean    # remove containers AND delete the data volume (fresh DB)
```

PostgreSQL credentials and database name are read from the `DB_*` variables in `.env`.

#### pgAdmin

pgAdmin is an official part of the local stack so reviewers can inspect accounts and transactions
through a UI. Once `npm run dev:db` is up:

```txt
URL:      http://localhost:5051
Email:    admin@bond-sports.com
Password: admin
```

Inside pgAdmin, register the database server with:

```txt
Host name/address:    postgres
Port:                 5432
Maintenance database: bond_sports_account
Username:             postgres
Password:             postgres
```

> **Host vs. container networking:** when the NestJS API runs on the host it reaches Postgres at
> `DB_HOST=localhost`. pgAdmin runs **inside** Docker, so it reaches Postgres by the compose
> service name `postgres` (not `localhost`).

### Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run start:dev` | Run the API in watch mode |
| `npm start` | Run the API |
| `npm run build` | Compile to `dist/` |
| `npm run typecheck` | Type-check without emitting (`tsc --noEmit`) |
| `npm test` | Run the Jest test suite |
| `npm run dev:db` | Start the local DB stack (PostgreSQL + pgAdmin) |
| `npm run dev:db:stop` | Stop the DB stack (keeps data) |
| `npm run dev:db:down` | Remove DB containers (keeps the data volume) |
| `npm run dev:db:clean` | Remove DB containers and **delete** the data volume |
| `npm run dev:db:ps` | List DB stack containers |
| `npm run dev:db:logs` | Follow PostgreSQL + pgAdmin logs |
| `npm run dev:api` | Run the API on the host (alias for `start:dev`) |
| `npm run dev:check` | Run typecheck + build + tests |

## API Documentation

Base URL: `http://localhost:3000`. All request and response bodies are JSON. Monetary amounts
are decimal **strings** (e.g. `"100.00"`) to avoid floating-point loss; balances and transaction
values are returned as `numeric(19,4)` strings (e.g. `"150.0000"`).

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/accounts` | Create an account |
| GET | `/accounts/:accountId` | Get an account and its balance |
| POST | `/accounts/:accountId/deposit` | Deposit funds |
| POST | `/accounts/:accountId/withdraw` | Withdraw funds |
| GET | `/accounts/:accountId/statement?from=&to=` | List transactions in a period |

---

### POST /accounts

Create a new account. The balance starts at `0`.

**Request body**

```json
{
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "accountType": "CHECKING",
  "dailyWithdrawalLimit": "1000.00"
}
```

**201 Created**

```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "balance": "0.0000",
  "dailyWithdrawalLimit": "1000.0000",
  "activeFlag": true,
  "accountType": "CHECKING",
  "createDate": "2026-06-08T12:00:00.000Z"
}
```

**Errors**

- `400 Bad Request` — invalid payload (missing `personId`, unknown `accountType`, non-numeric limit).

---

### GET /accounts/:accountId

Retrieve an account with its current balance.

**200 OK**

```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "balance": "150.0000",
  "dailyWithdrawalLimit": "1000.0000",
  "activeFlag": true,
  "accountType": "CHECKING",
  "createDate": "2026-06-08T12:00:00.000Z"
}
```

**Errors**

- `404 Not Found` — account does not exist.

---

### POST /accounts/:accountId/deposit

Increase the balance and record a `DEPOSIT` transaction. The balance update and the transaction
record are written in the same database transaction (atomic).

**Request body**

```json
{ "amount": "100.00" }
```

**200 OK**

```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "balance": "250.0000",
  "transaction": {
    "transactionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "type": "DEPOSIT",
    "value": "100.00",
    "transactionDate": "2026-06-08T12:05:00.000Z"
  }
}
```

**Errors**

- `400 Bad Request` — amount is not positive.
- `404 Not Found` — account does not exist.
- `409 Conflict` — account is inactive.

---

### POST /accounts/:accountId/withdraw

Decrease the balance and record a `WITHDRAWAL` transaction (atomic). Validations run in order:
account exists → account is active → amount is positive → balance is sufficient → daily
withdrawal limit is not exceeded.

**Request body**

```json
{ "amount": "50.00" }
```

**200 OK**

```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "balance": "200.0000",
  "transaction": {
    "transactionId": "16fd2706-8baf-433b-82eb-8c7fada847da",
    "type": "WITHDRAWAL",
    "value": "50.00",
    "transactionDate": "2026-06-08T12:10:00.000Z"
  }
}
```

**Errors**

- `400 Bad Request` — amount is not positive.
- `404 Not Found` — account does not exist.
- `409 Conflict` — account is inactive.
- `422 Unprocessable Entity` — insufficient balance.
- `422 Unprocessable Entity` — daily withdrawal limit exceeded.

---

### GET /accounts/:accountId/statement?from=&to=

List the account's transactions in the period. `from` and `to` are ISO dates/datetimes and
the range is **whole-day inclusive**: it covers the start of `from`'s UTC day up to the end of
`to`'s UTC day, so a date-only `to` (e.g. `2026-06-08`) includes every transaction on that day.
Results are returned in chronological order and are not paginated.

**Query params**

| Param | Required | Description |
|---|---|---|
| `from` | yes | Start of period (inclusive, from the start of this UTC day) |
| `to` | yes | End of period (inclusive of the entire UTC day) |

**Example:** `GET /accounts/6fa459ea-ee8a-3ca4-894e-db77e160355e/statement?from=2026-06-01&to=2026-06-08`

**200 OK**

```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "from": "2026-06-01",
  "to": "2026-06-08",
  "transactions": [
    { "transactionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "type": "DEPOSIT", "value": "100.0000", "transactionDate": "2026-06-02T09:00:00.000Z" },
    { "transactionId": "16fd2706-8baf-433b-82eb-8c7fada847da", "type": "WITHDRAWAL", "value": "50.0000", "transactionDate": "2026-06-05T15:30:00.000Z" }
  ]
}
```

**Errors**

- `400 Bad Request` — missing/invalid `from` or `to`, or `from` is after `to`.
- `404 Not Found` — account does not exist.

---

### Error Shape

Errors use NestJS's standard error body (produced by the framework's default exception handling
— no Swagger):

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Insufficient balance"
}
```

| Condition | Status |
|---|---|
| Account not found | `404` |
| Account inactive | `409` |
| Invalid amount | `400` |
| Insufficient funds | `422` |
| Daily withdrawal limit exceeded | `422` |
| Invalid statement period | `400` |

## Architecture

This project follows standard NestJS layering. **In NestJS a module is not a repository** —
each concept has a distinct responsibility:

| Layer | Responsibility |
|---|---|
| Module | Groups the feature's dependencies and exports its providers |
| Controller | Handles HTTP requests |
| Service | Contains business logic |
| Repository | Handles database access |
| Entity | Maps the database table |
| DTO | Validates incoming request payloads |

The project uses a **simple repository layer** — just enough to separate database access from
business logic, without over engineering.

### Repository Structure

```txt
bond-sports-account-api
├── src
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── accounts
│   │   ├── accounts.module.ts
│   │   ├── accounts.controller.ts
│   │   ├── accounts.service.ts
│   │   ├── dto
│   │   │   ├── create-account.dto.ts
│   │   │   ├── deposit.dto.ts
│   │   │   ├── withdraw.dto.ts
│   │   │   └── statement-query.dto.ts
│   │   ├── entities
│   │   │   └── account.entity.ts
│   │   ├── enums
│   │   │   └── account-type.enum.ts
│   │   └── repositories
│   │       └── account.repository.ts
│   │
│   ├── transactions
│   │   ├── transactions.module.ts
│   │   ├── entities
│   │   │   └── transaction.entity.ts
│   │   ├── enums
│   │   │   └── transaction-type.enum.ts
│   │   └── repositories
│   │       └── transaction.repository.ts
│   │
│   └── common
│       ├── errors
│       ├── helpers
│       │   ├── date.helper.ts
│       │   ├── money.helper.ts
│       │   └── index.ts
│       └── logging
│           ├── app-logger.service.ts
│           ├── request-logging.interceptor.ts
│           ├── logging.module.ts
│           └── index.ts
│
├── docs
├── README.md
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── .env.example
```

### Accounts Module

Responsible for account management and account operations.

| File | Responsibility |
|---|---|
| accounts.controller.ts | Exposes account REST endpoints |
| accounts.service.ts | Contains account business logic |
| account.repository.ts | Handles database access for accounts |
| account.entity.ts | Maps the Account table |
| dto/* | Validates incoming request payloads |
| account-type.enum.ts | Defines supported account types |

### Transactions Module

Responsible for transaction history and transaction queries.

| File | Responsibility |
|---|---|
| transaction.repository.ts | Handles database access for transactions (daily-withdrawal sum, statement period query) |
| transaction.entity.ts | Maps the Transaction table |
| transaction-type.enum.ts | Defines DEPOSIT and WITHDRAWAL transaction types |

### Why Repository Layer?

A small repository layer keeps database access separate from business logic. The service layer
decides **what** should happen; the repository layer decides **how** data is read from or written
to PostgreSQL. This keeps the code readable, testable, and aligned with a production-style backend
without adding unnecessary complexity.

## Technical Decisions

Full rationale in [`docs/DECISIONS.md`](docs/DECISIONS.md). Key choices:

1. **TypeORM** — chosen because the assignment involves banking-style transactions; TypeORM gives
   first-class database transactions and row locking (`pessimistic_write` / `SELECT FOR UPDATE`).
2. **README over Swagger** — the API is documented here to avoid unnecessary tooling.
3. **Docker Compose for the local database stack (PostgreSQL + pgAdmin)** — pgAdmin is included
   as a local developer tool to inspect the DB; the API still runs on the host and is not containerized.
4. **No authentication or authorization** — intentionally out of scope for this assessment.
5. **No Redis / Kafka / RabbitMQ / microservices / CQRS / event sourcing** — intentionally out of
   scope; a single modular service plus PostgreSQL handles this workload correctly.
6. **Money as `numeric(19,4)` + TypeScript strings** — never JavaScript floating point. Decimal
   math is done exactly (BigInt at scale 4) in `src/common/helpers/money.helper.ts`, and the daily-withdrawal
   total is summed database-side.
7. **Atomic deposits and withdrawals** — the balance update and the transaction record are written
   in the same database transaction; both commit or both roll back.
8. **Row locking on withdrawal** — balance-changing operations lock the account row
   (`SELECT FOR UPDATE` via TypeORM `pessimistic_write`) so two concurrent withdrawals cannot both
   read a stale balance and overdraw the account.
9. **Daily withdrawal limit uses UTC day boundaries** — the limit is evaluated against the sum of
   the account's withdrawals for the current UTC calendar day, independent of server timezone.

## Logging

The API uses NestJS built-in logging.

It logs:

- request method/path/status/duration
- key account actions such as account creation, deposit, withdrawal, and statement retrieval
- selected domain validation failures

The project intentionally avoids external logging infrastructure to keep the assessment lightweight.

## Out of Scope

Intentionally not added, to avoid over engineering (see `docs/DECISIONS.md`):

- Swagger
- Authentication
- Authorization
- Redis
- Kafka
- RabbitMQ
- Microservices
- CQRS
- Event sourcing
- API Gateway
- Notification systems
- Payment-provider integrations

## Claude Code Skills

This project ships project-level [Claude Code](https://claude.com/claude-code) skills under
`.claude/skills/` to guide implementation and review. Each skill is a `SKILL.md` with YAML
frontmatter and is invoked as a slash command:

| Skill | Invoke | Purpose |
|---|---|---|
| `nestjs-backend` | `/nestjs-backend` | Simple modular NestJS architecture, thin controllers, service logic, DTO validation |
| `typeorm-postgres` | `/typeorm-postgres` | TypeORM entities, repositories, atomic DB transactions, and row locking |
| `testing` | `/testing` | Meaningful Jest tests for the business rules |
| `readme-docs` | `/readme-docs` | Keeping README setup and API documentation complete |
| `code-review` | `/code-review` | Pre-submission review against requirements and over-engineering risks |

These are project skills (committed with the repo), not personal skills.
