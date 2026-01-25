const { verifyEmail, isEmailConfigured } = require('../services/emailService');

const health = async (req, res) => {
  const emailReady = isEmailConfigured();

  try {
    if (emailReady) {
      await verifyEmail();
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
};

module.exports = {
  health,
};
