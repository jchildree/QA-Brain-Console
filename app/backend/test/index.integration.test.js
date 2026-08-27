const fs = require('fs');
const os = require('os');
const path = require('path');

const usersDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-brain-users-'));
process.env.AUTH_USERS_FILE = path.join(usersDir, 'users.json');
process.env.SESSION_SECRET = 'integration-test-secret';
process.env.VAULT_SOP_DIR = require('os').tmpdir();
process.env.VAULT_NOTES_DIR = require('os').tmpdir();

const request = require('supertest');
const { upsertUser } = require('../src/users');

upsertUser(process.env.AUTH_USERS_FILE, 'integration-test-user', 'integration-test-password');
upsertUser(process.env.AUTH_USERS_FILE, 'integration-test-admin', 'integration-test-password', 'admin');

const app = require('../src/index');

describe('index.js wiring', () => {
  it('rejects /api/sops with no session', async () => {
    const res = await request(app).get('/api/sops');
    expect(res.status).toBe(401);
  });

  it('allows /api/health with no session', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('allows /api/sops after logging in', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'integration-test-user', password: 'integration-test-password' });
    const res = await agent.get('/api/sops');
    expect(res.status).toBe(200);
  });

  it('allows /api/notes after logging in', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'integration-test-user', password: 'integration-test-password' });
    const res = await agent.get('/api/notes');
    expect(res.status).toBe(200);
  });

  it('rejects /api/admin/users for a non-admin and allows it for an admin', async () => {
    const userAgent = request.agent(app);
    await userAgent.post('/api/auth/login').send({ username: 'integration-test-user', password: 'integration-test-password' });
    const userRes = await userAgent.get('/api/admin/users');
    expect(userRes.status).toBe(403);

    const adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({ username: 'integration-test-admin', password: 'integration-test-password' });
    const adminRes = await adminAgent.get('/api/admin/users');
    expect(adminRes.status).toBe(200);
  });

  it('rejects /api/chat with no session', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'hi' });
    expect(res.status).toBe(401);
  });

  it('rejects POST /api/sops when allowedTypes excludes "sops"', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'integration-test-user', password: 'integration-test-password' });
    const res = await agent.post('/api/sops').send({ frontmatter: {}, body: '', allowedTypes: ['cap'] });
    expect(res.status).toBe(403);
  });

  it('does not block POST /api/sops when allowedTypes is omitted', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'integration-test-user', password: 'integration-test-password' });
    const res = await agent.post('/api/sops').send({ frontmatter: {}, body: '' });
    expect(res.status).not.toBe(403);
  });

  it('rejects /api/parse-frontmatter with no session and allows it after logging in', async () => {
    const noSessionRes = await request(app).post('/api/parse-frontmatter').send({ rawText: 'x' });
    expect(noSessionRes.status).toBe(401);

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'integration-test-user', password: 'integration-test-password' });
    const res = await agent.post('/api/parse-frontmatter').send({ rawText: '---\ntitle: x\n---\nbody' });
    expect(res.status).toBe(200);
  });
});
