# Local Development with Existing Production Database

Since PostgreSQL is not running locally, here are your options:

## Option 1: Use Production Database (Current Setup - SIMPLEST)

**Backend .env:**
```env
DATABASE_URL=postgresql://production-url-from-render
DATABASE_SSL=true
```

**Frontend:** Already points to production API ✅

**Pros:**
- No local database setup needed
- Works immediately
- Frontend already configured

**Cons:**
- Changes affect production data
- Need internet connection

---

## Option 2: Create Separate Dev Database on Render (RECOMMENDED)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create a **new PostgreSQL database** named `convite-dev`
3. Copy the **External Database URL**

**Backend .env (for dev branch):**
```env
DATABASE_URL=postgresql://dev-database-url-from-render
DATABASE_SSL=true
```

**Frontend:** Keep pointing to production ✅

**Pros:**
- Separate dev/prod data
- No local PostgreSQL needed
- Same workflow

---

## Option 3: Install Local PostgreSQL

**Start PostgreSQL:**
```bash
sudo service postgresql start
# or
sudo systemctl start postgresql
```

Then run:
```bash
cd backend
./scripts/setup-local-db.sh
```

---

## Current Recommendation

Since your frontend already points to **production API**, just:

1. **Keep frontend as-is** (it calls production)
2. **Create a dev database on Render** for backend testing
3. Use production DATABASE_URL only when deploying master branch

Your `.env` should have:
```env
# Use this for dev branch
DATABASE_URL=<dev-database-url-from-render>

# Production uses environment variables on Render
```
