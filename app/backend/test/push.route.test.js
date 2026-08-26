const express = require('express');
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
