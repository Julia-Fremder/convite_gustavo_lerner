# Backend Data API

Node.js API that receives form submissions and forwards them via email.

## Features

- Receive JSON payloads and send them as formatted emails
- Configurable SMTP settings via environment variables
- Health check endpoint that verifies transporter readiness
- CORS enabled for React frontend integration

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env` file with your email settings:
```
PORT=5000
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_FROM=RSVP Bot <noreply@yourdomain.com>
EMAIL_TO=recipient@yourdomain.com
# optional: EMAIL_SECURE=true (use for port 465)
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

From the frontend, set `REACT_APP_API_BASE_URL` to your backend URL (defaults to `http://localhost:5000`).

## API Endpoints

### POST `/api/save-data`
Sends the JSON payload as an email.

**Request:**
```json
{
  "Name": "John Doe",
  "Guest": "Jane Doe",
  "PlateOption": "vegan",
  "Price": "adult"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data emailed successfully",
  "id": "uuid-string",
  "timestamp": "2026-01-15T10:30:45.123Z"
}
```

### GET `/api/health`
Health check and mail transporter verification.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-15T10:30:45.123Z",
  "emailReady": true
}
```

## Example Usage

```bash
API_BASE_URL=${REACT_APP_API_BASE_URL:-http://localhost:5000}

curl -X POST "$API_BASE_URL/api/save-data" \
  -H "Content-Type: application/json" \
  -d '{"Name": "John", "Guest": "Jane", "PlateOption": "vegan", "Price": "adult"}'

curl "$API_BASE_URL/api/health"
```

## Notes

- `EMAIL_TO` accepts a comma-separated list if you need multiple recipients
- `EMAIL_FROM` defaults to `EMAIL_USER` when omitted
- If you use port 465, set `EMAIL_SECURE=true`
