const fs = require('fs');
const os = require('os');
const path = require('path');
const { listSops, readSop, writeSop, createRecord, moveRecord, unlinkRecord } = require('../src/vault');

const FIXTURE = `---
id: SOP-20260101-001
type: SOP
status: Approved
version: "1.0"
owner: Joseph Childree
review_date: 2026-01-01
department: QA
tags: []
---

# Fixture SOP

## 1. Purpose

Test purpose.
`;

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sop-vault-'));
  fs.writeFileSync(path.join(tmpDir, 'SOP-20260101-001.md'), FIXTURE, 'utf8');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('listSops', () => {
  it('returns frontmatter for every .md file in the dir', () => {
    const sops = listSops(tmpDir);
    expect(sops).toHaveLength(1);
    expect(sops[0]).toMatchObject({
      id: 'SOP-20260101-001',
      status: 'Approved',
      filename: 'SOP-20260101-001.md',
    });
  });

  it('ignores non-markdown files', () => {
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'not a sop', 'utf8');
    const sops = listSops(tmpDir);
    expect(sops).toHaveLength(1);
  });

  it('ignores markdown files with no id frontmatter (e.g. unrelated Obsidian notes)', () => {
    fs.writeFileSync(path.join(tmpDir, 'Random Note.md'), '---\ntags: [misc]\n---\n\nnot a QA record\n', 'utf8');
    const sops = listSops(tmpDir);
    expect(sops).toHaveLength(1);
    expect(sops[0].id).toBe('SOP-20260101-001');
  });
});

describe('readSop', () => {
  it('returns frontmatter, body, and filename', () => {
    const sop = readSop(tmpDir, 'SOP-20260101-001.md');
    expect(sop.frontmatter.id).toBe('SOP-20260101-001');
    expect(sop.body).toContain('# Fixture SOP');
    expect(sop.filename).toBe('SOP-20260101-001.md');
  });
});

describe('writeSop', () => {
  it('persists updated frontmatter and body', () => {
    writeSop(tmpDir, 'SOP-20260101-001.md', { id: 'SOP-20260101-001', status: 'In Review' }, '# Updated body\n');
    const sop = readSop(tmpDir, 'SOP-20260101-001.md');
    expect(sop.frontmatter.status).toBe('In Review');
    expect(sop.body).toContain('# Updated body');
  });
});

describe('createRecord', () => {
  it('generates the next sequence number for the given prefix and date', () => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    fs.writeFileSync(path.join(tmpDir, `CAP-${todayStr}-001.md`), `---\nid: CAP-${todayStr}-001\n---\nbody`, 'utf8');
    const { filename, frontmatter } = createRecord(tmpDir, 'CAP', { status: 'Draft' }, '# New CAP\n');
    expect(filename).toBe(`CAP-${todayStr}-002.md`);
    expect(frontmatter.id).toBe(`CAP-${todayStr}-002`);
    expect(frontmatter.status).toBe('Draft');
  });

  it('starts sequence at 001 when no records exist yet for today', () => {
    const { filename } = createRecord(tmpDir, 'INC', { status: 'Draft' }, 'body');
    expect(filename).toMatch(/^INC-\d{8}-001\.md$/);
  });

  it('persists the file so a subsequent readSop finds it', () => {
    const { filename } = createRecord(tmpDir, 'CHG', { status: 'Draft' }, '# Body\n');
    const record = readSop(tmpDir, filename);
    expect(record.frontmatter.status).toBe('Draft');
  });
});

describe('moveRecord', () => {
  it('moves a file from one dir to another, creating the destination if needed', () => {
    const trashDir = path.join(tmpDir, 'To-Be-Deleted');
    moveRecord(tmpDir, trashDir, 'SOP-20260101-001.md');
    expect(fs.existsSync(path.join(tmpDir, 'SOP-20260101-001.md'))).toBe(false);
    expect(fs.existsSync(path.join(trashDir, 'SOP-20260101-001.md'))).toBe(true);
  });

  it('moves a file back from the destination to the original dir (restore)', () => {
    const trashDir = path.join(tmpDir, 'To-Be-Deleted');
    moveRecord(tmpDir, trashDir, 'SOP-20260101-001.md');
    moveRecord(trashDir, tmpDir, 'SOP-20260101-001.md');
    expect(fs.existsSync(path.join(tmpDir, 'SOP-20260101-001.md'))).toBe(true);
  });
});

describe('unlinkRecord', () => {
  it('permanently removes a file', () => {
    unlinkRecord(tmpDir, 'SOP-20260101-001.md');
    expect(fs.existsSync(path.join(tmpDir, 'SOP-20260101-001.md'))).toBe(false);
  });
});
