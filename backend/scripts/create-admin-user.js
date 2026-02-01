#!/usr/bin/env node
require('dotenv').config();
const readline = require('readline');
const userService = require('../services/userService');
const usersRepo = require('../repositories/usersRepository');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const main = async () => {
  try {
    console.log('\n=== Create Admin User ===\n');

    // Check if users already exist
    const userCount = await usersRepo.countUsers();
    if (userCount > 0) {
      const confirm = await question(`⚠️  ${userCount} user(s) already exist. Continue? (yes/no): `);
      if (confirm.toLowerCase() !== 'yes') {
        console.log('Cancelled.');
        rl.close();
        process.exit(0);
      }
    }

    const username = await question('Username: ');
    if (!username || username.length < 3) {
      console.error('❌ Username must be at least 3 characters');
      rl.close();
      process.exit(1);
    }

    const password = await question('Password (min 8 chars): ');
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      rl.close();
      process.exit(1);
    }

    const confirm = await question('Confirm password: ');
    if (password !== confirm) {
      console.error('❌ Passwords do not match');
      rl.close();
      process.exit(1);
    }

    const user = await userService.createUser({
      username,
      password,
      role: 'admin',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
};

main();
