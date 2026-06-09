# Database

PostgreSQL schema for the account management API, managed with TypeORM.

## Conventions

- **Primary keys:** UUID (`uuid` column, generated).
- **Money:** PostgreSQL `numeric(19,4)`. Never `float`/`double` — floating point introduces
  rounding errors unacceptable for balances.
- **Timestamps:** `timestamptz`.
- **Enums:** stored as Postgres enum types or `varchar` with a TypeORM enum constraint.

## Tables

### `accounts`

| Column | Type | Constraints |
|---|---|---|
| account_id | uuid | PK, default generated |
| person_id | uuid | NOT NULL |
| balance | numeric(19,4) | NOT NULL, default 0 |
| daily_withdrawal_limit | numeric(19,4) | NOT NULL |
| active_flag | boolean | NOT NULL, default true |
| account_type | varchar / enum | NOT NULL |
| create_date | timestamptz | NOT NULL, default now() |

### `transactions`

| Column | Type | Constraints |
|---|---|---|
| transaction_id | uuid | PK, default generated |
| account_id | uuid | NOT NULL, FK → accounts(account_id) |
| value | numeric(19,4) | NOT NULL, > 0 |
| type | varchar / enum | NOT NULL (`DEPOSIT` \| `WITHDRAWAL`) |
| transaction_date | timestamptz | NOT NULL, default now() |

## Relationship

- `transactions.account_id` → `accounts.account_id` (many transactions per account).

## Indexes

To support statement filtering and the daily-limit check:

- `transactions(account_id)`
- `transactions(account_id, transaction_date)` — statement filtering by period.
- `transactions(account_id, type, transaction_date)` — daily withdrawal sum.

## Transaction Safety & Locking

Deposit and withdrawal run inside a single DB transaction:

1. `SELECT ... FOR UPDATE` the account row (pessimistic write lock).
2. Validate account state (and, for withdrawal, amount/balance/daily limit).
3. Update `balance`.
4. Insert the `transactions` row (`DEPOSIT` or `WITHDRAWAL`).
5. Commit — both the balance update and the transaction insert succeed together, or roll back.

The row lock prevents two concurrent withdrawals from reading the same balance and both
succeeding, which would overdraw the account.

## Migrations

TypeORM migrations create the two tables, the FK, and the indexes above. Schema is not
auto-synchronized in non-dev environments.
