# Local DevOps Runbook

This document explains how to run and verify the BOND Sports Account Management API locally.

## Purpose

This project uses a simple local development setup:

- NestJS application runs on the host machine (not containerized)
- The local **database stack** runs in Docker Compose: PostgreSQL + pgAdmin
- TypeORM connects to PostgreSQL through environment variables

This is intentionally local and lightweight for the assessment.

## Canonical Local Commands

| Command | What it does |
|---|---|
| `npm run dev:db` | Start the database stack (PostgreSQL + pgAdmin) |
| `npm run dev:api` | Start the NestJS API on the host (alias for `start:dev`) |
| `npm run dev:check` | Run typecheck + build + tests |
| `npm run dev:db:stop` | Stop containers without deleting data |
| `npm run dev:db:down` | Remove containers but keep the data volume |
| `npm run dev:db:clean` | Remove containers **and delete** the data volume |
| `npm run dev:db:ps` | List stack containers |
| `npm run dev:db:logs` | Follow PostgreSQL + pgAdmin logs |

No Kubernetes, Redis, Kafka, RabbitMQ, microservices, or production deployment infrastructure are used.

---

## Prerequisites

Install:

- Node.js
- npm
- Docker Desktop
- Docker Compose

Verify:

```bash
node -v
npm -v
docker -v
docker compose version
```

---

## First-time Setup

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env
```

Start the database stack (PostgreSQL + pgAdmin):

```bash
npm run dev:db
```

Check the stack containers:

```bash
npm run dev:db:ps
```

Run typecheck + build + tests in one step:

```bash
npm run dev:check
```

Start the API on the host:

```bash
npm run dev:api
```

The API should be available at:

```txt
http://localhost:3000
```

## pgAdmin

pgAdmin starts as part of `npm run dev:db`. Open it at:

```txt
URL:      http://localhost:5051
Email:    admin@bond-sports.com
Password: admin
```

Register the database server inside pgAdmin with:

```txt
Host name/address:    postgres
Port:                 5432
Maintenance database: bond_sports_account
Username:             postgres
Password:             postgres
```

Note: the API (on the host) connects with `DB_HOST=localhost`, while pgAdmin (inside Docker)
connects using the compose service name `postgres`.

Local API logs (request method/path/status/duration and key account actions) are printed to
the terminal running:

```bash
npm run start:dev
```

These are local console logs only — no external logging infrastructure is used.

---

## Environment Variables

The application reads database configuration from `.env`.

Expected variables:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=bond_sports_account
DB_SYNCHRONIZE=true
PGADMIN_PORT=5051
PGADMIN_DEFAULT_EMAIL=admin@bond-sports.com
PGADMIN_DEFAULT_PASSWORD=admin
```

`DB_SYNCHRONIZE=true` is used only for local assessment setup so TypeORM can create the schema automatically.

It should not be treated as a production schema-management strategy.

---

## Stopping the Stack

Stop containers **without** deleting data:

```bash
npm run dev:db:stop
```

Remove containers but **keep** the data volume:

```bash
npm run dev:db:down
```

## Clean Database Restart

Delete the local PostgreSQL data volume only when you intentionally want a fresh database:

```bash
npm run dev:db:clean
```

> **Warning:** `dev:db:clean` deletes the local PostgreSQL data volume.
> Use it only when you intentionally want a fresh database.

Then start fresh:

```bash
npm run dev:db
```

---

## Stop Local API

If the dev server is running normally, stop it with:

```bash
CTRL+C
```

If port 3000 is stuck:

```bash
lsof -ti tcp:3000 | xargs kill -9
```

---

## Smoke Test Flow

After starting PostgreSQL and the API, verify the main flow.

### 1. Create Account

```bash
curl -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "personId": "550e8400-e29b-41d4-a716-446655440000",
    "dailyWithdrawalLimit": "1000.00",
    "accountType": "CHECKING"
  }'
```

Expected:

```txt
201 Created
```

Save the returned `accountId`.

---

### 2. Get Account

```bash
curl http://localhost:3000/accounts/<accountId>
```

Expected:

```txt
200 OK
```

---

### 3. Deposit

```bash
curl -X POST http://localhost:3000/accounts/<accountId>/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "250.00"
  }'
```

Expected:

```txt
200 OK
```

Expected behavior:

- balance increases
- a `DEPOSIT` transaction is created

---

### 4. Withdraw

```bash
curl -X POST http://localhost:3000/accounts/<accountId>/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "50.00"
  }'
```

Expected:

```txt
200 OK
```

Expected behavior:

- balance decreases
- a `WITHDRAWAL` transaction is created

---

### 5. Statement by Period

```bash
curl "http://localhost:3000/accounts/<accountId>/statement?from=2026-01-01&to=2026-12-31"
```

Expected:

```txt
200 OK
```

Expected behavior:

- returns transactions for the account in the requested date range
- date-only `to` includes the full UTC day

---

## Error Smoke Checks

### Invalid Amount

```bash
curl -X POST http://localhost:3000/accounts/<accountId>/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "0"
  }'
```

Expected:

```txt
400 Bad Request
```

---

### Insufficient Funds

```bash
curl -X POST http://localhost:3000/accounts/<accountId>/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "999999.00"
  }'
```

Expected:

```txt
422 Unprocessable Entity
```

---

### Missing Account

```bash
curl http://localhost:3000/accounts/6fa459ea-ee8a-3ca4-894e-db77e160355e
```

Expected:

```txt
404 Not Found
```

---

## Required Verification Before Submission

Run:

```bash
npm run typecheck
npm run build
npm test
```

Expected:

```txt
typecheck passes
build passes
all tests pass
```

---

## Troubleshooting

### PostgreSQL connection failed

Check:

```bash
npm run dev:db:ps
```

Check `.env` values.

When running NestJS locally, `DB_HOST` should usually be:

```env
DB_HOST=localhost
```

Restart the stack (keeps data):

```bash
npm run dev:db:down
npm run dev:db
```

---

### Schema not created

Confirm:

```env
DB_SYNCHRONIZE=true
```

Restart the API.

---

### API behavior looks stale

Stop the server.

If needed:

```bash
lsof -ti tcp:3000 | xargs kill -9
```

Then run:

```bash
npm run build
npm run start:dev
```

---

## Submission Checklist

Before pushing:

```bash
npm run dev:check
npm run dev:db
npm run dev:api
```

Then verify the smoke test flow.

Finally:

```bash
git status
git add .
git commit -m "Complete account management API assessment"
git push
```
