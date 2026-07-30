const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;
const SETUP_TOKEN_TTL_MS = 1000 * 60 * 60 * 48; // 48 hours

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

// Setup tokens are already high-entropy random values, not user-chosen secrets --
// a fast hash is the right tool here, scrypt would just be needless latency.
function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
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
  if (!user || !password || user.active === false || !user.hash) return false;
  return verifyPassword(password, user.salt, user.hash);
}

// Adds a new user (default role 'user') or resets an existing one's password.
// Resetting preserves the existing role/active unless `role` is explicitly passed.
function upsertUser(usersFile, username, password, role) {
  const users = loadUsers(usersFile);
  const { salt, hash } = hashPassword(password);
  const idx = users.findIndex((u) => u.username === username);
  if (idx >= 0) {
    const existing = users[idx];
    users[idx] = {
      ...existing,
      salt,
      hash,
      role: role || existing.role || 'user',
      setupTokenHash: null,
      setupTokenExpires: null,
    };
  } else {
    users.push({ username, salt, hash, role: role || 'user', active: true, setupTokenHash: null, setupTokenExpires: null });
  }
  saveUsers(usersFile, users);
}

// Creates an account with no password yet -- the returned raw token is shown to
// the admin ONCE to build a setup link; only its hash is ever persisted.
function createPendingUser(usersFile, username, role) {
  const users = loadUsers(usersFile);
  if (users.some((u) => u.username === username)) {
    throw new Error(`user '${username}' already exists`);
  }
  const token = crypto.randomBytes(24).toString('hex');
  users.push({
    username,
    role: role || 'user',
    active: true,
    salt: null,
    hash: null,
    setupTokenHash: hashToken(token),
    setupTokenExpires: Date.now() + SETUP_TOKEN_TTL_MS,
  });
  saveUsers(usersFile, users);
  return token;
}

// Re-issues a setup token for a pending (no password yet) user, e.g. after their
// first link expired unused.
function regenerateSetupToken(usersFile, username) {
  const users = loadUsers(usersFile);
  const idx = users.findIndex((u) => u.username === username);
  if (idx < 0) throw new Error(`user '${username}' not found`);
  if (users[idx].hash) throw new Error(`user '${username}' already has a password set`);
  const token = crypto.randomBytes(24).toString('hex');
  users[idx] = {
    ...users[idx],
    setupTokenHash: hashToken(token),
    setupTokenExpires: Date.now() + SETUP_TOKEN_TTL_MS,
  };
  saveUsers(usersFile, users);
  return token;
}

// Consumes a setup token to let a pending user pick their own password.
function setupPassword(usersFile, username, token, password) {
  const users = loadUsers(usersFile);
  const idx = users.findIndex((u) => u.username === username);
  if (idx < 0) return false;
  const user = users[idx];
  if (user.hash || !user.setupTokenHash || !token) return false;
  if (!user.setupTokenExpires || Date.now() >= user.setupTokenExpires) return false;
  const candidate = Buffer.from(hashToken(token), 'hex');
  const expected = Buffer.from(user.setupTokenHash, 'hex');
  if (candidate.length !== expected.length || !crypto.timingSafeEqual(candidate, expected)) return false;

  const { salt, hash } = hashPassword(password);
  users[idx] = { ...user, salt, hash, setupTokenHash: null, setupTokenExpires: null };
  saveUsers(usersFile, users);
  return true;
}

// Admin toggle for active status and/or role.
function updateUser(usersFile, username, { active, role } = {}) {
  const users = loadUsers(usersFile);
  const idx = users.findIndex((u) => u.username === username);
  if (idx < 0) throw new Error(`user '${username}' not found`);
  users[idx] = {
    ...users[idx],
    ...(active !== undefined ? { active } : {}),
    ...(role !== undefined ? { role } : {}),
  };
  saveUsers(usersFile, users);
}

// Admin-facing listing -- never includes salt/hash/setup token material.
function listUsersSafe(usersFile) {
  return loadUsers(usersFile).map((u) => ({
    username: u.username,
    role: u.role || 'user',
    active: u.active !== false,
    pending: !u.hash,
  }));
}

// Non-admin-safe listing for pickers (e.g. note assignment) -- usernames only.
function listActiveUsernames(usersFile) {
  return loadUsers(usersFile)
    .filter((u) => u.active !== false)
    .map((u) => u.username);
}

module.exports = {
  loadUsers,
  findUser,
  verifyUser,
  upsertUser,
  hashPassword,
  verifyPassword,
  createPendingUser,
  regenerateSetupToken,
  setupPassword,
  updateUser,
  listUsersSafe,
  listActiveUsernames,
};
