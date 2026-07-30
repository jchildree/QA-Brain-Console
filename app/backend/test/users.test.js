const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  verifyUser,
  upsertUser,
  loadUsers,
  createPendingUser,
  regenerateSetupToken,
  setupPassword,
  updateUser,
  listUsersSafe,
  listActiveUsernames,
} = require('../src/users');

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

  it('defaults role to user when creating', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    expect(loadUsers(usersFile)[0].role).toBe('user');
  });

  it('sets role explicitly when creating', () => {
    upsertUser(usersFile, 'alice', 'hunter2', 'admin');
    expect(loadUsers(usersFile)[0].role).toBe('admin');
  });

  it('preserves role and active status on a password-only reset', () => {
    upsertUser(usersFile, 'alice', 'first-password', 'admin');
    updateUser(usersFile, 'alice', { active: false });
    upsertUser(usersFile, 'alice', 'second-password');
    const alice = loadUsers(usersFile)[0];
    expect(alice.role).toBe('admin');
    expect(alice.active).toBe(false);
  });

  it('rejects a correct password for an inactive user', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    updateUser(usersFile, 'alice', { active: false });
    expect(verifyUser(usersFile, 'alice', 'hunter2')).toBe(false);
  });
});

describe('createPendingUser / setupPassword', () => {
  it('creates an account with no password set', () => {
    createPendingUser(usersFile, 'bob', 'user');
    const bob = loadUsers(usersFile)[0];
    expect(bob.hash).toBeNull();
    expect(bob.active).toBe(true);
  });

  it('rejects creating a pending account for a username that already exists', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    expect(() => createPendingUser(usersFile, 'alice', 'user')).toThrow();
  });

  it('lets a pending user set their own password with a valid token, then logs in with it', () => {
    const token = createPendingUser(usersFile, 'bob', 'user');
    expect(setupPassword(usersFile, 'bob', token, 'new-password')).toBe(true);
    expect(verifyUser(usersFile, 'bob', 'new-password')).toBe(true);
  });

  it('rejects an incorrect token', () => {
    createPendingUser(usersFile, 'bob', 'user');
    expect(setupPassword(usersFile, 'bob', 'wrong-token', 'new-password')).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = createPendingUser(usersFile, 'bob', 'user');
    const users = loadUsers(usersFile);
    users[0].setupTokenExpires = Date.now() - 1000;
    require('fs').writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
    expect(setupPassword(usersFile, 'bob', token, 'new-password')).toBe(false);
  });

  it('rejects setup on an account that already has a password', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    expect(setupPassword(usersFile, 'alice', 'any-token', 'new-password')).toBe(false);
  });

  it('regenerateSetupToken issues a new token that works', () => {
    createPendingUser(usersFile, 'bob', 'user');
    const newToken = regenerateSetupToken(usersFile, 'bob');
    expect(setupPassword(usersFile, 'bob', newToken, 'new-password')).toBe(true);
  });

  it('regenerateSetupToken refuses an account that already has a password', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    expect(() => regenerateSetupToken(usersFile, 'alice')).toThrow();
  });
});

describe('updateUser', () => {
  it('toggles active status', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    updateUser(usersFile, 'alice', { active: false });
    expect(loadUsers(usersFile)[0].active).toBe(false);
  });

  it('changes role', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    updateUser(usersFile, 'alice', { role: 'admin' });
    expect(loadUsers(usersFile)[0].role).toBe('admin');
  });

  it('throws for an unknown username', () => {
    expect(() => updateUser(usersFile, 'nobody', { active: false })).toThrow();
  });
});

describe('listUsersSafe / listActiveUsernames', () => {
  it('never leaks salt, hash, or setup token material', () => {
    upsertUser(usersFile, 'alice', 'hunter2', 'admin');
    createPendingUser(usersFile, 'bob', 'user');
    const listed = listUsersSafe(usersFile);
    expect(listed).toEqual([
      { username: 'alice', role: 'admin', active: true, pending: false },
      { username: 'bob', role: 'user', active: true, pending: true },
    ]);
    for (const u of listed) {
      expect(u).not.toHaveProperty('salt');
      expect(u).not.toHaveProperty('hash');
      expect(u).not.toHaveProperty('setupTokenHash');
    }
  });

  it('listActiveUsernames excludes inactive users', () => {
    upsertUser(usersFile, 'alice', 'hunter2');
    upsertUser(usersFile, 'bob', 'hunter2');
    updateUser(usersFile, 'bob', { active: false });
    expect(listActiveUsernames(usersFile)).toEqual(['alice']);
  });
});
