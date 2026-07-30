const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSessionToken } = require('../src/auth');
const { createRequireAuth } = require('../src/middleware/requireAuth');
const { upsertUser, updateUser } = require('../src/users');

const SECRET = 'test-secret';

let usersFile;

beforeEach(() => {
  usersFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-brain-users-')), 'users.json');
});

afterEach(() => fs.rmSync(path.dirname(usersFile), { recursive: true, force: true }));

function makeApp() {
  const express = require('express');
  const cookieParser = require('cookie-parser');
  const app = express();
  app.use(cookieParser());
  app.get('/api/protected', createRequireAuth(SECRET, usersFile), (req, res) =>
    res.json({ ok: true, user: req.user, role: req.userRole })
  );
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

  it('rejects a valid session cookie for a username with no user record', async () => {
    const request = require('supertest');
    const token = createSessionToken(SECRET, { username: 'ghost' });
    const res = await request(makeApp()).get('/api/protected').set('Cookie', `qa_session=${token}`);
    expect(res.status).toBe(401);
  });

  it('allows a request with a valid session cookie for an active user, and exposes role', async () => {
    const request = require('supertest');
    upsertUser(usersFile, 'alice', 'hunter2', 'admin');
    const token = createSessionToken(SECRET, { username: 'alice' });
    const res = await request(makeApp()).get('/api/protected').set('Cookie', `qa_session=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBe('alice');
    expect(res.body.role).toBe('admin');
  });

  it('rejects an otherwise-valid session for a deactivated user', async () => {
    const request = require('supertest');
    upsertUser(usersFile, 'alice', 'hunter2');
    const token = createSessionToken(SECRET, { username: 'alice' });
    updateUser(usersFile, 'alice', { active: false });
    const res = await request(makeApp()).get('/api/protected').set('Cookie', `qa_session=${token}`);
    expect(res.status).toBe(401);
  });
});
