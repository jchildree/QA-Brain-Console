const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { createEvidenceRouter } = require('../src/routes/evidence');

let capDir;
let sopDir;
let recordTypes;
let app;

beforeEach(() => {
  capDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-vault-'));
  sopDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sop-vault-'));

  fs.mkdirSync(path.join(capDir, 'attachments', 'CAP-20260101-001'), { recursive: true });
  fs.writeFileSync(path.join(capDir, 'attachments', 'CAP-20260101-001', 'note.txt'), 'evidence text', 'utf8');
  fs.writeFileSync(path.join(capDir, 'attachments', 'CAP-20260101-001', 'photo.jpg'), Buffer.from([0xff]), 'utf8');

  recordTypes = {
    sop: { idPrefix: 'SOP', dir: sopDir, urlSlug: 'sops' },
    cap: { idPrefix: 'CAP', dir: capDir, urlSlug: 'cap' },
  };

  app = express();
  app.use(express.json());
  app.use('/api', createEvidenceRouter(recordTypes));
});

afterEach(() => {
  fs.rmSync(capDir, { recursive: true, force: true });
  fs.rmSync(sopDir, { recursive: true, force: true });
});

describe('GET /api/evidence', () => {
  it('lists every attachment across all record types with a link back to the owning record', async () => {
    const res = await request(app).get('/api/evidence');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const note = res.body.find((f) => f.attachmentFilename === 'note.txt');
    expect(note).toMatchObject({
      type: 'cap',
      urlSlug: 'cap',
      recordFilename: 'CAP-20260101-001.md',
      attachmentFilename: 'note.txt',
    });
  });

  it('returns an empty list when no attachments exist yet', async () => {
    fs.rmSync(path.join(capDir, 'attachments'), { recursive: true, force: true });
    const res = await request(app).get('/api/evidence');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
