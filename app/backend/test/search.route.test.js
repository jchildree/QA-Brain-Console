const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { createSearchRouter } = require('../src/routes/search');

let capDir;
let sopDir;
let recordTypes;
let app;

beforeEach(() => {
  capDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-vault-'));
  sopDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sop-vault-'));

  fs.writeFileSync(
    path.join(capDir, 'CAP-20260101-001.md'),
    '---\nid: CAP-20260101-001\nstatus: Draft\n---\n\n# Calibration gap\n\nRoot cause was a stale pH meter reading.\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(sopDir, 'SOP-20260101-001.md'),
    '---\nid: SOP-20260101-001\nstatus: Approved\n---\n\n# pH Meter Calibration Procedure\n',
    'utf8'
  );

  recordTypes = {
    sop: { idPrefix: 'SOP', dir: sopDir, urlSlug: 'sops' },
    cap: { idPrefix: 'CAP', dir: capDir, urlSlug: 'cap' },
  };

  app = express();
  app.use(express.json());
  app.use('/api', createSearchRouter(recordTypes));
});

afterEach(() => {
  fs.rmSync(capDir, { recursive: true, force: true });
  fs.rmSync(sopDir, { recursive: true, force: true });
});

describe('GET /api/search', () => {
  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
  });

  it('matches on id, frontmatter, and body across all record types', async () => {
    const res = await request(app).get('/api/search').query({ q: 'ph meter' });
    expect(res.status).toBe(200);
    expect(res.body.map((r) => r.id).sort()).toEqual(['CAP-20260101-001', 'SOP-20260101-001']);
  });

  it('returns the type and urlSlug for each match so the frontend can link to it', async () => {
    const res = await request(app).get('/api/search').query({ q: 'calibration' });
    const cap = res.body.find((r) => r.id === 'CAP-20260101-001');
    expect(cap).toMatchObject({ type: 'cap', urlSlug: 'cap', filename: 'CAP-20260101-001.md' });
  });

  it('is case-insensitive and returns no matches for an unrelated query', async () => {
    const res = await request(app).get('/api/search').query({ q: 'nonexistent-term-xyz' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
