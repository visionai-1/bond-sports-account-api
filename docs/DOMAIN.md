# Domain Model

The domain has two entities: **Account** and **Transaction**.

## Account

Represents a customer account that holds a balance and supports deposits and withdrawals.

| Field | Type | Notes |
|---|---|---|
| accountId | UUID | Primary key |
| personId | UUID | Owner reference (the person who holds the account) |
| balance | numeric(19,4) | Current balance; never stored as float |
| dailyWithdrawalLimit | numeric(19,4) | Max total that can be withdrawn per calendar day |
| activeFlag | boolean | Account must be active to deposit or withdraw |
| accountType | enum (AccountType) | Supported account types |
| createDate | timestamptz | Creation timestamp |

## Transaction

An immutable record of a single deposit or withdrawal. Represents history, not state.

| Field | Type | Notes |
|---|---|---|
| transactionId | UUID | Primary key |
| accountId | UUID | Foreign key → Account |
| value | numeric(19,4) | Positive amount moved |
| type | enum (TransactionType) | `DEPOSIT` or `WITHDRAWAL` |
| transactionDate | timestamptz | When the transaction occurred (used for statement filtering) |

## Relationships

- One **Account** has many **Transactions**.
- One **Transaction** belongs to one **Account**.

## Business Rules

- A **deposit** increases `Account.balance` and writes a `DEPOSIT` transaction.
- A **withdrawal** decreases `Account.balance` and writes a `WITHDRAWAL` transaction.
- Balance update and transaction creation happen in the **same DB transaction** (atomic).
- A **withdrawal** is rejected unless, in order: account exists → account is active →
  amount is positive → balance is sufficient → daily withdrawal limit is not exceeded.
- The **daily withdrawal limit** compares `dailyWithdrawalLimit` against
  (sum of today's `WITHDRAWAL` values for the account) + the requested amount.
- Balance-changing operations acquire a **row lock** on the account so concurrent withdrawals
  cannot both read a stale balance and overdraw.

## Enums

- **AccountType** — supported account types (e.g. `CHECKING`, `SAVINGS`). Final set defined
  with the entity.
- **TransactionType** — `DEPOSIT`, `WITHDRAWAL`.
