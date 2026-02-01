require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../config/database');

const pool = getPool();

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
        const stringValue = value.toString();
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
