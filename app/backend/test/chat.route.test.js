const express = require('express');
const request = require('supertest');
const { createChatRouter } = require('../src/routes/chat');
const { validateChatScope } = require('../src/middleware/validateChatScope');

const RECORD_TYPES = { sop: {}, cap: {} };

function buildApp(provider, { withScopeMiddleware = false } = {}) {
  const app = express();
  app.use(express.json());
  if (withScopeMiddleware) app.use('/api/chat', validateChatScope);
  app.use('/api', createChatRouter(provider, RECORD_TYPES));
  return app;
}

describe('POST /api/chat', () => {
  it('returns 400 when message is missing', async () => {
    const app = buildApp({ chat: async () => ({ text: 'x' }) });
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is empty/whitespace', async () => {
    const app = buildApp({ chat: async () => ({ text: 'x' }) });
    const res = await request(app).post('/api/chat').send({ message: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when messages history has an invalid shape', async () => {
    const app = buildApp({ chat: async () => ({ text: 'x' }) });
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'hi', messages: [{ role: 'user' }] });
    expect(res.status).toBe(400);
  });

  it('appends message to history and calls provider.chat with tool definitions', async () => {
    let capturedMessages;
    let capturedTools;
    const provider = {
      chat: async (messages, tools) => {
        capturedMessages = messages;
        capturedTools = tools;
        return { text: 'We have three SOPs.' };
      },
    };
    const app = buildApp(provider);

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Tell me more',
        messages: [{ role: 'user', content: 'What SOPs do we have?' }, { role: 'assistant', content: 'Some.' }],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ text: 'We have three SOPs.' });
    expect(capturedMessages).toEqual([
      { role: 'user', content: 'What SOPs do we have?' },
      { role: 'assistant', content: 'Some.' },
      { role: 'user', content: 'Tell me more' },
    ]);
    expect(capturedTools.map((t) => t.name)).toEqual(['search', 'readRecord']);
    expect(capturedTools[1].input_schema.properties.type.enum).toEqual(['sop', 'cap']);
  });

  it('normalizes an Anthropic-shaped raw response into { text, toolUse }', async () => {
    const provider = {
      chat: async () => ({
        content: [
          { type: 'text', text: 'Let me check.' },
          { type: 'tool_use', name: 'search', input: { query: 'ph meter' } },
        ],
      }),
    };
    const app = buildApp(provider);

    const res = await request(app).post('/api/chat').send({ message: 'find ph meter sops' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      text: 'Let me check.',
      toolUse: { name: 'search', input: { query: 'ph meter' } },
    });
  });

  it('passes through an already-structured { text, toolUse } response unchanged', async () => {
    const provider = { chat: async () => ({ text: 'plain answer' }) };
    const app = buildApp(provider);

    const res = await request(app).post('/api/chat').send({ message: 'hi' });

    expect(res.body).toEqual({ text: 'plain answer' });
  });

  it('returns 502 when provider.chat throws', async () => {
    const provider = { chat: async () => { throw new Error('upstream down'); } };
    const app = buildApp(provider);

    const res = await request(app).post('/api/chat').send({ message: 'hi' });

    expect(res.status).toBe(502);
  });

  it('still 200s when validateChatScope is wrapped in front of it with an allowed scope set', async () => {
    const provider = { chat: async () => ({ text: 'plain answer' }) };
    const app = buildApp(provider, { withScopeMiddleware: true });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'hi', allowedTypes: ['sop', 'cap'] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ text: 'plain answer' });
  });
});
