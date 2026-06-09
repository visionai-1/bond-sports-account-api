---
name: readme-docs
description: Use when creating or updating README documentation for setup, execution, API documentation, technical decisions, and assessment submission readiness.
---

# README Documentation Skill

Use this skill when creating or updating `README.md`.

The README is the API documentation for this assessment.

Do not add Swagger unless explicitly requested.

## README Must Include

- Project overview
- Tech stack
- Setup instructions
- Environment variables
- Docker Compose instructions for PostgreSQL
- How to install dependencies
- How to run the API
- How to run tests
- API documentation
- Request and response examples
- Error examples
- Project architecture
- Technical decisions
- Out of scope section

## API Documentation Must Include

Document these endpoints:

- `POST /accounts`
- `GET /accounts/:accountId`
- `POST /accounts/:accountId/deposit`
- `POST /accounts/:accountId/withdraw`
- `GET /accounts/:accountId/statement?from=&to=`

For each endpoint include:

- Purpose
- Request body if relevant
- Query params if relevant
- Example response
- Common errors if relevant

## Project Architecture Section

Explain:

- Module
- Controller
- Service
- Repository
- Entity
- DTO

Clarify that modules are not repositories.

Use this meaning:

- Module = groups feature providers and dependencies
- Controller = handles REST HTTP requests
- Service = contains business logic
- Repository = handles database access
- Entity = maps database tables
- DTO = validates request payloads

## Technical Decisions Section

Mention:

- TypeORM was selected because banking-style operations benefit from clear transaction and row-locking support.
- API documentation is kept in README to avoid unnecessary tooling.
- Docker Compose is used only for local PostgreSQL setup.
- The project intentionally avoids over-engineering.

## Out of Scope

Explicitly mention that these were not added because they are outside the assignment scope:

- Swagger
- Authentication
- Authorization
- Redis
- Kafka
- RabbitMQ
- Microservices
- CQRS
- Event sourcing
- Payment provider integrations
