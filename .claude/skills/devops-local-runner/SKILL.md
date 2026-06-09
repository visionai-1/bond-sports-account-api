---
name: devops-local-runner
description: Use when running, verifying, or troubleshooting the local NestJS + PostgreSQL + TypeORM environment for this assessment. Focuses on Docker Compose, clean database startup, environment variables, dependency installation, build, tests, and smoke checks without adding production DevOps complexity.
---

# DevOps Local Runner Skill

Use this skill when working on local execution, Docker Compose, PostgreSQL, TypeORM connectivity, NestJS startup, test execution, or smoke testing.

## Scope

This project is a backend technical assessment, not a production deployment platform.

Keep DevOps simple and local.

Allowed:

- Docker Compose for the local database stack (PostgreSQL + pgAdmin)
- pgAdmin as an official local developer tool (DB inspection UI), not production infrastructure
- `.env.example`
- local `.env`
- npm install
- NestJS local start
- typecheck
- build
- Jest tests
- simple curl smoke tests

Not allowed unless explicitly requested:

- Kubernetes
- Docker Swarm
- CI/CD pipelines
- Redis
- Kafka
- RabbitMQ
- Nginx
- API Gateway
- production deployment scripts
- cloud infrastructure
- Terraform
- Helm
- multi-service architecture

## Required Local Stack

- Node.js
- npm
- Docker
- Docker Compose
- PostgreSQL container
- pgAdmin container (local DB UI, part of the official stack)
- NestJS application (runs on the host, not containerized)
- TypeORM connection through environment variables

## Environment Rules

Use `.env.example` as the source of truth for required environment variables.

Expected variables:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SYNCHRONIZE`
- `PGADMIN_PORT`
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`

For local development, `DB_SYNCHRONIZE=true` is acceptable for this assessment.

Do not present `synchronize=true` as a production recommendation.

## Standard Local Run Flow

Use this order:

```bash
npm install
cp .env.example .env
npm run dev:db      # starts PostgreSQL + pgAdmin
npm run dev:check   # typecheck + build + tests
npm run dev:api     # starts the NestJS API on the host
```

Key facts:

- `dev:db` starts the database stack: PostgreSQL **and** pgAdmin.
- `dev:api` starts the NestJS API on the host (the API is not containerized).
- `dev:check` runs typecheck, build, and Jest tests.
- pgAdmin is an official part of the local Docker stack (local DB UI), not production infrastructure.
- pgAdmin UI: http://localhost:5051 (`admin@bond-sports.com` / `admin`); inside pgAdmin connect to
  host `postgres`, port `5432`, database `bond_sports_account`.

## Safety Rules (must follow)

- The pgAdmin email must be `admin@bond-sports.com`. **Never** use `admin@bond-sports.local` —
  pgAdmin rejects the `.local` domain and the container will crash-loop on startup.
- **Never** run `npm run dev:db:clean` unless the user explicitly requests it — it deletes the
  local PostgreSQL data volume.
- **Never** delete Docker volumes (`docker volume rm`, `docker compose down -v`, `docker system
  prune`) unless the user explicitly requests it.

Then run smoke checks against:

- `POST /accounts`
- `GET /accounts/:accountId`
- `POST /accounts/:accountId/deposit`
- `POST /accounts/:accountId/withdraw`
- `GET /accounts/:accountId/statement?from=&to=`

## Clean Restart Flow

When a clean DB is needed (this **deletes** the local data volume — use intentionally):

```bash
npm run dev:db:clean
npm run dev:db
```

To stop or remove the stack without deleting data, use `npm run dev:db:stop` (keeps containers)
or `npm run dev:db:down` (removes containers, keeps the data volume).

If the NestJS dev server is stuck or stale on port 3000:

```bash
lsof -ti tcp:3000 | xargs kill -9
```

Only use this for local cleanup.

## Verification Checklist

Before saying the project is ready, verify:

```bash
npm run typecheck
npm run build
npm test
```

If doing a live smoke test, verify:

- PostgreSQL container is running
- API starts successfully
- all 5 endpoints respond
- deposit and withdrawal update balance
- statement returns the created transactions
- error cases return documented status codes

## Troubleshooting

If DB connection fails:

1. Check Docker is running.
2. Check `npm run dev:db:ps`.
3. Check `.env` matches `docker-compose.yml`.
4. Check `DB_HOST=localhost` when running NestJS locally.
5. Check `DB_PORT=5432`.
6. Restart (keeping data) with `npm run dev:db:down && npm run dev:db`.

If schema is missing:

1. Confirm `DB_SYNCHRONIZE=true` for local development.
2. Restart the API after Postgres is ready.

If API still returns stale behavior:

1. Stop the dev server.
2. Kill port 3000 if needed.
3. Rebuild.
4. Start again.

## Output Style

When performing DevOps work, always report:

1. Commands executed.
2. Files changed.
3. Command results.
4. Whether Docker/PostgreSQL started successfully.
5. Whether the API started successfully.
6. Whether tests passed.
7. Any mismatch between README commands and real behavior.
8. Whether the project is ready for submission.
