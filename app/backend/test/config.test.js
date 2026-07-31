const path = require('path');
const { SOP_DIR, RECORD_TYPES, USERS_FILE } = require('../src/config');

describe('SOP_DIR', () => {
  it('resolves to qa-brain/SOP at the repo root by default', () => {
    expect(SOP_DIR).toBe(path.resolve(__dirname, '..', '..', '..', 'qa-brain', 'SOP'));
  });
});

describe('RECORD_TYPES', () => {
  it('maps each URL slug to a vault dir and ID prefix', () => {
    expect(RECORD_TYPES.sop).toMatchObject({ idPrefix: 'SOP' });
    expect(RECORD_TYPES.cap).toMatchObject({ idPrefix: 'CAP' });
    expect(RECORD_TYPES.incident).toMatchObject({ idPrefix: 'INC' });
    expect(RECORD_TYPES.change).toMatchObject({ idPrefix: 'CHG' });
    expect(RECORD_TYPES.audit).toMatchObject({ idPrefix: 'AUD' });
    expect(RECORD_TYPES.training).toMatchObject({ idPrefix: 'TRN' });
    expect(RECORD_TYPES.meeting).toMatchObject({ idPrefix: 'MTG' });
    expect(RECORD_TYPES.notes).toMatchObject({ idPrefix: 'NOTE' });
    expect(RECORD_TYPES.cap.dir.endsWith(require('path').join('qa-brain', 'CAP'))).toBe(true);
  });
});

describe('USERS_FILE', () => {
  it('resolves to a users.json path under backend/data by default', () => {
    expect(USERS_FILE).toBe(path.resolve(__dirname, '..', 'data', 'users.json'));
  });
});
