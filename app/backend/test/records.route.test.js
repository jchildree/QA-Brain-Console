const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { createRecordsRouter } = require('../src/routes/records');

const FIXTURE = `---
id: CAP-20260101-001
type: CAP
status: Draft
version: "1.0"
owner: Joseph Childree
review_date: 2026-01-01
department: QA
tags: []
root_cause:
effectiveness_status: Pending
---

# Fixture CAP
`;

let tmpDir;
let app;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-vault-'));
  fs.writeFileSync(path.join(tmpDir, 'CAP-20260101-001.md'), FIXTURE, 'utf8');
  app = express();
  app.use(express.json());
  app.use('/api', createRecordsRouter('cap', 'CAP', tmpDir));
});

afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

describe('GET /api/cap', () => {
  it('lists all records in the type dir', async () => {
    const res = await request(app).get('/api/cap');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('CAP-20260101-001');
  });
});

describe('GET /api/cap/:filename', () => {
  it('returns frontmatter and body', async () => {
    const res = await request(app).get('/api/cap/CAP-20260101-001.md');
    expect(res.status).toBe(200);
    expect(res.body.frontmatter.id).toBe('CAP-20260101-001');
  });

  it('returns 404 for a missing record', async () => {
    const res = await request(app).get('/api/cap/does-not-exist.md');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a path-traversal filename', async () => {
    const res = await request(app).get('/api/cap/..%2F..%2Fetc.md');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/cap/:filename', () => {
  it('saves updated frontmatter and body', async () => {
    const res = await request(app)
      .put('/api/cap/CAP-20260101-001.md')
      .send({ frontmatter: { id: 'CAP-20260101-001', status: 'In Review' }, body: '# Updated\n' });
    expect(res.status).toBe(200);
    const getRes = await request(app).get('/api/cap/CAP-20260101-001.md');
    expect(getRes.body.frontmatter.status).toBe('In Review');
  });
});

describe('POST /api/cap', () => {
  it('creates a new record with a generated id and returns it', async () => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    fs.writeFileSync(path.join(tmpDir, `CAP-${todayStr}-001.md`), `---\nid: CAP-${todayStr}-001\n---\nbody`, 'utf8');
    const res = await request(app)
      .post('/api/cap')
      .send({ frontmatter: { status: 'Draft', department: 'QA' }, body: '# New CAP\n' });
    expect(res.status).toBe(201);
    expect(res.body.frontmatter.id).toMatch(new RegExp(`^CAP-${todayStr}-002$`));
    expect(res.body.filename).toMatch(new RegExp(`^CAP-${todayStr}-002\\.md$`));
  });
});
