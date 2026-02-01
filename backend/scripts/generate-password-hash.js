#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Admin Password Hash Generator ===\n');

rl.question('Enter password to hash: ', async (password) => {
  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    rl.close();
    process.exit(1);
  }

  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('\n✅ Hash generated successfully!\n');
  console.log('Add this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  
  rl.close();
});
