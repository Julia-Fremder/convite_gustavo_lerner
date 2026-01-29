const { generatePixPayment } = require('../services/pixService');

const createPixPayment = async (req, res) => {
  try {
    const { amount, description, txId } = req.body || {};
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    const { payload, qrCode } = await generatePixPayment({
      amount: numericAmount,
      description: description ? String(description) : undefined,
      txId: txId ? String(txId) : undefined,
    });

    res.json({
      success: true,
      payload,
      qrCode,
      amount: Number(numericAmount.toFixed(2)),
      txId: txId || undefined,
    });
  } catch (error) {
    console.error('Error generating PIX QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating PIX QR code',
      details: error.message,
    });
  }
};

module.exports = {
  createPixPayment,
};
