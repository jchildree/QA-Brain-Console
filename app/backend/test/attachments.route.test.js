const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { createAttachmentsRouter } = require('../src/routes/attachments');

function makeFakeProvider(fields) {
  return { extractFields: async () => fields };
}

let tmpDir;
let app;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-vault-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('POST /api/cap/:filename/attachments', () => {
  it('saves a text evidence file and returns extracted fields', async () => {
    const fakeProvider = makeFakeProvider({ department: 'QC', tags: ['evidence'], root_cause: 'r', effectiveness_status: 'Pending' });
    app = express();
    app.use('/api', createAttachmentsRouter('cap', tmpDir, fakeProvider));

    const res = await request(app)
      .post('/api/cap/CAP-20260101-001.md/attachments')
      .attach('evidence', Buffer.from('Raw evidence text content.'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(res.status).toBe(200);
    expect(res.body.extracted).toEqual({ department: 'QC', tags: ['evidence'], root_cause: 'r', effectiveness_status: 'Pending' });
    expect(fs.existsSync(path.join(tmpDir, 'attachments', 'CAP-20260101-001', 'note.txt'))).toBe(true);
  });

  it('saves a binary evidence file without attempting extraction', async () => {
    const fakeProvider = makeFakeProvider({});
    app = express();
    app.use('/api', createAttachmentsRouter('cap', tmpDir, fakeProvider));

    const res = await request(app)
      .post('/api/cap/CAP-20260101-001.md/attachments')
      .attach('evidence', Buffer.from([0xff, 0xd8, 0xff]), { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.extracted).toBeNull();
    expect(res.body.note).toMatch(/no automatic extraction/);
    expect(fs.existsSync(path.join(tmpDir, 'attachments', 'CAP-20260101-001', 'photo.jpg'))).toBe(true);
  });

  it('returns 400 when no file is attached', async () => {
    const fakeProvider = makeFakeProvider({});
    app = express();
    app.use('/api', createAttachmentsRouter('cap', tmpDir, fakeProvider));

    const res = await request(app).post('/api/cap/CAP-20260101-001.md/attachments');

    expect(res.status).toBe(400);
  });

  it('passes the urlSlug as the type to extractFields', async () => {
    let capturedType;
    const fakeProvider = { extractFields: async (rawText, type) => { capturedType = type; return {}; } };
    app = express();
    app.use('/api', createAttachmentsRouter('cap', tmpDir, fakeProvider));

    await request(app)
      .post('/api/cap/CAP-20260101-001.md/attachments')
      .attach('evidence', Buffer.from('text'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(capturedType).toBe('cap');
  });
});
