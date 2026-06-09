# Test Plan

Jest tests focused on proving the business rules, not chasing coverage numbers. Prefer
arrange-act-assert, test behavior through services or e2e endpoints, avoid over-mocking.

## Priority Cases

| # | Case | Level | Expected |
|---|---|---|---|
| 1 | Create account succeeds | unit / e2e | 201, account persisted with balance 0 |
| 2 | Deposit increases balance | unit | balance += amount |
| 3 | Deposit creates a transaction record | unit | one `DEPOSIT` row with the value |
| 4 | Withdrawal decreases balance | unit | balance -= amount |
| 5 | Withdrawal creates a transaction record | unit | one `WITHDRAWAL` row with the value |
| 6 | Withdrawal fails when account inactive | unit | rejected (inactive), no balance change |
| 7 | Withdrawal fails when amount not positive | unit | rejected (invalid amount) |
| 8 | Withdrawal fails when balance insufficient | unit | rejected (insufficient funds) |
| 9 | Withdrawal fails when daily limit exceeded | unit | rejected (daily limit) |
| 10 | Statement filters transactions by period | e2e | whole-day inclusive UTC range: `from` normalized to start of its UTC day, `to` handled as an exclusive upper bound of the next UTC day |

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
- Service-level unit tests for business rules; e2e for endpoint wiring and the statement filter.
- Do not add heavy test infrastructure; a simple integration/e2e test often gives more
  confidence than fully mocked units.
