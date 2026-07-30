const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const { createAuthRouter } = require('../src/routes/auth');
const { createAdminRouter } = require('../src/routes/admin');
const { createRequireAuth } = require('../src/middleware/requireAuth');
const { requireAdmin } = require('../src/middleware/requireAdmin');
const { upsertUser, setupPassword } = require('../src/users');

const SECRET = 'test-secret';

let usersFile;
let app;

beforeEach(() => {
  usersFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-brain-users-')), 'users.json');
  upsertUser(usersFile, 'admin-user', 'adminpass', 'admin');
  upsertUser(usersFile, 'plain-user', 'userpass', 'user');

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', createAuthRouter(SECRET, usersFile));
  const requireAuth = createRequireAuth(SECRET, usersFile);
  app.use('/api/admin', requireAuth, requireAdmin);
  app.use('/api', createAdminRouter(usersFile));
});

afterEach(() => fs.rmSync(path.dirname(usersFile), { recursive: true, force: true }));

async function loginAs(username, password) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username, password });
  return agent;
}

describe('GET /api/admin/users', () => {
  it('returns the full user list for an admin, with no credential material', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(200);
    const usernames = res.body.map((u) => u.username);
    expect(usernames).toEqual(expect.arrayContaining(['admin-user', 'plain-user']));
    expect(res.body[0]).not.toHaveProperty('hash');
  });

  it('returns 403 for a non-admin', async () => {
    const agent = await loginAs('plain-user', 'userpass');
    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(403);
  });

  it('returns 401 with no session', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/users', () => {
  it('creates a pending user and returns a setup token an actual setup-password call accepts', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.post('/api/admin/users').send({ username: 'newbie', role: 'user' });
    expect(res.status).toBe(201);
    expect(res.body.setupToken).toBeTruthy();
    expect(setupPassword(usersFile, 'newbie', res.body.setupToken, 'chosen-password')).toBe(true);
  });

  it('rejects a duplicate username with 409', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.post('/api/admin/users').send({ username: 'plain-user', role: 'user' });
    expect(res.status).toBe(409);
  });

  it('rejects an invalid role with 400', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.post('/api/admin/users').send({ username: 'newbie', role: 'superuser' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/users/:username/resend-setup', () => {
  it('issues a new working token for a pending user', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    await agent.post('/api/admin/users').send({ username: 'newbie', role: 'user' });
    const res = await agent.post('/api/admin/users/newbie/resend-setup');
    expect(res.status).toBe(200);
    expect(setupPassword(usersFile, 'newbie', res.body.setupToken, 'chosen-password')).toBe(true);
  });
});

describe('PATCH /api/admin/users/:username', () => {
  it('toggles active status', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.patch('/api/admin/users/plain-user').send({ active: false });
    expect(res.status).toBe(200);
    const list = await agent.get('/api/admin/users');
    expect(list.body.find((u) => u.username === 'plain-user').active).toBe(false);
  });

  it('changes role', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.patch('/api/admin/users/plain-user').send({ role: 'admin' });
    expect(res.status).toBe(200);
    const list = await agent.get('/api/admin/users');
    expect(list.body.find((u) => u.username === 'plain-user').role).toBe('admin');
  });

  it('refuses to let an admin deactivate their own account', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.patch('/api/admin/users/admin-user').send({ active: false });
    expect(res.status).toBe(400);
  });

  it('refuses to let an admin demote their own account', async () => {
    const agent = await loginAs('admin-user', 'adminpass');
    const res = await agent.patch('/api/admin/users/admin-user').send({ role: 'user' });
    expect(res.status).toBe(400);
  });
});
