---
name: testing
description: Use when adding or reviewing Jest tests for the account management API. Focuses on meaningful business rule tests instead of unnecessary coverage.
---

# Testing Skill

Use this skill when writing or reviewing tests for this assessment.

## Testing Priority

Prefer meaningful tests that prove the business rules work.

Test these cases first:

1. Creating an account succeeds.
2. Deposit increases balance.
3. Deposit creates a transaction record.
4. Withdrawal decreases balance.
5. Withdrawal creates a transaction record.
6. Withdrawal fails when account is inactive.
7. Withdrawal fails when amount is not positive.
8. Withdrawal fails when balance is insufficient.
9. Withdrawal fails when daily withdrawal limit is exceeded.
10. Statement filters transactions by period.

## Test Style

- Use Jest.
- Prefer clear arrange-act-assert structure.
- Keep tests readable.
- Avoid testing implementation details.
- Test behavior through service-level unit tests and pipe-level validation tests.
- Do not chase high coverage numbers at the expense of clarity.

## Error Testing

Validate relevant HTTP status codes or exception types:

- Not found account
- Inactive account
- Invalid amount
- Insufficient funds
- Daily withdrawal limit exceeded

## Project test rules

- Default to **unit tests** under `tests/<module>/` (e.g. `tests/accounts/`, `tests/common/`).
- Put shared utilities under `tests/shared/` and reuse the existing builders, mocks, and factories
  there (`buildAccount`, `buildTransaction`, `createAccountsServiceHarness`, etc.).
- Never place specs under `src/`.
- Prefer service-level unit tests and pipe-level validation tests; `npm test` is unit-only.
- A small **E2E** suite exists under `tests/e2e/` (`@nestjs/testing` + `supertest`, run via
  `npm run test:e2e` with config `tests/jest-e2e.json`). When working on E2E:
  - It must use the dedicated database `bond_sports_account_e2e` — **never** the dev DB
    `bond_sports_account`. Cleanup (`TRUNCATE`) must be guarded to the E2E DB only.
  - Keep E2E minimal (HTTP happy path + a few error boundaries); do not duplicate the unit suite.
- Do not add **more** / broad E2E coverage, Testcontainers, or other test infrastructure unless the
  user explicitly requests it.

## Avoid

Do not add complex test infrastructure unless required.

Do not over-mock; keep unit tests focused and readable. Keep the E2E suite small and intentional.
