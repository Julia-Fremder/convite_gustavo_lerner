require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env or your environment and retry.');
  process.exit(1);
}

const parsed = new URL(url);
console.log(`Connecting to ${parsed.host}${parsed.pathname}`);

const resolveSslConfig = () => {
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (parsed.hostname && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    return { rejectUnauthorized: false }; // Render and most managed DBs require TLS
  }
  return false;
};

const pool = new Pool({
  connectionString: url,
  ssl: resolveSslConfig(),
});

const ensureSchema = async (client) => {
  await client.query(`
    ALTER TABLE confirmations
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS guest TEXT,
      ADD COLUMN IF NOT EXISTS plate_option TEXT,
      ADD COLUMN IF NOT EXISTS price TEXT,
      ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS raw_data JSONB;
  `);

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
    DECLARE
      has_data_column BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'confirmations' AND column_name = 'data'
      ) INTO has_data_column;

      IF has_data_column THEN
        BEGIN
          ALTER TABLE confirmations ALTER COLUMN data DROP NOT NULL;
        EXCEPTION
          WHEN undefined_column THEN NULL;
        END;

        UPDATE confirmations
        SET raw_data = data
        WHERE raw_data IS NULL;

        UPDATE confirmations
        SET
          name = COALESCE(name, data->>'Name'),
          guest = COALESCE(guest, data->>'Guest'),
          plate_option = COALESCE(plate_option, data->>'PlateOption'),
          price = COALESCE(price, data->>'Price'),
          submitted_at = COALESCE(submitted_at, (data->>'timestamp')::timestamptz)
        WHERE data IS NOT NULL;
      END IF;
    END
    $$;
  `);
};

(async () => {
  try {
    const client = await pool.connect();
    try {
      await ensureSchema(client);
      const { rows } = await client.query(
        'SELECT id, name, guest, plate_option, price, submitted_at, created_at, raw_data FROM confirmations ORDER BY created_at DESC LIMIT 50'
      );
      console.log(`Fetched ${rows.length} rows`);
      const flattened = rows.map((row) => ({
        id: row.id,
        created_at: row.created_at,
        submitted_at: row.submitted_at,
        Name: row.name ?? row.raw_data?.Name,
        Guest: row.guest ?? row.raw_data?.Guest,
        PlateOption: row.plate_option ?? row.raw_data?.PlateOption,
        Price: row.price ?? row.raw_data?.Price,
        timestamp: row.raw_data?.timestamp,
      }));
      console.table(flattened);
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check if the DB host/port are reachable and DATABASE_URL is correct.');
    }
    console.error('Error querying confirmations:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
