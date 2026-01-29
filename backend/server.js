require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { saveData, getConfirmations } = require('./controllers/dataController');
const { createPixPayment } = require('./controllers/pixController');
const { createMbwayPayment } = require('./controllers/mbwayController');
const { createPayment, getPayments, updatePayment } = require('./controllers/paymentsController');
const { health } = require('./controllers/healthController');
const { initializeDatabase, DATABASE_URL } = require('./services/databaseService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.post('/api/save-data', saveData);
app.get('/api/confirmations', getConfirmations);
app.post('/api/pix', createPixPayment);
app.post('/api/mbway', createMbwayPayment);
app.post('/api/payments', createPayment);
app.get('/api/payments', getPayments);
app.put('/api/payments/:id', updatePayment);
app.get('/api/health', health);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.warn('Database initialization warning:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: ${DATABASE_URL ? 'configured' : 'not configured'}`);
    console.log('\nAvailable endpoints:');
    console.log('  POST   /api/save-data      - Save form data to database');
    console.log('  POST   /api/pix            - Generate PIX QR code payload');
    console.log('  POST   /api/mbway          - Generate MBWay payment payload');
    console.log('  POST   /api/payments       - Record generated payment (pending)');
    console.log('  GET    /api/payments       - List payments');
    console.log('  PUT    /api/payments/:id   - Update payment status');
    console.log('  GET    /api/health         - Health check (no external deps)');
  });
};

startServer();

module.exports = app;
