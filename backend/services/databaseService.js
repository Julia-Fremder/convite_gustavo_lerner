const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const DATABASE_URL = process.env.DATABASE_URL;

let pool;

const getPool = () => {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured');
    }
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
};

const initializeDatabase = async () => {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS confirmations (
        id UUID PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
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
  
  try {
    await client.query(
      'INSERT INTO confirmations (id, data) VALUES ($1, $2)',
      [id, JSON.stringify({ ...data, timestamp })]
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
