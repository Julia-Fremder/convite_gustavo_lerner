const {
  savePaymentRecord,
  listPayments,
  updatePaymentStatus,
} = require('../services/databaseService');

const createPayment = async (req, res) => {
  try {
    const { email, amount, paymentType, message, description, txId, raw } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (!paymentType) {
      return res.status(400).json({ success: false, error: 'paymentType is required' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const { id, status } = await savePaymentRecord({
      email,
      amount: numericAmount,
      paymentType,
      message,
      description,
      txId,
      rawData: raw,
    });

    res.json({ success: true, id, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error saving payment' });
  }
};

const getPayments = async (req, res) => {
  try {
    const { email } = req.query || {};
    const payments = await listPayments(email || undefined);
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error fetching payments' });
  }
};

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, error: 'Payment id is required' });
    }

    const updated = await updatePaymentStatus(id, { status, message });
    res.json({ success: true, payment: updated });
  } catch (error) {
    const statusCode = error.message === 'Payment not found' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message || 'Error updating payment' });
  }
};

module.exports = {
  createPayment,
  getPayments,
  updatePayment,
};
