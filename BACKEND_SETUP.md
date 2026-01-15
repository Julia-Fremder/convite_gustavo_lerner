# Backend setup instructions

## Quick Start

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Start the backend server:**
```bash
npm start
```

The server will run on `http://localhost:5000` by default. In the frontend, set `REACT_APP_API_BASE_URL` to your deployed backend URL (defaults to `http://localhost:5000`).

## Endpoints Available

- **POST** `${REACT_APP_API_BASE_URL}/api/save-data` - Send JSON data, it gets saved to CSV
- **GET** `${REACT_APP_API_BASE_URL}/api/health` - Check server status
- **GET** `${REACT_APP_API_BASE_URL}/api/files` - List all CSV files
- **GET** `${REACT_APP_API_BASE_URL}/api/latest` - Get the latest CSV file info

## Example: Send data from frontend

```javascript
const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/save-data`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});
const result = await response.json();
console.log(result);
```

CSV files are automatically created and saved in the `backend/data/` folder.
