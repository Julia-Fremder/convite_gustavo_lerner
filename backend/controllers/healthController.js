const { testDatabaseConnection, isDatabaseConfigured } = require('../services/databaseService');

const health = async (req, res) => {
  const dbConfigured = isDatabaseConfigured();
  let dbStatus = { configured: dbConfigured };
  
  if (dbConfigured) {
    const testResult = await testDatabaseConnection();
    dbStatus.connected = testResult.success;
    dbStatus.message = testResult.message;
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
};

module.exports = {
  health,
};
