const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true' || EMAIL_PORT === 465;

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
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
  }
  return transporter;
};

const requireEmailConfig = () => {
  if (!EMAIL_HOST) throw new Error('EMAIL_HOST is not configured');
  if (!EMAIL_TO) throw new Error('EMAIL_TO is not configured');
  if (!EMAIL_FROM) throw new Error('EMAIL_FROM is not configured');
  return true;
};

const isEmailConfigured = () => Boolean(EMAIL_HOST && EMAIL_TO && EMAIL_FROM);

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

const sendFormEmail = async (data) => {
  requireEmailConfig();

  const meta = { id: uuidv4(), timestamp: new Date().toISOString() };
  const { text, html } = formatEmail(data, meta);
  const subjectName = data.Name || data.name || 'Guest';

  const tx = getTransporter();

  await tx.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: `New submission from ${subjectName}`,
    text,
    html,
  });

  return meta;
};

const verifyEmail = async () => {
  if (!isEmailConfigured()) {
    throw new Error('Email settings are incomplete');
  }
  return getTransporter().verify();
};

module.exports = {
  sendFormEmail,
  verifyEmail,
  isEmailConfigured,
  EMAIL_HOST,
  EMAIL_TO,
};
