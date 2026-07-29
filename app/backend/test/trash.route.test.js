const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { createTrashRouter } = require('../src/routes/trash');

const FIXTURE = `---
id: CAP-20260101-001
type: CAP
status: Draft
---

# Fixture CAP
`;

let tmpDir;
let trashDir;
let capDir;
let app;
let RECORD_TYPES;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trash-vault-'));
  trashDir = path.join(tmpDir, 'To-Be-Deleted');
  capDir = path.join(tmpDir, 'CAP');
  fs.mkdirSync(capDir, { recursive: true });
  fs.mkdirSync(trashDir, { recursive: true });
  fs.writeFileSync(path.join(trashDir, 'CAP-20260101-001.md'), FIXTURE, 'utf8');
  RECORD_TYPES = { cap: { idPrefix: 'CAP', dir: capDir, urlSlug: 'cap' } };
  app = express();
  app.use(express.json());
  app.use('/api', createTrashRouter(RECORD_TYPES, trashDir));
});

afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

describe('GET /api/trash', () => {
  it('lists records currently in the trash dir', async () => {
    const res = await request(app).get('/api/trash');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('CAP-20260101-001');
  });
});

describe('POST /api/trash/:filename/restore', () => {
  it('moves the record back to its original type dir', async () => {
    const res = await request(app).post('/api/trash/CAP-20260101-001.md/restore');
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(trashDir, 'CAP-20260101-001.md'))).toBe(false);
    expect(fs.existsSync(path.join(capDir, 'CAP-20260101-001.md'))).toBe(true);
  });

  it('returns 409 if a record with the same filename already exists at the destination', async () => {
    fs.writeFileSync(path.join(capDir, 'CAP-20260101-001.md'), FIXTURE, 'utf8');
    const res = await request(app).post('/api/trash/CAP-20260101-001.md/restore');
    expect(res.status).toBe(409);
    expect(fs.existsSync(path.join(trashDir, 'CAP-20260101-001.md'))).toBe(true);
  });

  it('returns 404 for a record not in trash', async () => {
    const res = await request(app).post('/api/trash/CAP-20260101-999.md/restore');
    expect(res.status).toBe(404);
  });

  it('returns 400 for an unknown record type prefix', async () => {
    fs.writeFileSync(path.join(trashDir, 'XYZ-20260101-001.md'), '---\nid: XYZ-20260101-001\n---\nbody', 'utf8');
    const res = await request(app).post('/api/trash/XYZ-20260101-001.md/restore');
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/trash/:filename', () => {
  it('permanently deletes the record', async () => {
    const res = await request(app).delete('/api/trash/CAP-20260101-001.md');
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(trashDir, 'CAP-20260101-001.md'))).toBe(false);
  });

  it('returns 404 for a missing record', async () => {
    const res = await request(app).delete('/api/trash/does-not-exist.md');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a path-traversal filename', async () => {
    const res = await request(app).delete('/api/trash/..%2F..%2Fetc.md');
    expect(res.status).toBe(400);
  });
});
