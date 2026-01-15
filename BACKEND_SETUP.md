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

The server will run on `http://localhost:5000`

## Endpoints Available

- **POST** `http://localhost:5000/api/save-data` - Send JSON data, it gets saved to CSV
- **GET** `http://localhost:5000/api/health` - Check server status
- **GET** `http://localhost:5000/api/files` - List all CSV files
- **GET** `http://localhost:5000/api/latest` - Get the latest CSV file info

## Example: Send data from frontend

```javascript
const response = await fetch('http://localhost:5000/api/save-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});
const result = await response.json();
console.log(result);
```

CSV files are automatically created and saved in the `backend/data/` folder.
