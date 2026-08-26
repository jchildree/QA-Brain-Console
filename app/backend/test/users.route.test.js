const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const { createAuthRouter } = require('../src/routes/auth');
const { createUsersRouter } = require('../src/routes/users');
const { createRequireAuth } = require('../src/middleware/requireAuth');
const { upsertUser, updateUser } = require('../src/users');

const SECRET = 'test-secret';

let usersFile;
let app;

beforeEach(() => {
  usersFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-brain-users-')), 'users.json');
  upsertUser(usersFile, 'alice', 'hunter2', 'admin');
  upsertUser(usersFile, 'bob', 'hunter2', 'user');
  upsertUser(usersFile, 'carol', 'hunter2', 'user');
  updateUser(usersFile, 'carol', { active: false });

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', createAuthRouter(SECRET, usersFile));
  const requireAuth = createRequireAuth(SECRET, usersFile);
  app.use('/api/users', requireAuth);
  app.use('/api', createUsersRouter(usersFile));
});

afterEach(() => fs.rmSync(path.dirname(usersFile), { recursive: true, force: true }));

describe('GET /api/users/active', () => {
  it('returns just usernames for active users, works for a non-admin session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'bob', password: 'hunter2' });
    const res = await agent.get('/api/users/active');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining(['alice', 'bob']));
    expect(res.body).not.toContain('carol');
  });

  it('returns 401 with no session', async () => {
    const res = await request(app).get('/api/users/active');
    expect(res.status).toBe(401);
  });
});

describe('GET/POST /api/users/me/preferences', () => {
  it('defaults to no email and opted out', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'bob', password: 'hunter2' });
    const res = await agent.get('/api/users/me/preferences');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: null, emailOptIn: false });
  });

  it('sets and reads back email + opt-in', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'bob', password: 'hunter2' });
    const post = await agent.post('/api/users/me/preferences').send({ email: 'bob@example.com', emailOptIn: true });
    expect(post.status).toBe(200);
    const res = await agent.get('/api/users/me/preferences');
    expect(res.body).toEqual({ email: 'bob@example.com', emailOptIn: true });
  });

  it('does not affect another user\'s preferences', async () => {
    const agentBob = request.agent(app);
    await agentBob.post('/api/auth/login').send({ username: 'bob', password: 'hunter2' });
    await agentBob.post('/api/users/me/preferences').send({ email: 'bob@example.com', emailOptIn: true });

    const agentAlice = request.agent(app);
    await agentAlice.post('/api/auth/login').send({ username: 'alice', password: 'hunter2' });
    const res = await agentAlice.get('/api/users/me/preferences');
    expect(res.body).toEqual({ email: null, emailOptIn: false });
  });

  it('returns 401 with no session', async () => {
    const res = await request(app).get('/api/users/me/preferences');
    expect(res.status).toBe(401);
  });
});
