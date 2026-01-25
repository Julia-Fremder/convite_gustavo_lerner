const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const DATABASE_URL = process.env.DATABASE_URL;

let pool;

const resolveSslConfig = () => {
  // Honor explicit opt-out
  if (process.env.DATABASE_SSL === 'false') return false;
  // Explicit opt-in
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };

  // If the host is not localhost, prefer SSL (Render requires TLS)
  try {
    const host = new URL(DATABASE_URL).hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return { rejectUnauthorized: false };
    }
  } catch (err) {
    // fallback handled below
  }
  return false;
};

const getPool = () => {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured');
    }
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: resolveSslConfig(),
    });
  }
  return pool;
};

const initializeDatabase = async () => {
  const client = await getPool().connect();
  try {
    // Create base table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS confirmations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        guest TEXT NOT NULL,
        plate_option TEXT NOT NULL,
        price TEXT NOT NULL,
        submitted_at TIMESTAMPTZ,
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Migration helpers for legacy tables
    await client.query(`
      ALTER TABLE confirmations
        ADD COLUMN IF NOT EXISTS name TEXT,
        ADD COLUMN IF NOT EXISTS guest TEXT,
        ADD COLUMN IF NOT EXISTS plate_option TEXT,
        ADD COLUMN IF NOT EXISTS price TEXT,
        ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS raw_data JSONB;
    `);

    // Add a simple check constraint for price values (idempotent)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'confirmations_price_check'
        ) THEN
          ALTER TABLE confirmations
            ADD CONSTRAINT confirmations_price_check
            CHECK (price IN ('adult','child'));
        END IF;
      END
      $$;
    `);

    console.log('✅ Database table initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

const saveFormData = async (data) => {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  const client = await getPool().connect();

  const name = data?.Name || null;
  const guest = data?.Guest || null;
  const plateOption = data?.PlateOption || null;
  const price = data?.Price || null;

  try {
    await client.query(
      `INSERT INTO confirmations (id, name, guest, plate_option, price, submitted_at, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, guest, plateOption, price, timestamp, JSON.stringify({ ...data, timestamp })]
    );
    return { id, timestamp };
  } finally {
    client.release();
  }
};

const isDatabaseConfigured = () => Boolean(DATABASE_URL);

module.exports = {
  saveFormData,
  isDatabaseConfigured,
  initializeDatabase,
  DATABASE_URL,
};
