const fs = require('fs');
const os = require('os');
const path = require('path');
const { verifyUser, upsertUser, loadUsers } = require('../src/users');

let usersFile;

beforeEach(() => {
  usersFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-brain-users-')), 'users.json');
});

afterEach(() => fs.rmSync(path.dirname(usersFile), { recursive: true, force: true }));

describe('upsertUser / verifyUser', () => {
  it('verifies a freshly created user with the correct password', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    expect(verifyUser(usersFile, 'alice', 'hunter2')).toBe(true);
  });

  it('rejects the wrong password', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    expect(verifyUser(usersFile, 'alice', 'wrong')).toBe(false);
  });

  it('rejects an unknown username', () => {
    expect(verifyUser(usersFile, 'nobody', 'anything')).toBe(false);
  });

  it('never stores the password in plaintext', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    const raw = fs.readFileSync(usersFile, 'utf8');
    expect(raw).not.toContain('hunter2');
  });

  it('resets an existing user password rather than duplicating them', () => {
    upsertUser(usersFile, 'alice', 'first-password');
    upsertUser(usersFile, 'alice', 'second-password');
    expect(loadUsers(usersFile)).toHaveLength(1);
    expect(verifyUser(usersFile, 'alice', 'first-password')).toBe(false);
    expect(verifyUser(usersFile, 'alice', 'second-password')).toBe(true);
  });
});
