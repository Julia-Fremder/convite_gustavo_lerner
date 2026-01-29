const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const sanitizePhone = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-15);
};

const generateMbwayPayment = async ({ amount, phone, description, txId }) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid amount');
  }

  const sanitizedPhone = sanitizePhone(phone);
  if (!sanitizedPhone || sanitizedPhone.length < 9) {
    throw new Error('Invalid phone');
  }

  const fixedAmount = Number(numericAmount.toFixed(2));
  const effectiveTxId = txId ? String(txId).slice(0, 25) : `MBWAY-${uuidv4().slice(0, 8)}`;
  const desc = description ? String(description).slice(0, 80) : '';

  const payload = `MBWAY|phone:${sanitizedPhone}|amount:${fixedAmount.toFixed(2)}|txid:${effectiveTxId}${
    desc ? `|desc:${desc}` : ''
  }`;

  const qrCode = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    scale: 6,
  });

  return {
    payload,
    qrCode,
    phone: sanitizedPhone,
    amount: fixedAmount,
    txId: effectiveTxId,
    description: desc || undefined,
  };
};

module.exports = {
  generateMbwayPayment,
};
