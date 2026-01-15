# Backend Data API

Simple Node.js backend API for saving form data to CSV files.

## Features

- Save JSON data as CSV entries
- Automatically creates new CSV files with timestamps
- Appends to the latest CSV file
- List all CSV files
- Download CSV files
- Health check endpoint
- CORS enabled for React frontend integration

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000` by default. From the frontend, configure `REACT_APP_API_BASE_URL` to point at your deployed backend (defaults to `http://localhost:5000`).

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST `/api/save-data`
Save JSON data to the latest CSV file

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data saved successfully",
  "file": "data_2026-01-15T10-30-45.csv",
  "data": {
    "id": "uuid-string",
    "timestamp": "2026-01-15T10:30:45.123Z",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  }
}
```

### GET `/api/files`
List all CSV files

**Response:**
```json
{
  "files": [
    {
      "name": "data_2026-01-15T10-30-45.csv",
      "size": 1024,
      "created": "2026-01-15T10:30:45.000Z",
      "modified": "2026-01-15T10:30:45.000Z"
    }
  ]
}
```

### GET `/api/latest`
Get the latest CSV file path

**Response:**
```json
{
  "file": "data_2026-01-15T10-30-45.csv",
  "path": "/api/download/data_2026-01-15T10-30-45.csv"
}
```

### GET `/api/download/:fileName`
Download a specific CSV file

### GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-15T10:30:45.123Z",
  "latestFile": "data_2026-01-15T10-30-45.csv"
}
```

## Data Directory

CSV files are stored in the `backend/data/` directory automatically.

## Using with React Frontend

To send data from your React app to this backend:

```javascript
const sendData = async (data) => {
  try {
    const apiBase = process.env.REACT_APP_API_BASE_URL || '';
    const response = await fetch(`${apiBase}/api/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('Data saved:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Example Usage

```bash
# Save data
API_BASE_URL=${REACT_APP_API_BASE_URL:-http://localhost:5000}

curl -X POST "$API_BASE_URL/api/save-data" \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'

# List files
curl "$API_BASE_URL/api/files"

# Get latest file
curl "$API_BASE_URL/api/latest"

# Health check
curl "$API_BASE_URL/api/health"
```

## File Naming

CSV files are automatically named with timestamps in the format:
`data_YYYY-MM-DDTHH-mm-ss.csv`

Each entry in the CSV includes:
- `id`: Unique UUID for each entry
- `timestamp`: ISO timestamp of when data was saved
- All other fields from the JSON request

## Notes

- The backend creates the `data/` directory automatically
- Each POST request appends a new line to the latest CSV
- If you want to start a new CSV file, simply delete the old ones
- CORS is enabled to allow requests from your React frontend
