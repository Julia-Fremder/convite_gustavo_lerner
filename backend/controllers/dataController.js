const { saveFormData } = require('../services/databaseService');

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

module.exports = {
  saveData,
};
