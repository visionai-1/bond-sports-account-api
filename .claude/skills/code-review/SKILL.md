---
name: code-review
description: Use before finalizing the assessment. Reviews the codebase against the requirements, architecture, transaction safety, tests, README, and over-engineering risks.
---

# Code Review Skill

Use this skill before finalizing or submitting the assessment.

## Review Checklist

Check the project against the assignment requirements.

## Required Stack

Verify the project uses:

- TypeScript
- NestJS
- PostgreSQL

## Required Features

Verify:

- Account entity exists.
- Transaction entity exists.
- Create account works.
- Get account works.
- Deposit works.
- Withdrawal works.
- Statement filtering by period works.
- Deposit creates a transaction record.
- Withdrawal creates a transaction record.

## Business Rules

Verify:

- Amount must be positive.
- Account must exist.
- Account must be active for deposit and withdrawal.
- Withdrawal fails if balance is insufficient.
- Withdrawal fails if daily withdrawal limit is exceeded.
- Deposit and withdrawal use database transactions.
- Balance update and transaction creation are atomic.
- Concurrency risk is handled with locking or safe atomic update logic.

## Architecture Review

Verify:

- Controllers are thin.
- Services contain business logic.
- Repositories contain database access.
- DTOs validate incoming payloads.
- Entities map database tables.
- No unnecessary abstraction was added.

## Error Handling

Verify errors are clear and consistent for:

- Account not found
- Invalid amount
- Inactive account
- Insufficient funds
- Daily withdrawal limit exceeded

## Tests

Verify tests cover:

- Deposit
- Withdrawal
- Insufficient funds
- Inactive account
- Daily withdrawal limit
- Statement filtering by period

## README

Verify README includes:

- Setup instructions
- Environment variables
- Docker Compose usage
- Run commands
- Test commands
- API documentation
- Request and response examples
- Error examples
- Architecture explanation
- Technical decisions
- Out of scope section

## Over Engineering Check

Flag any unnecessary addition:

- Swagger
- Authentication
- Authorization
- Redis
- Kafka
- RabbitMQ
- Microservices
- CQRS
- Event sourcing
- API Gateway
- Payment providers
- Notification systems

## Final Response

After review, provide:

1. What is good.
2. What must be fixed before submission.
3. What is optional.
4. Whether the project is ready to submit.
