const crypto = require('crypto');

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function createSessionToken(secret, { username, now = Date.now(), ttlMs = DEFAULT_TTL_MS } = {}) {
  const expires = now + ttlMs;
  const payload = Buffer.from(JSON.stringify({ username, expires }), 'utf8').toString('base64url');
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

// Returns the username on a valid, unexpired, correctly-signed token; false otherwise.
function verifySessionToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = sign(payload, secret);
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return false;
  }
  if (!claims.username || !Number.isFinite(claims.expires)) return false;
  if (Date.now() >= claims.expires) return false;
  return claims.username;
}

module.exports = { createSessionToken, verifySessionToken };
