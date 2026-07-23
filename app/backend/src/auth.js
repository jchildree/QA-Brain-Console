const crypto = require('crypto');

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function createSessionToken(secret, { now = Date.now(), ttlMs = DEFAULT_TTL_MS } = {}) {
  const expires = now + ttlMs;
  const payload = String(expires);
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

function verifySessionToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = sign(payload, secret);
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

module.exports = { createSessionToken, verifySessionToken };
