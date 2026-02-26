const { v4: uuidv4 } = require('uuid');

const generateMbReference = (amount, txId) => {
  // Generate a simulated MB reference
  // In production, this would use SIBS API
  const entity = '21238'; // Simulated entity (5 digits)
  
  // Generate 9-digit reference based on txId and amount
  const hash = txId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const amountCents = Math.floor(amount * 100);
  const combined = (hash + amountCents) % 1000000000;
  const reference = String(combined).padStart(9, '0');
  
  return { entity, reference };
};

const generateMbwayPayment = async ({ amount, description, txId }) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid amount');
  }

  const fixedAmount = Number(numericAmount.toFixed(2));
  const effectiveTxId = txId ? String(txId).slice(0, 25) : `MBWAY-${uuidv4().slice(0, 8)}`;
  const desc = description ? String(description).slice(0, 80) : '';

  // Generate MB reference
  const mbReference = generateMbReference(fixedAmount, effectiveTxId);

  // Manual MBWay phone number
  const mbwayPhone = '+351 911191515';

  return {
    mbwayPhone,
    mbReference,
    amount: fixedAmount,
    txId: effectiveTxId,
    description: desc || undefined,
  };
};

module.exports = {
  generateMbwayPayment,
};
