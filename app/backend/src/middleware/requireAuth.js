const { verifySessionToken } = require('../auth');

const COOKIE_NAME = 'qa_session';

function createRequireAuth(secret) {
  return function requireAuth(req, res, next) {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token || !verifySessionToken(token, secret)) {
      return res.status(401).json({ error: 'authentication required' });
    }
    next();
  };
}

module.exports = { createRequireAuth, COOKIE_NAME };
