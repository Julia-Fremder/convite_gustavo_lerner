const { getPool } = require('../config/database');

const createConfirmationsTable = async (client) => {
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
    ALTER TABLE confirmations
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS plate_option TEXT,
      ADD COLUMN IF NOT EXISTS price TEXT,
      ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS raw_data JSONB;
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
};

const insertConfirmation = async ({ id, email, name, plateOption, price, submittedAt, rawData }) => {
  const client = await getPool().connect();
  try {
    await client.query(
      `INSERT INTO confirmations (id, email, name, plate_option, price, submitted_at, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, email, name, plateOption, price, submittedAt, rawData]
    );
  } finally {
    client.release();
  }
};

const findConfirmationsByEmail = async (email) => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `SELECT id, email, name, plate_option, price, submitted_at, raw_data
       FROM confirmations
       WHERE email = $1
       ORDER BY submitted_at DESC, created_at DESC`,
      [email]
    );
    return rows;
  } finally {
    client.release();
  }
};

module.exports = {
  createConfirmationsTable,
  insertConfirmation,
  findConfirmationsByEmail,
};
