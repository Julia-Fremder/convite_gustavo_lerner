require('dotenv').config();
const { Pool } = require('pg');
const { initializeDatabase } = require('../services/databaseService');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env or your environment and retry.');
  process.exit(1);
}

const parsed = new URL(url);
console.log(`Connecting to ${parsed.host}${parsed.pathname}`);

const ssl = (() => {
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (parsed.hostname && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    return { rejectUnauthorized: false };
  }
  return false;
})();

const pool = new Pool({ connectionString: url, ssl });

(async () => {
  const client = await pool.connect();
  try {
    console.log('Dropping table confirmations...');
    await client.query('DROP TABLE IF EXISTS confirmations');
    console.log('Recreating schema...');
    await initializeDatabase();
    console.log('✅ confirmations table reset');
  } catch (err) {
    console.error('Error resetting confirmations table:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
