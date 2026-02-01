const { v4: uuidv4 } = require('uuid');
const confirmationsRepo = require('../repositories/confirmationsRepository');

const saveFormData = async (data) => {
  // Extract and validate data
  const email = data?.Email || null;
  const name = data?.Name || null;
  const plateOption = data?.PlateOption || null;
  const price = data?.Price || null;

  // Generate metadata
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  // Prepare data for persistence
  const confirmationData = {
    id,
    email,
    name,
    plateOption,
    price,
    submittedAt: timestamp,
    rawData: JSON.stringify({ ...data, timestamp }),
  };

  // Persist to database
  await confirmationsRepo.insertConfirmation(confirmationData);

  return { id, timestamp };
};

const getConfirmationsByEmail = async ({ email }) => {
  if (!email) {
    throw new Error('Email is required');
  }

  const rows = await confirmationsRepo.findConfirmationsByEmail(email);

  if (!rows.length) {
    return { timestamp: null, rows: [] };
  }

  // Business logic - filter by latest timestamp
  const latestTimestamp = rows[0].submitted_at.toISOString();
  const latestRows = rows.filter(
    (rowSubmitted) => rowSubmitted.submitted_at?.toISOString() === latestTimestamp
  );

  return { timestamp: latestTimestamp, rows: latestRows };
};

module.exports = {
  saveFormData,
  getConfirmationsByEmail,
};
