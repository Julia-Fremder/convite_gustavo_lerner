const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const PIX_KEY = process.env.PIX_KEY || '04355073700';
const PIX_MERCHANT_NAME = process.env.PIX_MERCHANT_NAME || 'JULIA FREMDER';
const PIX_MERCHANT_CITY = process.env.PIX_MERCHANT_CITY || 'SAO PAULO';

const toAscii = (value, maxLen) => {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .slice(0, maxLen);
};

const formatEMVField = (id, value) => {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
};

const calculateCRC16 = (payload) => {
  const polynomial = 0x1021;
  let result = 0xffff;
  const bytes = Buffer.from(payload, 'utf8');

  for (const byte of bytes) {
    result ^= byte << 8;
    for (let i = 0; i < 8; i += 1) {
      if (result & 0x8000) {
        result = ((result << 1) ^ polynomial) & 0xffff;
      } else {
        result = (result << 1) & 0xffff;
      }
    }
  }

  return result.toString(16).toUpperCase().padStart(4, '0');
};

const buildPixPayload = ({ amount, txId, description }) => {
  const merchantName = toAscii(PIX_MERCHANT_NAME, 25) || 'JULIA FREMDER';
  const merchantCity = toAscii(PIX_MERCHANT_CITY, 15) || 'SAO PAULO';
  const desc = description ? toAscii(description, 50) : '';
  const txid = toAscii(txId || `PIX-${uuidv4().slice(0, 8)}`, 25) || 'PIX';
  const amountStr = Number(amount).toFixed(2);

  const gui = formatEMVField('00', 'BR.GOV.BCB.PIX');
  const keyField = formatEMVField('01', PIX_KEY);
  const descField = desc ? formatEMVField('02', desc) : '';
  const merchantAccountInfo = formatEMVField('26', `${gui}${keyField}${descField}`);

  const payloadWithoutCrc = [
    formatEMVField('00', '01'),
    formatEMVField('01', '12'),
    merchantAccountInfo,
    '52040000',
    '5303986',
    formatEMVField('54', amountStr),
    formatEMVField('58', 'BR'),
    formatEMVField('59', merchantName),
    formatEMVField('60', merchantCity),
    formatEMVField('62', formatEMVField('05', txid)),
    '6304',
  ].join('');

  const crc = calculateCRC16(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
};

const generatePixPayment = async ({ amount, description, txId }) => {
  const payload = buildPixPayload({ amount, description, txId });

  const qrCode = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    scale: 6,
  });

  return { payload, qrCode };
};

module.exports = {
  generatePixPayment,
};
