const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function loadUsers(usersFile) {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function saveUsers(usersFile, users) {
  fs.mkdirSync(path.dirname(usersFile), { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

function findUser(usersFile, username) {
  return loadUsers(usersFile).find((u) => u.username === username);
}

function verifyUser(usersFile, username, password) {
  const user = findUser(usersFile, username);
  if (!user || !password) return false;
  return verifyPassword(password, user.salt, user.hash);
}

// Adds a new user or resets an existing one's password.
function upsertUser(usersFile, username, password) {
  const users = loadUsers(usersFile);
  const { salt, hash } = hashPassword(password);
  const idx = users.findIndex((u) => u.username === username);
  const record = { username, salt, hash };
  if (idx >= 0) users[idx] = record;
  else users.push(record);
  saveUsers(usersFile, users);
}

module.exports = { loadUsers, findUser, verifyUser, upsertUser, hashPassword, verifyPassword };
