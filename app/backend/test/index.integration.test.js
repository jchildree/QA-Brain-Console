process.env.AUTH_PASSWORD = 'integration-test-password';
process.env.SESSION_SECRET = 'integration-test-secret';
process.env.VAULT_SOP_DIR = require('os').tmpdir();

const request = require('supertest');
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
    await agent.post('/api/auth/login').send({ password: 'integration-test-password' });
    const res = await agent.get('/api/sops');
    expect(res.status).toBe(200);
  });
});
