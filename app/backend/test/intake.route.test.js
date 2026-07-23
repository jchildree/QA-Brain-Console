const express = require('express');
const request = require('supertest');
const { createIntakeRouter } = require('../src/routes/intake');

function makeFakeProvider(fields) {
  return { extractFields: async () => fields };
}

describe('POST /api/intake/extract', () => {
  it('returns extracted fields for valid raw text', async () => {
    const fakeProvider = makeFakeProvider({ department: 'QA', tags: [], purpose: 'p', scope: 's' });
    const app = express();
    app.use(express.json());
    app.use('/api', createIntakeRouter(fakeProvider));

    const res = await request(app).post('/api/intake/extract').send({ rawText: 'Some raw QA note.' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ department: 'QA', tags: [], purpose: 'p', scope: 's' });
  });

  it('returns 400 when rawText is missing', async () => {
    const fakeProvider = makeFakeProvider({});
    const app = express();
    app.use(express.json());
    app.use('/api', createIntakeRouter(fakeProvider));

    const res = await request(app).post('/api/intake/extract').send({});

    expect(res.status).toBe(400);
  });

  it('returns 502 when the Claude client throws', async () => {
    const fakeProvider = { extractFields: async () => { throw new Error('upstream down'); } };
    const app = express();
    app.use(express.json());
    app.use('/api', createIntakeRouter(fakeProvider));

    const res = await request(app).post('/api/intake/extract').send({ rawText: 'text' });

    expect(res.status).toBe(502);
  });

  it('passes the given type through to the provider', async () => {
    let capturedType;
    const fakeProvider = { extractFields: async (rawText, type) => { capturedType = type; return {}; } };
    const app = express();
    app.use(express.json());
    app.use('/api', createIntakeRouter(fakeProvider));

    await request(app).post('/api/intake/extract').send({ rawText: 'text', type: 'cap' });

    expect(capturedType).toBe('cap');
  });

  it('defaults type to sop when omitted', async () => {
    let capturedType;
    const fakeProvider = { extractFields: async (rawText, type) => { capturedType = type; return {}; } };
    const app = express();
    app.use(express.json());
    app.use('/api', createIntakeRouter(fakeProvider));

    await request(app).post('/api/intake/extract').send({ rawText: 'text' });

    expect(capturedType).toBe('sop');
  });
});
