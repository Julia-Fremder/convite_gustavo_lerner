const { v4: uuidv4 } = require('uuid');

const generateMbwayPayment = async ({ amount, description, txId }) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid amount');
  }

  const fixedAmount = Number(numericAmount.toFixed(2));
  const effectiveTxId = txId ? String(txId).slice(0, 25) : `MBWAY-${uuidv4().slice(0, 8)}`;
  const desc = description ? String(description).slice(0, 80) : '';

  // Manual MBWay phone number
  const mbwayPhone = '+351 911191515';
  
  // IBAN for bank transfer
  const iban = 'PT50003300004565457639305';

  return {
    mbwayPhone,
    iban,
    amount: fixedAmount,
    txId: effectiveTxId,
    description: desc || undefined,
  };
};

module.exports = {
  generateMbwayPayment,
};
