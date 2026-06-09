---
name: typeorm-postgres
description: Use when implementing PostgreSQL and TypeORM entities, repositories, migrations, transactions, and locking for the account management assessment.
---

# TypeORM PostgreSQL Skill

Use this skill when working with TypeORM, PostgreSQL, entities, repositories, and database transactions.

## Database Rules

- Use PostgreSQL as the database.
- Use TypeORM entities.
- Use UUID primary keys unless the existing project setup uses another consistent identifier.
- Use PostgreSQL `numeric` or `decimal`-compatible columns for money fields.
- Do not use floating point types for money.

Account must include:

- accountId
- personId
- balance
- dailyWithdrawalLimit
- activeFlag
- accountType
- createDate

Transaction must include:

- transactionId
- accountId
- value
- type
- transactionDate

## Relationships

- One Account has many Transactions.
- One Transaction belongs to one Account.

## Repository Layer

Use lightweight repository classes:

- `account.repository.ts`
- `transaction.repository.ts`

The repository layer should handle database access.

The service layer should contain business decisions.

Do not create a generic repository framework.

## Transaction Safety

Deposit and withdrawal must run inside a database transaction.

Deposit must:

1. Lock or safely load the account.
2. Validate account state.
3. Increase balance.
4. Create a transaction record with type `DEPOSIT`.
5. Commit both changes atomically.

Withdrawal must:

1. Lock or safely load the account.
2. Validate account state.
3. Validate positive amount.
4. Validate sufficient balance.
5. Validate daily withdrawal limit.
6. Decrease balance.
7. Create a transaction record with type `WITHDRAWAL`.
8. Commit both changes atomically.

## Locking

For balance-changing operations, prefer a row lock such as pessimistic write / `SELECT FOR UPDATE`.

This prevents concurrent withdrawals from reading the same balance and both succeeding incorrectly.

## Indexes

Add useful indexes where appropriate:

- transactions.accountId
- transactions.accountId + transactionDate
- transactions.accountId + type + transactionDate

## Avoid

Do not introduce:

- Event sourcing
- CQRS
- Ledger architecture beyond the assignment
- Queues
- Cache
- External payment integrations
