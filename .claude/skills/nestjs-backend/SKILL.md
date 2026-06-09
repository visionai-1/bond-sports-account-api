---
name: nestjs-backend
description: Use when implementing or modifying NestJS backend code for this assessment. Enforces simple modular architecture, thin controllers, service-based business logic, DTO validation, and no over-engineering.
---

# NestJS Backend Skill

Use this skill when writing or reviewing NestJS backend code in this project.

## Architecture Rules

- Keep controllers thin.
- Controllers should only handle routing, request DTOs, params, query params, and HTTP responses.
- Put business logic inside services.
- Put database access inside repository classes.
- Use DTOs with validation decorators for request payloads.
- Use clear NestJS HTTP exceptions.
- Keep module boundaries simple and readable.

## Domain Rules

- Account operations belong in the accounts module.
- Transaction history logic belongs in the transactions module.
- Deposit and withdrawal are account operations.
- Transaction records represent history.

## Avoid

Do not add:

- Authentication
- Authorization
- Swagger
- Redis
- Kafka
- RabbitMQ
- CQRS
- Event sourcing
- Microservices
- API Gateway
- Generic abstraction layers that are not needed for the assignment

## Output Style

When implementing code:

1. Explain the files you are going to touch.
2. Implement only what is required.
3. Keep code readable and idiomatic NestJS.
4. Prefer simple names over clever abstractions.
5. After changes, mention what should be tested.
