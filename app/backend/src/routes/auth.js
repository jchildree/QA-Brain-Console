const express = require('express');
const { createSessionToken } = require('../auth');
const { verifyUser, setupPassword, findUser } = require('../users');
const { COOKIE_NAME, createRequireAuth } = require('../middleware/requireAuth');
const { createLoginRateLimit } = require('../middleware/loginRateLimit');

function setSessionCookie(res, secret, username) {
  const token = createSessionToken(secret, { username });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function createAuthRouter(secret, usersFile) {
  const router = express.Router();
  const loginRateLimit = createLoginRateLimit();
  const requireAuth = createRequireAuth(secret, usersFile);

  router.post('/auth/login', loginRateLimit, (req, res) => {
    const { username, password } = req.body;
    if (!username || !verifyUser(usersFile, username, password)) {
      return res.status(401).json({ error: 'invalid username or password' });
    }
    setSessionCookie(res, secret, username);
    const user = findUser(usersFile, username);
    res.json({ ok: true, username, role: user.role || 'user' });
  });

  router.post('/auth/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  });

  router.get('/auth/me', requireAuth, (req, res) => {
    res.json({ ok: true, username: req.user, role: req.userRole });
  });

  router.post('/auth/setup-password', loginRateLimit, (req, res) => {
    const { username, token, password } = req.body;
    if (!username || !token || !password || !setupPassword(usersFile, username, token, password)) {
      return res.status(400).json({ error: 'invalid or expired setup link' });
    }
    setSessionCookie(res, secret, username);
    const user = findUser(usersFile, username);
    res.json({ ok: true, username, role: user.role || 'user' });
  });

  return router;
}

module.exports = { createAuthRouter };
