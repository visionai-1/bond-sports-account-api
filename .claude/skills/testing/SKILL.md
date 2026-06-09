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
10. Statement endpoint filters transactions by period.

## Test Style

- Use Jest.
- Prefer clear arrange-act-assert structure.
- Keep tests readable.
- Avoid testing implementation details.
- Test behavior through services or e2e endpoints where appropriate.
- Do not chase high coverage numbers at the expense of clarity.

## Error Testing

Validate relevant HTTP status codes or exception types:

- Not found account
- Inactive account
- Invalid amount
- Insufficient funds
- Daily withdrawal limit exceeded

## Avoid

Do not add complex test infrastructure unless required.

Do not mock everything if a simple integration or e2e test gives better confidence.
