const { getPool } = require('../config/database');
const paymentsRepo = require('../repositories/paymentsRepository');
const confirmationsRepo = require('../repositories/confirmationsRepository');

const initializeDatabase = async () => {
  const client = await getPool().connect();
  try {
    // Create confirmations table
    await confirmationsRepo.createConfirmationsTable(client);
    
    // Create payments table
    await paymentsRepo.createPaymentsTable(client);

    console.log('✅ Database table initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  initializeDatabase,
};
