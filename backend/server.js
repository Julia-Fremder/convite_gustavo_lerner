require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { saveData } = require('./controllers/emailController');
const { createPixPayment } = require('./controllers/pixController');
const { createMbwayPayment } = require('./controllers/mbwayController');
const { health } = require('./controllers/healthController');
const { EMAIL_HOST, EMAIL_TO } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.post('/api/save-data', saveData);
app.post('/api/pix', createPixPayment);
app.post('/api/mbway', createMbwayPayment);
app.get('/api/health', health);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✉️  Email host: ${EMAIL_HOST || 'not configured'}`);
  console.log(`📮 Email to: ${EMAIL_TO || 'not configured'}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST   /api/save-data      - Forward form data via email');
  console.log('  POST   /api/pix            - Generate PIX QR code payload');
  console.log('  POST   /api/mbway          - Generate MBWay payment payload');
  console.log('  GET    /api/health         - Health check and email verify');
});

module.exports = app;
