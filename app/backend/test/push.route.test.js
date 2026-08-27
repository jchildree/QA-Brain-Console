const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { createPushRouter } = require('../src/routes/push');

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api', createPushRouter());
});

const validSub = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { auth: 'auth-key', p256dh: 'p256dh-key' },
};

describe('POST /api/push/send', () => {
  it('returns 400 when subscriptions is not an array', async () => {
    const res = await request(app).post('/api/push/send').send({ subscriptions: 'nope', payload: {} });
    expect(res.status).toBe(400);
  });

  it('returns 400 when payload is missing', async () => {
    const res = await request(app).post('/api/push/send').send({ subscriptions: [validSub] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when subscriptions array is empty', async () => {
    const res = await request(app).post('/api/push/send').send({ subscriptions: [], payload: { title: 'x' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when a subscription is missing its endpoint', async () => {
    const res = await request(app)
      .post('/api/push/send')
      .send({ subscriptions: [{ keys: validSub.keys }], payload: { title: 'x' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when a subscription is missing encryption keys', async () => {
    const res = await request(app)
      .post('/api/push/send')
      .send({ subscriptions: [{ endpoint: validSub.endpoint }], payload: { title: 'x' } });
    expect(res.status).toBe(400);
  });

  it('broadcasts and returns a summary for valid input (VAPID unset in test env degrades gracefully)', async () => {
    const res = await request(app)
      .post('/api/push/send')
      .send({ subscriptions: [validSub], payload: { title: 'Test Alert', body: 'hello' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.total).toBe(1);
    expect(res.body.summary.sent + res.body.summary.failed).toBeLessThanOrEqual(1);
  });
});

describe('POST /api/push/subscribe', () => {
  let subsFile;
  let authedApp;

  beforeEach(() => {
    subsFile = path.join(os.tmpdir(), `subs-test-${Date.now()}-${Math.random()}.json`);
    authedApp = express();
    authedApp.use(express.json());
    authedApp.use((req, res, next) => {
      req.user = 'alice';
      next();
    });
    authedApp.use('/api', createPushRouter(subsFile));
  });

  afterEach(() => {
    fs.rmSync(subsFile, { force: true });
  });

  it('returns 401 without an authenticated user', async () => {
    const res = await request(app).post('/api/push/subscribe').send({ subscription: validSub });
    expect(res.status).toBe(401);
  });

  it('returns 400 when subscription is missing an endpoint', async () => {
    const res = await request(authedApp).post('/api/push/subscribe').send({ subscription: { keys: validSub.keys } });
    expect(res.status).toBe(400);
  });

  it('persists the subscription for the authenticated user', async () => {
    const res = await request(authedApp).post('/api/push/subscribe').send({ subscription: validSub });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const saved = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
    expect(saved.alice).toHaveLength(1);
    expect(saved.alice[0].endpoint).toBe(validSub.endpoint);
  });

  it('replaces an existing subscription with the same endpoint instead of duplicating it', async () => {
    await request(authedApp).post('/api/push/subscribe').send({ subscription: validSub });
    await request(authedApp).post('/api/push/subscribe').send({ subscription: validSub });

    const saved = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
    expect(saved.alice).toHaveLength(1);
  });
});

describe('POST /api/push/test', () => {
  let subsFile;
  let authedApp;

  beforeEach(() => {
    subsFile = path.join(os.tmpdir(), `subs-test-${Date.now()}-${Math.random()}.json`);
    fs.writeFileSync(subsFile, JSON.stringify({ alice: [validSub] }));
    authedApp = express();
    authedApp.use(express.json());
    authedApp.use((req, res, next) => {
      req.user = 'alice';
      next();
    });
    authedApp.use('/api', createPushRouter(subsFile));
  });

  afterEach(() => {
    fs.rmSync(subsFile, { force: true });
  });

  it('returns 401 without an authenticated user', async () => {
    const res = await request(app).post('/api/push/test').send({});
    expect(res.status).toBe(401);
  });

  it('broadcasts to the authenticated user\'s stored subscriptions', async () => {
    const res = await request(authedApp).post('/api/push/test').send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
