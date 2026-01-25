require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true' || EMAIL_PORT === 465;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth:
    EMAIL_USER && EMAIL_PASS
      ? {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        }
      : undefined,
});

const requireEmailConfig = () => {
  if (!EMAIL_HOST) throw new Error('EMAIL_HOST is not configured');
  if (!EMAIL_TO) throw new Error('EMAIL_TO is not configured');
  if (!EMAIL_FROM) throw new Error('EMAIL_FROM is not configured');
  return true;
};

const formatEmail = (data, meta) => {
  const pairs = Object.entries(data || {});
  const textLines = [
    'New form submission received.',
    `ID: ${meta.id}`,
    `Timestamp: ${meta.timestamp}`,
    '',
    ...pairs.map(([key, value]) => `${key}: ${value ?? ''}`),
  ];

  const rows = pairs
    .map(
      ([key, value]) =>
        `<tr><td style="padding:4px 8px;"><strong>${key}</strong></td><td style="padding:4px 8px;">${value ?? ''}</td></tr>`
    )
    .join('');

  const html = `
    <div>
      <p>New form submission received.</p>
      <p><strong>ID:</strong> ${meta.id}<br/><strong>Timestamp:</strong> ${meta.timestamp}</p>
      <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rows}
      </table>
    </div>
  `;

  return { text: textLines.join('\n'), html };
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * POST endpoint to receive and email data
 */
app.post('/api/save-data', async (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
      });
    }

    requireEmailConfig();

    const meta = { id: uuidv4(), timestamp: new Date().toISOString() };
    const { text, html } = formatEmail(data, meta);
    const subjectName = data.Name || data.name || 'Guest';

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `New submission from ${subjectName}`,
      text,
      html,
    });

    res.status(200).json({
      success: true,
      message: 'Data emailed successfully',
      id: meta.id,
      timestamp: meta.timestamp,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending email',
      details: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  const emailReady = Boolean(EMAIL_HOST) && Boolean(EMAIL_TO) && Boolean(EMAIL_FROM);

  try {
    if (EMAIL_HOST) {
      await transporter.verify();
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      emailReady,
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      emailReady: false,
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✉️  Email host: ${EMAIL_HOST || 'not configured'}`);
  console.log(`📮 Email to: ${EMAIL_TO || 'not configured'}`);
});

module.exports = app;
