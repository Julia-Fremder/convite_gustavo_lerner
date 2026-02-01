const { v4: uuidv4 } = require('uuid');
const paymentsRepo = require('../repositories/paymentsRepository');

const createPayment = async ({ email, amount, paymentType, message, description, txId, rawData, status }) => {
  // Validation
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid amount');
  }

  // Business logic - validate and normalize status
  const safeStatus = status && ['pending', 'received', 'canceled'].includes(status) ? status : 'pending';

  // Data transformation
  const paymentData = {
    id: uuidv4(),
    email: email.trim(),
    amount: Number(numericAmount.toFixed(2)),
    paymentType,
    status: safeStatus,
    message: message || null,
    description: description || null,
    txId: txId || null,
    rawData: rawData ? JSON.stringify(rawData) : null,
  };

  // Persist to database
  await paymentsRepo.insertPayment(paymentData);

  return { id: paymentData.id, status: safeStatus };
};

const listPayments = async (email) => {
  if (email) {
    return await paymentsRepo.findPaymentsByEmail(email);
  }
  return await paymentsRepo.findAllPayments();
};

const updatePaymentStatus = async (id, { status, message }) => {
  if (!id) {
    throw new Error('Payment ID is required');
  }

  // Validate status
  const validStatus = status && ['pending', 'received', 'canceled'].includes(status) ? status : 'pending';

  const updatedPayment = await paymentsRepo.updatePaymentById(id, {
    status: validStatus,
    message: message || null,
  });

  if (!updatedPayment) {
    throw new Error('Payment not found');
  }

  return updatedPayment;
};

module.exports = {
  createPayment,
  listPayments,
  updatePaymentStatus,
};
