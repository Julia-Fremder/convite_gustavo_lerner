const { saveFormData, getConfirmationsByEmail } = require('../services/databaseService');

const saveData = async (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
      });
    }

    const meta = await saveFormData(data);

    res.status(200).json({
      success: true,
      message: 'Data saved successfully',
      id: meta.id,
      timestamp: meta.timestamp,
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({
      success: false,
      error: 'Error saving data',
      details: error.message,
    });
  }
};

const getConfirmations = async (req, res) => {
  try {
    const { email, timestamp } = req.query || {};

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { rows, timestamp: ts } = await getConfirmationsByEmail({ email, timestamp });

    res.status(200).json({ success: true, confirmations: rows, timestamp: ts });
  } catch (error) {
    console.error('Error fetching confirmations:', error);
    res.status(500).json({ success: false, error: 'Error fetching data', details: error.message });
  }
};

module.exports = {
  saveData,
  getConfirmations,
};
