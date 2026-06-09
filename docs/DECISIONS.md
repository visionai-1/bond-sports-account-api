# Architecture Decisions

## Repository Layer

A lightweight repository layer is used to separate database access from business logic.

This is intentionally kept simple.

The project does not use complex patterns such as CQRS, event sourcing, microservices, Redis, Kafka, or message queues, because they are outside the scope of this assessment.

## ORM: TypeORM

TypeORM was selected because banking-style operations benefit from first-class support for
database transactions and row-level locking (`SELECT FOR UPDATE` via pessimistic write locks),
which are needed to keep balance updates and transaction records atomic and concurrency-safe.

## API Documentation: README, not Swagger

API documentation lives in `README.md`. Swagger is not added because it introduces tooling and
decorators that are unnecessary for an assessment of this size; a clear README with request,
response, and error examples communicates the contract just as well.

## Docker Compose: local database stack

Docker Compose is used for the local database stack: PostgreSQL and pgAdmin.

PostgreSQL is required for the API.

pgAdmin is included as a local developer/reviewer tool so the database, accounts, and transactions can be inspected through a UI.

The NestJS API itself is intentionally not containerized for this assessment; it runs on the host with `npm run dev:api` / `npm run start:dev` to keep the feedback loop simple.

pgAdmin is local development tooling, not production observability or deployment infrastructure.

## No Authentication / Authorization

No auth is added. It is outside the assignment scope, and adding it would obscure the core domain
(accounts and transactions) without demonstrating anything the assessment asks for.

## No Redis / Kafka / Microservices

The service is a single, modular NestJS application. Redis, Kafka/RabbitMQ, and microservices are
not added because the workload is a straightforward CRUD-plus-transaction API that one process and
PostgreSQL handle correctly; these would be premature complexity.

## Money: numeric/decimal, not float

Monetary fields (`balance`, `dailyWithdrawalLimit`, transaction `value`) use PostgreSQL
`numeric`/`decimal`. Floating-point types are avoided because binary floats cannot represent
decimal currency exactly and accumulate rounding errors — unacceptable for balances.

## Deposit & Withdrawal: single DB transaction

Each deposit and withdrawal updates the balance and inserts a transaction record inside one
database transaction, so the two writes are atomic — both commit or both roll back. A balance can
never change without a corresponding transaction record, and vice versa.

## Withdrawal: row locking

Balance-changing operations lock the account row (`SELECT FOR UPDATE`) before reading the balance.
This prevents two concurrent withdrawals from both reading the same balance and both succeeding,
which would overdraw the account. A safe atomic conditional update is an acceptable alternative,
but pessimistic locking keeps the validation logic explicit and readable.

## Logging

NestJS built-in Logger is used for local API and domain-action logging.

External logging platforms, tracing tools, and logging libraries are intentionally avoided because the assessment focuses on backend API correctness, not production observability infrastructure.
