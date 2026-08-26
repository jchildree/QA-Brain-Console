const fs = require('fs');
const os = require('os');
const path = require('path');
const matter = require('gray-matter');
const { computeAlerts } = require('../src/alerts');

let tmpDir;

function writeRecord(dir, filename, data) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), matter.stringify('# Test', data), 'utf8');
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'alerts-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function recordTypes(overrides) {
  return {
    sop: { dir: path.join(tmpDir, 'SOP'), urlSlug: 'sops' },
    cap: { dir: path.join(tmpDir, 'CAP'), urlSlug: 'cap' },
    incident: { dir: path.join(tmpDir, 'INCIDENT'), urlSlug: 'incident' },
    change: { dir: path.join(tmpDir, 'CHANGE'), urlSlug: 'change' },
    audit: { dir: path.join(tmpDir, 'AUDIT'), urlSlug: 'audit' },
    training: { dir: path.join(tmpDir, 'TRAINING'), urlSlug: 'training' },
    meeting: { dir: path.join(tmpDir, 'MEETING'), urlSlug: 'meeting' },
    ...overrides,
  };
}

describe('computeAlerts', () => {
  it('flags an Approved SOP with review_date in the past as high severity', () => {
    const dir = path.join(tmpDir, 'SOP');
    writeRecord(dir, 'SOP-1.md', { id: 'SOP-1', status: 'Approved', review_date: daysAgo(1) });

    const alerts = computeAlerts(recordTypes());
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ id: 'SOP-1', type: 'SOP', severity: 'high' });
  });

  it('flags an Approved SOP due within 7 days as medium severity', () => {
    const dir = path.join(tmpDir, 'SOP');
    writeRecord(dir, 'SOP-2.md', { id: 'SOP-2', status: 'Approved', review_date: daysFromNow(5) });

    const alerts = computeAlerts(recordTypes());
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ id: 'SOP-2', type: 'SOP', severity: 'medium' });
  });

  it('skips a Draft SOP regardless of review_date', () => {
    const dir = path.join(tmpDir, 'SOP');
    writeRecord(dir, 'SOP-3.md', { id: 'SOP-3', status: 'Draft', review_date: daysAgo(1) });

    const alerts = computeAlerts(recordTypes());
    expect(alerts).toHaveLength(0);
  });

  it('flags a Draft CAP created more than 30 days ago as medium severity', () => {
    const dir = path.join(tmpDir, 'CAP');
    writeRecord(dir, 'CAP-1.md', { id: 'CAP-1', status: 'Draft', created: daysAgo(40) });

    const alerts = computeAlerts(recordTypes());
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ id: 'CAP-1', type: 'CAP', severity: 'medium' });
  });

  it('skips an Approved CAP created more than 30 days ago (not open)', () => {
    const dir = path.join(tmpDir, 'CAP');
    writeRecord(dir, 'CAP-2.md', { id: 'CAP-2', status: 'Approved', created: daysAgo(40) });

    const alerts = computeAlerts(recordTypes());
    expect(alerts).toHaveLength(0);
  });

  it('flags an In Review incident created more than 30 days ago as medium severity', () => {
    const dir = path.join(tmpDir, 'INCIDENT');
    writeRecord(dir, 'INC-1.md', { id: 'INC-1', status: 'In Review', created: daysAgo(40) });

    const alerts = computeAlerts(recordTypes());
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ id: 'INC-1', type: 'INCIDENT', severity: 'medium' });
  });

  it('returns an empty array when directories are empty or missing', () => {
    const alerts = computeAlerts(recordTypes());
    expect(alerts).toEqual([]);
  });

  it('sorts alerts by severity (high before medium) then by soonest dueDate', () => {
    writeRecord(path.join(tmpDir, 'SOP'), 'SOP-high.md', { id: 'SOP-high', status: 'Approved', review_date: daysAgo(1) });
    writeRecord(path.join(tmpDir, 'CAP'), 'CAP-medium-later.md', { id: 'CAP-medium-later', status: 'Draft', created: daysAgo(31) });
    writeRecord(path.join(tmpDir, 'INCIDENT'), 'INC-medium-sooner.md', { id: 'INC-medium-sooner', status: 'Draft', created: daysAgo(60) });

    const alerts = computeAlerts(recordTypes());
    expect(alerts.map((a) => a.id)).toEqual(['SOP-high', 'INC-medium-sooner', 'CAP-medium-later']);
  });
});
