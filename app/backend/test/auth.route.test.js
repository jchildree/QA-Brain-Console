const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const { createAuthRouter } = require('../src/routes/auth');
const { createRequireAuth } = require('../src/middleware/requireAuth');
const { upsertUser } = require('../src/users');

const SECRET = 'test-secret';
const USERNAME = 'alice';
const PASSWORD = 'correct-horse';

let usersFile;

beforeEach(() => {
  usersFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-brain-users-')), 'users.json');
  upsertUser(usersFile, USERNAME, PASSWORD);
});

afterEach(() => fs.rmSync(path.dirname(usersFile), { recursive: true, force: true }));

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', createAuthRouter(SECRET, usersFile));
  app.get('/api/protected', createRequireAuth(SECRET), (req, res) => res.json({ ok: true, user: req.user }));
  return app;
}

describe('POST /api/auth/login', () => {
  it('sets a session cookie and returns 200 for the correct credentials', async () => {
    const res = await request(makeApp()).post('/api/auth/login').send({ username: USERNAME, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(USERNAME);
    expect(res.headers['set-cookie'][0]).toMatch(/qa_session=/);
  });

  it('returns 401 for the wrong password', async () => {
    const res = await request(makeApp()).post('/api/auth/login').send({ username: USERNAME, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown username', async () => {
    const res = await request(makeApp()).post('/api/auth/login').send({ username: 'nobody', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('returns 401 when username is missing', async () => {
    const res = await request(makeApp()).post('/api/auth/login').send({ password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('the returned cookie grants access to a protected route and identifies the user', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: USERNAME, password: PASSWORD });
    const res = await agent.get('/api/protected');
    expect(res.status).toBe(200);
    expect(res.body.user).toBe(USERNAME);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when not logged in', async () => {
    const res = await request(makeApp()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 with the username when logged in', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: USERNAME, password: PASSWORD });
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(USERNAME);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session so a subsequent protected request 401s', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: USERNAME, password: PASSWORD });
    await agent.post('/api/auth/logout');
    const res = await agent.get('/api/protected');
    expect(res.status).toBe(401);
  });
});
