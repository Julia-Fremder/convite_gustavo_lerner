require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env or your environment and retry.');
  process.exit(1);
}

const parsed = new URL(url);
console.log(`Connecting to ${parsed.host}${parsed.pathname}`);

const resolveSslConfig = () => {
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (parsed.hostname && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    return { rejectUnauthorized: false };
  }
  return false;
};

const pool = new Pool({
  connectionString: url,
  ssl: resolveSslConfig(),
});

const main = async () => {
  const client = await pool.connect();

  try {
    console.log('\n📋 PAYMENTS TABLE\n');

    const { rows } = await client.query(`
      SELECT 
        id,
        email,
        amount,
        payment_type,
        status,
        message,
        description,
        tx_id,
        created_at,
        updated_at
      FROM payments
      WHERE status != 'canceled'
      ORDER BY created_at DESC
    `);

    if (rows.length === 0) {
      console.log('No payments found.\n');
      return;
    }

    console.log(`Total: ${rows.length} payment(s)\n`);

    // Export to CSV
    const csvPath = path.join(__dirname, '..', 'payments.csv');
    const headers = ['id', 'email', 'amount', 'payment_type', 'status', 'message', 'description', 'tx_id', 'created_at', 'updated_at'];
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        // Escape values with commas or quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(','))
    ].join('\n');

    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`✅ Exported to: ${csvPath}\n`);

    rows.forEach((row, index) => {
      console.log(`[${index + 1}] ${row.payment_type} — ${row.email}`);
      console.log(`    Amount: ${Number(row.amount).toFixed(2)}`);
      console.log(`    Status: ${row.status}`);
      console.log(`    Description: ${row.description || 'N/A'}`);
      console.log(`    Message: ${row.message ? `"${row.message}"` : 'N/A'}`);
      console.log(`    TX ID: ${row.tx_id || 'N/A'}`);
      console.log(`    Created: ${row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`    Updated: ${row.updated_at ? new Date(row.updated_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

main();
