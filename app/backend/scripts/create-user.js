#!/usr/bin/env node
// Adds a user, or resets an existing user's password.
// Usage: node scripts/create-user.js <username> <password>
require('dotenv').config();
const { USERS_FILE } = require('../src/config');
const { upsertUser } = require('../src/users');

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error('Usage: node scripts/create-user.js <username> <password>');
  process.exit(1);
}

upsertUser(USERS_FILE, username, password);
console.log(`User '${username}' saved to ${USERS_FILE}`);
