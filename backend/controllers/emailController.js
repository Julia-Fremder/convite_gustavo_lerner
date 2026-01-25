const { sendFormEmail } = require('../services/emailService');

const saveData = async (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
      });
    }

    const meta = await sendFormEmail(data);

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
};

module.exports = {
  saveData,
};
