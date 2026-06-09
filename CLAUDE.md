# Account Management API

Backend technical assessment: a small, clean, production-style REST API for account
management and banking transactions.

## Goal
Build a focused, readable, production-quality REST API. Favor clarity over cleverness.

## Tech Stack
- TypeScript
- NestJS
- PostgreSQL
- TypeORM
- Jest

## Business Rules
- A deposit increases the account balance.
- A withdrawal decreases the account balance.
- Every deposit or withdrawal must create a transaction record.
- The balance update and the transaction record must be written in the same DB transaction.
- A withdrawal must validate, in order:
  - account exists
  - account is active
  - amount is positive
  - balance is sufficient
  - daily withdrawal limit is not exceeded

## Out of Scope — Do Not Add
Avoid over-engineering. Do not introduce:
- Kafka, Redis, microservices
- CQRS, event sourcing
- Authentication or authorization
- Payment-provider integrations
- Notification systems
- Swagger (unless explicitly requested)

## Working Conventions
- Keep the implementation simple, readable, and aligned with the assignment.
- Document the API in `README.md`.

## Before Writing Code
Read these in order, then follow the plan
(these docs are not created yet — read them once they exist):
1. `docs/REQUIREMENTS.md`
2. `docs/DOMAIN.md`
3. `docs/DATABASE.md`
4. `docs/API.md`
5. `docs/IMPLEMENTATION_PLAN.md`
