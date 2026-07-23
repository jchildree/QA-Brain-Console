const express = require('express');
const crypto = require('crypto');
const { createSessionToken } = require('../auth');
const { COOKIE_NAME } = require('../middleware/requireAuth');

function safeEquals(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function createAuthRouter(secret, expectedPassword) {
  const router = express.Router();

  router.post('/auth/login', (req, res) => {
    const { password } = req.body;
    if (!expectedPassword || !password || !safeEquals(password, expectedPassword)) {
      return res.status(401).json({ error: 'invalid password' });
    }
    const token = createSessionToken(secret);
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 });
    res.json({ ok: true });
  });

  router.post('/auth/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  });

  router.get('/auth/me', require('../middleware/requireAuth').createRequireAuth(secret), (req, res) => {
    res.json({ ok: true });
  });

  return router;
}

module.exports = { createAuthRouter };
