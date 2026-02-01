require('dotenv').config();
const { getPool } = require('../config/database');
const { initializeDatabase } = require('../services/initializationService');

const pool = getPool();

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
