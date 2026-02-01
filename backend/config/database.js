const { Pool } = require('pg');

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

const isDatabaseConfigured = () => !!DATABASE_URL;

module.exports = {
  getPool,
  isDatabaseConfigured,
  DATABASE_URL,
};
