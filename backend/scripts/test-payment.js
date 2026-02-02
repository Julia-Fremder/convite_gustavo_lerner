#!/usr/bin/env node

/**
 * Test Payment Creation Script
 * Usage: node scripts/test-payment.js
 * 
 * Tests whether payments can be successfully saved to the database
 */

require('dotenv').config();
const { savePaymentRecord, testDatabaseConnection } = require('../services/databaseService');

const runTest = async () => {
  console.log('🧪 Testing payment creation...\n');

  // Test 1: Database connection
  console.log('1️⃣ Testing database connection...');
  const dbTest = await testDatabaseConnection();
  if (!dbTest.success) {
    console.error('❌ Database connection failed:', dbTest.message);
    process.exit(1);
  }
  console.log('✅ Database connection successful\n');

  // Test 2: Save a test payment
  console.log('2️⃣ Attempting to save a test payment...');
  try {
    const result = await savePaymentRecord({
      email: 'test@example.com',
      amount: 50.00,
      paymentType: 'TEST',
      message: 'Test payment from diagnostic script',
      description: 'Test Item (1x)',
      txId: `TEST-${Date.now()}`,
      rawData: { test: true, timestamp: new Date().toISOString() },
      status: 'pending',
    });

    console.log('✅ Payment saved successfully!');
    console.log('   Payment ID:', result.id);
    console.log('   Status:', result.status);
    console.log('\n✅ All tests passed! Payments can be saved to the database.');
  } catch (error) {
    console.error('❌ Failed to save payment:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }

  process.exit(0);
};

runTest().catch(err => {
  console.error('❌ Test script failed:', err);
  process.exit(1);
});
