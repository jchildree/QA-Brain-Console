const { verifySessionToken } = require('../auth');

const COOKIE_NAME = 'qa_session';

function createRequireAuth(secret) {
  return function requireAuth(req, res, next) {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    const username = token && verifySessionToken(token, secret);
    if (!username) {
      return res.status(401).json({ error: 'authentication required' });
    }
    req.user = username;
    next();
  };
}

module.exports = { createRequireAuth, COOKIE_NAME };
