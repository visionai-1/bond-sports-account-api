# Test Plan

Jest tests focused on proving the business rules, not chasing coverage numbers. Prefer
arrange-act-assert, test behavior through service-level and pipe-level unit tests, avoid over-mocking.

## Testing scope

**Unit tests are the primary coverage** (2 suites / 23 tests): service business rules, and
request-boundary validation by exercising the NestJS `ParseUUIDPipe` and `ValidationPipe`
directly (no HTTP server, no DB).

A **small, focused E2E suite** (1 suite / 5 tests) complements it: it drives the real Nest
application over HTTP (`@nestjs/testing` + `supertest`) against a **real PostgreSQL** database to
prove routing → validation → controller → service → repository → DB wiring. E2E covers one HTTP
happy path plus a few HTTP error boundaries — it deliberately does **not** duplicate the unit
suite. E2E runs against a **dedicated** database `bond_sports_account_e2e` (separate from the dev
database) via `npm run test:e2e`; `npm test` stays unit-only.

## Test layout

Tests live under a top-level `tests/` tree, organized by module, with reusable setup in `shared/`:

```txt
tests/
├── accounts/accounts.service.spec.ts   # business-rule unit tests
├── common/validation.spec.ts           # ParseUUIDPipe / ValidationPipe boundary (400) tests
├── e2e/accounts.e2e-spec.ts            # HTTP E2E vs real PostgreSQL (dedicated DB)
├── shared/                             # mocks, builders, factories, types (no test cases)
│   ├── mocks/repositories.mock.ts
│   ├── builders/{account,transaction}.builder.ts
│   ├── factories/test-data.factory.ts  # createAccountsServiceHarness()
│   ├── types/test.types.ts
│   └── index.ts                        # barrel
└── jest-e2e.json                       # separate Jest config for the E2E suite
```

## Priority Cases

| # | Case | Level | Expected |
|---|---|---|---|
| 1 | Create account succeeds | unit | account created with balance 0 |
| 2 | Deposit increases balance | unit | balance += amount |
| 3 | Deposit creates a transaction record | unit | one `DEPOSIT` row with the value |
| 4 | Withdrawal decreases balance | unit | balance -= amount |
| 5 | Withdrawal creates a transaction record | unit | one `WITHDRAWAL` row with the value |
| 6 | Withdrawal fails when account inactive | unit | rejected (inactive), no balance change |
| 7 | Withdrawal fails when amount not positive | unit | rejected (invalid amount) |
| 8 | Withdrawal fails when balance insufficient | unit | rejected (insufficient funds) |
| 9 | Withdrawal fails when daily limit exceeded | unit | rejected (daily limit) |
| 10 | Statement filters transactions by period | unit | whole-day inclusive UTC range: `from` normalized to start of its UTC day, `to` handled as an exclusive upper bound of the next UTC day |

## Atomicity & Concurrency

- Verify that when a withdrawal fails validation, **neither** the balance changes **nor** a
  transaction row is created (rollback).
- (Optional, if time allows) a concurrency test: two simultaneous withdrawals on the same
  account cannot both succeed past the available balance — row locking holds.

## Error Assertions

Assert the failure mode for each negative case (HTTP status or exception type):

- Account not found
- Inactive account
- Invalid amount
- Insufficient funds
- Daily withdrawal limit exceeded

## Test Style Notes

- Use Jest.
- Service-level unit tests for business rules; pipe-level unit tests for request-boundary
  validation (`ParseUUIDPipe` / `ValidationPipe`).
- Keep tests at the unit level — no HTTP server, no real database, no heavy infrastructure.

## E2E suite (`tests/e2e/accounts.e2e-spec.ts`)

Real Nest app + `supertest` + real PostgreSQL. Kept intentionally small:

1. Full HTTP happy path: create → get → deposit → withdraw → statement (asserts the statement
   contains both a `DEPOSIT` and a `WITHDRAWAL`).
2. `GET /accounts/not-a-uuid` → `400` (ParseUUIDPipe).
3. `GET /accounts/<valid-but-missing-uuid>` → `404`.
4. Withdraw more than balance → `422`.
5. Statement `from > to` → `400`.

Setup: env points the app at `bond_sports_account_e2e` with `DB_SYNCHRONIZE=true` before the
module is built; each test truncates `transactions, accounts CASCADE` (guarded to run only inside
the E2E database); the app is closed after the suite. Run via:

```bash
npm run dev:db
npm run dev:db:e2e:create
npm run test:e2e
```
