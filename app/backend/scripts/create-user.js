#!/usr/bin/env node
// Adds a user, or resets an existing user's password. Bootstrap path for the
// first admin (or any operator-created account) -- bypasses the self-service
// setup-token flow entirely, which is fine since CLI access is already trusted.
// Usage: node scripts/create-user.js <username> <password> [role]
require('dotenv').config();
const { USERS_FILE } = require('../src/config');
const { upsertUser } = require('../src/users');

const [username, password, role] = process.argv.slice(2);

if (!username || !password) {
  console.error('Usage: node scripts/create-user.js <username> <password> [role]');
  process.exit(1);
}
if (role && !['admin', 'user'].includes(role)) {
  console.error("role must be 'admin' or 'user'");
  process.exit(1);
}

upsertUser(USERS_FILE, username, password, role);
console.log(`User '${username}' saved to ${USERS_FILE}`);
