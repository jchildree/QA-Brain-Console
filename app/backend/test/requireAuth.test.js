const { createSessionToken } = require('../src/auth');
const { createRequireAuth } = require('../src/middleware/requireAuth');

const SECRET = 'test-secret';

function makeApp() {
  const express = require('express');
  const cookieParser = require('cookie-parser');
  const app = express();
  app.use(cookieParser());
  app.get('/api/protected', createRequireAuth(SECRET), (req, res) => res.json({ ok: true }));
  return app;
}

describe('requireAuth', () => {
  it('rejects a request with no session cookie', async () => {
    const request = require('supertest');
    const res = await request(makeApp()).get('/api/protected');
    expect(res.status).toBe(401);
  });

  it('rejects a request with an invalid session cookie', async () => {
    const request = require('supertest');
    const res = await request(makeApp()).get('/api/protected').set('Cookie', 'qa_session=garbage');
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid session cookie', async () => {
    const request = require('supertest');
    const token = createSessionToken(SECRET, { username: 'alice' });
    const res = await request(makeApp()).get('/api/protected').set('Cookie', `qa_session=${token}`);
    expect(res.status).toBe(200);
  });
});
