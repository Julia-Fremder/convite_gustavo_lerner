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
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        plate_option TEXT NOT NULL,
        price TEXT NOT NULL,
        submitted_at TIMESTAMPTZ,
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        payment_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        message TEXT,
        description TEXT,
        tx_id TEXT,
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Migration helpers for legacy tables
    await client.query(`
      ALTER TABLE confirmations
        ADD COLUMN IF NOT EXISTS email TEXT,
        ADD COLUMN IF NOT EXISTS name TEXT,
        ADD COLUMN IF NOT EXISTS plate_option TEXT,
        ADD COLUMN IF NOT EXISTS price TEXT,
        ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS raw_data JSONB;
    `);

    await client.query(`
      ALTER TABLE payments
        ADD COLUMN IF NOT EXISTS email TEXT,
        ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS payment_type TEXT,
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS message TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS tx_id TEXT,
        ADD COLUMN IF NOT EXISTS raw_data JSONB,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // If legacy data column exists and is NOT NULL, make it nullable to avoid insert errors
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'confirmations' AND column_name = 'data'
        ) THEN
          BEGIN
            ALTER TABLE confirmations ALTER COLUMN data DROP NOT NULL;
          EXCEPTION
            WHEN undefined_column THEN NULL;
          END;
        END IF;
      END
      $$;
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

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'payments_status_check'
        ) THEN
          ALTER TABLE payments
            ADD CONSTRAINT payments_status_check
            CHECK (status IN ('pending','received'));
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

  const email = data?.Email || null;
  const name = data?.Name || null;
  const plateOption = data?.PlateOption || null;
  const price = data?.Price || null;

  try {
    await client.query(
      `INSERT INTO confirmations (id, email, name, plate_option, price, submitted_at, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        email,
        name,
        plateOption,
        price,
        timestamp,
        JSON.stringify({ ...data, timestamp }),
      ]
    );
    return { id, timestamp };
  } finally {
    client.release();
  }
};

const getConfirmationsByEmail = async ({ email }) => {
  if (!email) throw new Error('Email is required');
  const client = await getPool().connect();
  try {
     const { rows: latestTsRows } = await client.query(
       `SELECT id, email, name, plate_option, price, submitted_at, raw_data
        FROM confirmations
        WHERE email = $1
        ORDER BY submitted_at DESC, created_at DESC`,
      [email]
    );

    if (!latestTsRows.length) return { timestamp: null, rows: [] };

    const latestTimestamp = latestTsRows[0].submitted_at.toISOString();
    const rows = latestTsRows.filter(rowSubmitted => rowSubmitted.submitted_at?.toISOString() === latestTimestamp);

    return { timestamp: latestTimestamp, rows };
  } finally {
    client.release();
  }
};

const savePaymentRecord = async ({ email, amount, paymentType, message, description, txId, rawData, status }) => {
  const id = uuidv4();
  const client = await getPool().connect();
  const numericAmount = Number(amount);

  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid amount');
  }

  const safeStatus = status && ['pending', 'received'].includes(status) ? status : 'pending';

  try {
    await client.query(
      `INSERT INTO payments (id, email, amount, payment_type, status, message, description, tx_id, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        email.trim(),
        Number(numericAmount.toFixed(2)),
        paymentType,
        safeStatus,
        message || null,
        description || null,
        txId || null,
        rawData ? JSON.stringify(rawData) : null,
      ]
    );

    return { id, status: safeStatus };
  } finally {
    client.release();
  }
};

const listPayments = async (email) => {
  const client = await getPool().connect();
  try {
    const baseQuery = `SELECT id, email, amount, payment_type, status, message, description, tx_id, raw_data, created_at, updated_at
       FROM payments`;

    const { rows } = email
      ? await client.query(`${baseQuery} WHERE email = $1 ORDER BY created_at DESC`, [email])
      : await client.query(`${baseQuery} ORDER BY created_at DESC`);
    return rows;
  } finally {
    client.release();
  }
};

const updatePaymentStatus = async (id, { status, message }) => {
  if (!id) throw new Error('Payment ID is required');
  const client = await getPool().connect();
  const nextStatus = status && ['pending', 'received'].includes(status) ? status : 'pending';

  try {
    const { rows } = await client.query(
      `UPDATE payments
       SET status = $2,
           message = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, amount, payment_type, status, message, description, tx_id, raw_data, created_at, updated_at`,
      [id, nextStatus, message || null]
    );

    if (!rows.length) {
      throw new Error('Payment not found');
    }

    return rows[0];
  } finally {
    client.release();
  }
};

const isDatabaseConfigured = () => Boolean(DATABASE_URL);

module.exports = {
  saveFormData,
  isDatabaseConfigured,
  initializeDatabase,
  savePaymentRecord,
  listPayments,
  updatePaymentStatus,
  getConfirmationsByEmail,
  DATABASE_URL,
};
