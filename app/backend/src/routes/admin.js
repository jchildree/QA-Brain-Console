const express = require('express');
const { createPendingUser, regenerateSetupToken, updateUser, listUsersSafe } = require('../users');

const VALID_ROLES = ['admin', 'user'];

function createAdminRouter(usersFile) {
  const router = express.Router();

  router.get('/admin/users', (req, res) => {
    res.json(listUsersSafe(usersFile));
  });

  router.post('/admin/users', (req, res) => {
    const { username, role } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username is required' });
    }
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }
    try {
      const setupToken = createPendingUser(usersFile, username, role);
      res.status(201).json({ username, role: role || 'user', setupToken });
    } catch (err) {
      res.status(409).json({ error: err.message });
    }
  });

  router.post('/admin/users/:username/resend-setup', (req, res) => {
    try {
      const setupToken = regenerateSetupToken(usersFile, req.params.username);
      res.json({ setupToken });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/admin/users/:username', (req, res) => {
    const { username } = req.params;
    const { active, role } = req.body;
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }
    const isSelf = username === req.user;
    if (isSelf && (active === false || (role && role !== 'admin'))) {
      return res.status(400).json({ error: 'cannot deactivate or demote your own account' });
    }
    try {
      updateUser(usersFile, username, { active, role });
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createAdminRouter };
