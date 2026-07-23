const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const { createAuthRouter } = require('../src/routes/auth');
const { createRequireAuth } = require('../src/middleware/requireAuth');

const SECRET = 'test-secret';
const PASSWORD = 'correct-horse';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', createAuthRouter(SECRET, PASSWORD));
  app.get('/api/protected', createRequireAuth(SECRET), (req, res) => res.json({ ok: true }));
  return app;
}

describe('POST /api/auth/login', () => {
  it('sets a session cookie and returns 200 for the correct password', async () => {
    const res = await request(makeApp()).post('/api/auth/login').send({ password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/qa_session=/);
  });

  it('returns 401 for the wrong password', async () => {
    const res = await request(makeApp()).post('/api/auth/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects every password, including the literal string "null", when expectedPassword is unset', async () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', createAuthRouter(SECRET, null));

    const res = await request(app).post('/api/auth/login').send({ password: 'null' });
    expect(res.status).toBe(401);
  });

  it('the returned cookie grants access to a protected route', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ password: PASSWORD });
    const res = await agent.get('/api/protected');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when not logged in', async () => {
    const res = await request(makeApp()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 when logged in', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ password: PASSWORD });
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session so a subsequent protected request 401s', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ password: PASSWORD });
    await agent.post('/api/auth/logout');
    const res = await agent.get('/api/protected');
    expect(res.status).toBe(401);
  });
});
