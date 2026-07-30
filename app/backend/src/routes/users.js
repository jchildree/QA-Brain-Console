const express = require('express');
const { listActiveUsernames } = require('../users');

// Non-admin-safe: usernames only, no role/active/credential material -- used to
// populate pickers (e.g. note assignment) without leaking the admin user list.
function createUsersRouter(usersFile) {
  const router = express.Router();

  router.get('/users/active', (req, res) => {
    res.json(listActiveUsernames(usersFile));
  });

  return router;
}

module.exports = { createUsersRouter };
