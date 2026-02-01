# Local Development Setup

This guide sets up a local PostgreSQL database for backend development while keeping the frontend connected to production.

## Setup Steps

### 1. Create Local Database

Run the setup script:
```bash
cd backend
./scripts/setup-local-db.sh
```

Or manually:
```bash
sudo -u postgres psql
CREATE DATABASE convite_dev;
CREATE USER convite_dev_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE convite_dev TO convite_dev_user;
\c convite_dev
GRANT ALL ON SCHEMA public TO convite_dev_user;
\q
```

### 2. Configure Backend Environment

Update `backend/.env`:
```env
# Local development database
DATABASE_URL=postgresql://convite_dev_user:dev_password_123@localhost:5432/convite_dev
DATABASE_SSL=false

# Generate a JWT secret
JWT_SECRET=your-32-char-random-secret
JWT_EXPIRES_IN=24h

# PIX settings
PIX_KEY=your-cpf-or-key
PIX_MERCHANT_NAME=Your Name
PIX_MERCHANT_CITY=Your City
```

### 3. Initialize Database

Start the backend server to create tables:
```bash
cd backend
npm start
```

### 4. Create Admin User

```bash
cd backend
npm run create-admin
```

### 5. Frontend Configuration

The frontend already points to production by default. No changes needed!

In `.env` (root directory), you can optionally add:
```env
# Frontend uses production backend by default
# REACT_APP_API_BASE_URL=https://convite-gustavo-lerner.onrender.com
```

## Architecture

- **Backend (local)**: Runs on `http://localhost:5000` with local database
- **Backend (production)**: Runs on Render with production database
- **Frontend (local)**: Runs on `http://localhost:3000` but calls **production API**
- **Frontend (production)**: Deployed on GitHub Pages, calls production API

## Testing Locally

If you want to test frontend with local backend:
```bash
# Create frontend .env
echo "REACT_APP_API_BASE_URL=http://localhost:5000" > .env

# Start backend
cd backend && npm start

# Start frontend (in another terminal)
npm start
```

## Production Deployment

On Render, set these environment variables:
- `DATABASE_URL` - Production PostgreSQL URL
- `DATABASE_SSL` - `true`
- `JWT_SECRET` - Strong random secret
- `ADMIN_USERNAME` - (optional, uses database)
- `ADMIN_PASSWORD_HASH` - (optional, uses database)
