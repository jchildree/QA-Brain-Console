import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveConflictError, extractFromText, login, checkSession, logout, createRecordApi, setupPassword, adminApi, listActiveUsernames } from './client';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('extractFromText', () => {
  it('POSTs rawText and returns extracted fields', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ department: 'QA' }) });
    const result = await extractFromText('raw note');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/intake/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rawText: 'raw note' }),
    });
    expect(result).toEqual({ department: 'QA' });
  });
});

describe('login', () => {
  it('POSTs the username and password with credentials included, returning the username and role', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, username: 'alice', role: 'admin' }) });
    const result = await login('alice', 'secret');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: 'alice', password: 'secret' }),
    });
    expect(result).toEqual({ username: 'alice', role: 'admin' });
  });

  it('returns null for a rejected login', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false });
    expect(await login('alice', 'wrong')).toBeNull();
  });
});

describe('checkSession', () => {
  it('returns the username and role when /api/auth/me is 200', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, username: 'alice', role: 'user' }) });
    expect(await checkSession()).toEqual({ username: 'alice', role: 'user' });
  });

  it('returns null when /api/auth/me is 401', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false });
    expect(await checkSession()).toBeNull();
  });
});

describe('setupPassword', () => {
  it('POSTs username/token/password and returns the logged-in user', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, username: 'bob', role: 'user' }) });
    const result = await setupPassword('bob', 'sometoken', 'newpass');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/auth/setup-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: 'bob', token: 'sometoken', password: 'newpass' }),
    });
    expect(result).toEqual({ username: 'bob', role: 'user' });
  });

  it('returns null for an invalid/expired token', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false });
    expect(await setupPassword('bob', 'bad', 'newpass')).toBeNull();
  });
});

describe('adminApi', () => {
  it('lists users', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [{ username: 'alice', role: 'admin', active: true, pending: false }] });
    const result = await adminApi.listUsers();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/admin/users', { credentials: 'include' });
    expect(result).toEqual([{ username: 'alice', role: 'admin', active: true, pending: false }]);
  });

  it('creates a user', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ username: 'bob', role: 'user', setupToken: 'tok123' }) });
    const result = await adminApi.createUser('bob', 'user');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: 'bob', role: 'user' }),
    });
    expect(result).toEqual({ username: 'bob', role: 'user', setupToken: 'tok123' });
  });

  it('resends a setup link', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ setupToken: 'tok456' }) });
    const result = await adminApi.resendSetup('bob');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/admin/users/bob/resend-setup', {
      method: 'POST',
      credentials: 'include',
    });
    expect(result).toEqual({ setupToken: 'tok456' });
  });

  it('updates a user (active/role)', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    await adminApi.updateUser('bob', { active: false });
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/admin/users/bob', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: false }),
    });
  });
});

describe('listActiveUsernames', () => {
  it('GETs /api/users/active', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ['alice', 'bob'] });
    const result = await listActiveUsernames();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/users/active', { credentials: 'include' });
    expect(result).toEqual(['alice', 'bob']);
  });
});

describe('logout', () => {
  it('POSTs to /api/auth/logout with credentials included', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    await logout();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });
});

describe('createRecordApi', () => {
  const capApi = createRecordApi('cap');

  it('lists records at /api/cap', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'CAP-1' }] });
    const result = await capApi.list();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap', { credentials: 'include' });
    expect(result).toEqual([{ id: 'CAP-1' }]);
  });

  it('creates a record via POST /api/cap', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ filename: 'CAP-1.md', frontmatter: {} }) });
    await capApi.create({ status: 'Draft' }, 'body');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ frontmatter: { status: 'Draft' }, body: 'body' }),
    });
  });

  it('saves a record with expectedHash and returns the new hash', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, hash: 'new-hash' }) });
    const result = await capApi.save('CAP-1.md', { status: 'In Review' }, 'body', 'old-hash');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap/CAP-1.md', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ frontmatter: { status: 'In Review' }, body: 'body', expectedHash: 'old-hash' }),
    });
    expect(result).toEqual({ ok: true, hash: 'new-hash' });
  });

  it('throws SaveConflictError on a 409', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 409 });
    await expect(capApi.save('CAP-1.md', { status: 'In Review' }, 'body', 'stale-hash')).rejects.toThrow(SaveConflictError);
  });
});
