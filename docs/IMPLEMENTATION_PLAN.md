# Implementation Plan

Ordered build steps. Each step is small and independently verifiable. Keep controllers thin,
business logic in services, database access in repositories. No over-engineering.

## 1. Scaffold
- Initialize the NestJS project (TypeScript, Jest preset).
- Add TypeORM + `pg`, class-validator/class-transformer.
- `docker-compose.yml` for the local database stack (PostgreSQL + pgAdmin); the API runs on the
  host (not containerized). `.env.example` with DB connection vars.
- Configure TypeORM (data source). For this assessment/local development the schema is created
  directly from entities via `DB_SYNCHRONIZE=true` — no migrations are used. (In a non-dev
  environment you would set `synchronize: false` and manage schema with migrations instead.)

## 2. Enums & Entities
- `account-type.enum.ts`, `transaction-type.enum.ts` (`DEPOSIT`, `WITHDRAWAL`).
- `account.entity.ts`, `transaction.entity.ts` per `DOMAIN.md` / `DATABASE.md`
  (UUID PKs, `numeric(19,4)` money, `timestamptz`, Account→Transaction relation).
- Tables, FK, and indexes are derived from the entities (TypeORM `synchronize`); no migration files.

## 3. Repositories (lightweight)
- `account.repository.ts` — find by id, find-for-update (row lock), save.
- `transaction.repository.ts` — create record, sum of today's withdrawals, find by
  account + period (statement).
- No generic repository framework.

## 4. Services (business logic)
- `accounts.service.ts`:
  - createAccount
  - getAccount
  - deposit — within a DB transaction: lock account → validate active → add → write `DEPOSIT`.
  - withdraw — within a DB transaction: lock account → validate (exists → active → positive →
    sufficient → daily limit) → subtract → write `WITHDRAWAL`.
  - getStatement — statement query (filter by period), delegating to the transaction repository.
- The transactions module is data-only (no `transactions.service.ts`): the statement period query
  and daily-withdrawal sum live in `transaction.repository.ts`, orchestrated by `accounts.service.ts`.

## 5. DTOs & Controllers
- DTOs: `create-account.dto.ts`, `deposit.dto.ts`, `withdraw.dto.ts`, `statement-query.dto.ts`
  with class-validator decorators (positive amount, required fields, valid dates).
- `accounts.controller.ts` exposes the 5 endpoints from `API.md`; thin — delegates to services.

## 6. Error handling
- `common/errors` domain errors extend Nest `HttpException` subclasses, mapping to the HTTP
  responses in `API.md` (404 not found, 409 inactive, 422 insufficient / daily limit, 400 invalid).

## 6a. Logging (lightweight)
- A small logging module lives under `src/common/logging` (`AppLoggerService` wrapping the
  NestJS `Logger`, plus a global `RequestLoggingInterceptor`).
- Logs request method/path/status/duration and key account actions; uses only the built-in
  Logger, no external logging infrastructure (see `DECISIONS.md`).

## 7. Tests
- Implement the cases in `TEST_PLAN.md` as unit tests under `tests/`: service-level unit tests for
  business rules + pipe-level unit tests for request-boundary validation.
- Include the rollback assertion (failed withdrawal changes nothing).
- Add a small, focused E2E suite under `tests/e2e` (`@nestjs/testing` + `supertest` against a
  dedicated PostgreSQL database) to prove HTTP routing/validation/DB wiring. Keep it minimal — one
  happy path plus a few error boundaries; no heavy test infrastructure.

## 8. README API docs
- Fill the README API Documentation section from `API.md` (request/response + error examples).
- Verify setup/install/run/test commands work end-to-end against Docker Postgres.

## Definition of Done
- All 5 endpoints work against a real Postgres (Docker Compose).
- Deposit/withdraw are atomic and row-locked; money is `numeric`, not float.
- All `TEST_PLAN.md` cases pass.
- README documents setup, run, tests, and the full API.
- No out-of-scope tech added (see `DECISIONS.md`).
