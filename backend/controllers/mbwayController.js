const { generateMbwayPayment } = require('../services/mbwayService');

const createMbwayPayment = async (req, res) => {
  try {
    const { amount, description, txId } = req.body || {};

    const result = await generateMbwayPayment({
      amount,
      description,
      txId,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    const status = error.message && error.message.toLowerCase().includes('invalid') ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error.message || 'Error generating MBWay payment',
    });
  }
};

module.exports = {
  createMbwayPayment,
};
