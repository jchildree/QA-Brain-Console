const express = require('express');
const request = require('supertest');
const { requireAdmin } = require('../src/middleware/requireAdmin');

function makeApp(role) {
  const app = express();
  app.get(
    '/api/protected',
    (req, res, next) => {
      req.userRole = role;
      next();
    },
    requireAdmin,
    (req, res) => res.json({ ok: true })
  );
  return app;
}

describe('requireAdmin', () => {
  it('allows an admin', async () => {
    const res = await request(makeApp('admin')).get('/api/protected');
    expect(res.status).toBe(200);
  });

  it('rejects a regular user with 403', async () => {
    const res = await request(makeApp('user')).get('/api/protected');
    expect(res.status).toBe(403);
  });

  it('rejects when role is unset', async () => {
    const res = await request(makeApp(undefined)).get('/api/protected');
    expect(res.status).toBe(403);
  });
});
