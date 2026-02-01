const { getPool } = require('../config/database');

const createPaymentsTable = async (client) => {
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

  await client.query(`
    DO $$
    BEGIN
      -- Ensure payments status allows 'pending','received','canceled'
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payments_status_check'
      ) THEN
        BEGIN
          ALTER TABLE payments DROP CONSTRAINT payments_status_check;
        EXCEPTION WHEN undefined_object THEN NULL;
        END;
      END IF;

      ALTER TABLE payments
        ADD CONSTRAINT payments_status_check
        CHECK (status IN ('pending','received','canceled'));
    END
    $$;
  `);
};

const insertPayment = async ({ id, email, amount, paymentType, status, message, description, txId, rawData }) => {
  const client = await getPool().connect();
  try {
    await client.query(
      `INSERT INTO payments (id, email, amount, payment_type, status, message, description, tx_id, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, email, amount, paymentType, status, message, description, txId, rawData]
    );
  } finally {
    client.release();
  }
};

const findAllPayments = async () => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `SELECT id, email, amount, payment_type, status, message, description, tx_id, raw_data, created_at, updated_at
       FROM payments
       ORDER BY created_at DESC`
    );
    return rows;
  } finally {
    client.release();
  }
};

const findPaymentsByEmail = async (email) => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `SELECT id, email, amount, payment_type, status, message, description, tx_id, raw_data, created_at, updated_at
       FROM payments
       WHERE email = $1
       ORDER BY created_at DESC`,
      [email]
    );
    return rows;
  } finally {
    client.release();
  }
};

const updatePaymentById = async (id, { status, message }) => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `UPDATE payments
       SET status = $2,
           message = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, amount, payment_type, status, message, description, tx_id, raw_data, created_at, updated_at`,
      [id, status, message]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
};

module.exports = {
  createPaymentsTable,
  insertPayment,
  findAllPayments,
  findPaymentsByEmail,
  updatePaymentById,
};
