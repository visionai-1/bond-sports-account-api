# API

REST API contracts. All request/response bodies are JSON. Amounts are decimal strings or
numbers serialized without floating-point loss. This file is the source for the README API section.

Base path: `/`

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/accounts` | Create an account |
| GET | `/accounts/:accountId` | Get an account and its balance |
| POST | `/accounts/:accountId/deposit` | Deposit funds |
| POST | `/accounts/:accountId/withdraw` | Withdraw funds |
| GET | `/accounts/:accountId/statement?from=&to=` | List transactions in a period |

---

### POST /accounts

Create a new account.

**Request body**
```json
{
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "accountType": "CHECKING",
  "dailyWithdrawalLimit": "1000.00"
}
```

**201 Created**
```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "accountType": "CHECKING",
  "balance": "0.0000",
  "dailyWithdrawalLimit": "1000.0000",
  "activeFlag": true,
  "createDate": "2026-06-08T12:00:00.000Z"
}
```

**Errors** — `400` invalid payload (missing personId, unknown accountType, non-positive limit).

---

### GET /accounts/:accountId

Retrieve an account with its current balance.

**200 OK**
```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "accountType": "CHECKING",
  "balance": "150.0000",
  "dailyWithdrawalLimit": "1000.0000",
  "activeFlag": true,
  "createDate": "2026-06-08T12:00:00.000Z"
}
```

**Errors** — `404` account not found.

---

### POST /accounts/:accountId/deposit

Increase the balance and record a `DEPOSIT` transaction (atomic).

**Request body**
```json
{ "amount": "100.00" }
```

**200 OK**
```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "balance": "250.0000",
  "transaction": {
    "transactionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "type": "DEPOSIT",
    "value": "100.0000",
    "transactionDate": "2026-06-08T12:05:00.000Z"
  }
}
```

**Errors**
- `400` amount not positive.
- `404` account not found.
- `409` account inactive.

---

### POST /accounts/:accountId/withdraw

Decrease the balance and record a `WITHDRAWAL` transaction (atomic). Validates, in order:
account exists → active → amount positive → sufficient balance → daily limit not exceeded.

**Request body**
```json
{ "amount": "50.00" }
```

**200 OK**
```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "balance": "200.0000",
  "transaction": {
    "transactionId": "16fd2706-8baf-433b-82eb-8c7fada847da",
    "type": "WITHDRAWAL",
    "value": "50.0000",
    "transactionDate": "2026-06-08T12:10:00.000Z"
  }
}
```

**Errors**
- `400` amount not positive.
- `404` account not found.
- `409` account inactive.
- `422` insufficient balance.
- `422` daily withdrawal limit exceeded.

---

### GET /accounts/:accountId/statement?from=&to=

List the account's transactions within `[from, to]`. `from` and `to` are ISO dates/datetimes.

**Query params**

| Param | Required | Description |
|---|---|---|
| from | yes | Start of period (inclusive) |
| to | yes | End of period (inclusive) |

**200 OK**
```json
{
  "accountId": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  "from": "2026-06-01",
  "to": "2026-06-08",
  "transactions": [
    { "transactionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "type": "DEPOSIT", "value": "100.0000", "transactionDate": "2026-06-02T09:00:00.000Z" },
    { "transactionId": "16fd2706-8baf-433b-82eb-8c7fada847da", "type": "WITHDRAWAL", "value": "50.0000", "transactionDate": "2026-06-05T15:30:00.000Z" }
  ]
}
```

**Errors**
- `400` missing/invalid `from` or `to` (or `from` after `to`).
- `404` account not found.

---

## Error Shape

Errors use Nest's standard structure, produced by the framework's default exception handling:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Insufficient balance"
}
```

For DTO/param validation failures (`400`), the framework's `ValidationPipe` returns `message` as
an **array** of field-level messages, e.g.:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["amount must be a number string"]
}
```
