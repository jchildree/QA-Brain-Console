const express = require('express');
const { listActiveUsernames, findUser, updateUserPreferences } = require('../users');

// Non-admin-safe: usernames only, no role/active/credential material -- used to
// populate pickers (e.g. note assignment) without leaking the admin user list.
function createUsersRouter(usersFile) {
  const router = express.Router();

  router.get('/users/active', (req, res) => {
    res.json(listActiveUsernames(usersFile));
  });

  // Email digest preferences -- self-service, gated by requireAuth mounted on /api/users.
  router.get('/users/me/preferences', (req, res) => {
    const user = findUser(usersFile, req.user);
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ email: user.email || null, emailOptIn: user.emailOptIn ?? false });
  });

  router.post('/users/me/preferences', (req, res) => {
    const { email, emailOptIn } = req.body || {};
    try {
      updateUserPreferences(usersFile, req.user, { email, emailOptIn });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createUsersRouter };
