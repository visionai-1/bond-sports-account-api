# Requirements

Account Management REST API for the BOND Sports backend assessment.

## Functional Requirements

### Account management
- Create an account.
- Retrieve a single account by id (including its current balance).

### Deposit
- Deposit a positive amount into an account.
- A deposit increases the account balance.
- A deposit creates a `DEPOSIT` transaction record.

### Withdrawal
- Withdraw a positive amount from an account.
- A withdrawal decreases the account balance.
- A withdrawal creates a `WITHDRAWAL` transaction record.

### Statement
- Retrieve an account's transactions filtered by a period (`from` / `to` dates).

### Transactions
- Every deposit and every withdrawal must create exactly one transaction record.
- The balance update and the transaction record are written in the **same database transaction**
  (atomic — both succeed or both roll back).

## Withdrawal Validations (in order)

A withdrawal must validate, in this order, and fail fast on the first violation:

1. Account exists.
2. Account is active.
3. Amount is positive.
4. Balance is sufficient.
5. Daily withdrawal limit is not exceeded.

The daily withdrawal limit is evaluated against the sum of withdrawals already made for the
account on the same calendar day plus the requested amount.

## Non-Functional Requirements

- **Stack:** TypeScript, NestJS, PostgreSQL, TypeORM, Jest.
- **Consistency:** balance-changing operations run inside a DB transaction with row locking
  (`SELECT FOR UPDATE`) to prevent concurrent withdrawals from over-drawing.
- **Money precision:** monetary fields use PostgreSQL `numeric`/`decimal`, never floating point.
- **Error handling:** clear, consistent HTTP errors for each failure mode (see `API.md`).
- **Validation:** request payloads validated via DTOs with class-validator decorators.
- **Tests:** meaningful Jest tests proving the business rules (see `TEST_PLAN.md`).
- **Documentation:** API documented in `README.md` (no Swagger).

## Out of Scope

Swagger, authentication, authorization, Redis, Kafka, RabbitMQ, microservices, CQRS,
event sourcing, API Gateway, notification systems, and payment-provider integrations.
See `DECISIONS.md` for rationale.
