const { verifySessionToken } = require('../auth');
const { findUser } = require('../users');

const COOKIE_NAME = 'qa_session';

// Looks up the live user record on every request (not just at login) so that
// deactivating a user takes effect immediately, not just after their session
// naturally expires -- and so role checks can't drift from a stale token claim.
function createRequireAuth(secret, usersFile) {
  return function requireAuth(req, res, next) {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    const username = token && verifySessionToken(token, secret);
    if (!username) {
      return res.status(401).json({ error: 'authentication required' });
    }
    const user = findUser(usersFile, username);
    if (!user || user.active === false) {
      return res.status(401).json({ error: 'authentication required' });
    }
    req.user = username;
    req.userRole = user.role || 'user';
    next();
  };
}

module.exports = { createRequireAuth, COOKIE_NAME };
