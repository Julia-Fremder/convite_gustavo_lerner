# Backend setup instructions

This backend now persists data in PostgreSQL (not CSV). It exposes endpoints for confirmations and payments and auto-initializes the required tables.

## Quick Start

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment:
Create a `.env` file in `backend/` (or set env vars) with:
```bash
DATABASE_URL=postgres://user:password@host:port/dbname
# Optional: force TLS behavior
# DATABASE_SSL=true    # enable SSL with rejectUnauthorized: false
# DATABASE_SSL=false   # disable SSL (use for localhost)
PORT=5000
```

3. Start the backend server:
```bash
npm start
# or during development
npm run dev
```

The server runs on `http://localhost:5000` by default. In the frontend, set `REACT_APP_API_BASE_URL` to the backend URL (e.g. `http://localhost:5000`).

## Database & Migrations

- On startup, the server creates or migrates the tables `confirmations` and `payments`.
- `payments.status` supports `pending`, `received`, and `canceled`.
- SSL is auto-enabled for non-local hosts unless overridden by `DATABASE_SSL`.

## Endpoints

- Confirmations:
  - POST `/api/save-data` — Save a single guest confirmation
  - GET `/api/confirmations?email=you@example.com` — List latest confirmations by email

- Payments:
  - POST `/api/pix` — Generate PIX payload/QR
  - POST `/api/mbway` — Generate MBWay payment payload
  - POST `/api/payments` — Record a generated payment (defaults to `pending`)
  - GET `/api/payments[?email=you@example.com]` — List payments (optionally filtered by email)
  - PUT `/api/payments/:id` — Update payment status/message (`pending`, `received`, `canceled`)

- Health:
  - GET `/api/health` — Health check

## Example requests

Save confirmation:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"Email":"john@example.com","Name":"John","PlateOption":"peixe","Price":"adult"}' \
  http://localhost:5000/api/save-data
```

Generate PIX and register payment:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"amount": 100.5, "description": "Presente", "txId": "PIX-123"}' \
  http://localhost:5000/api/pix

curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","amount":100.5,"paymentType":"PIX","description":"Presente"}' \
  http://localhost:5000/api/payments
```

Cancel a pending payment:
```bash
curl -X PUT -H "Content-Type: application/json" \
  -d '{"status":"canceled"}' \
  http://localhost:5000/api/payments/<payment-id>
```

## Frontend integration

- Set `REACT_APP_API_BASE_URL` for the React app to reach this backend.
- Payments and confirmations in the UI reflect backend states; canceled payments are hidden from user feedback, pending payments show as a small inline widget, and received payments display in detail.

## Troubleshooting

- "DATABASE_URL is not configured": ensure `.env` is present or env var is set before starting.
- TLS issues on hosted providers: set `DATABASE_SSL=true` to enable TLS with `rejectUnauthorized: false`.
- Local development: set `DATABASE_SSL=false` or omit it when using `localhost`.
