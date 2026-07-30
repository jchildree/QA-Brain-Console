import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveConflictError, extractFromText, login, checkSession, logout, createRecordApi } from './client';

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
  it('POSTs the username and password with credentials included, returning the username', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, username: 'alice' }) });
    const result = await login('alice', 'secret');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: 'alice', password: 'secret' }),
    });
    expect(result).toBe('alice');
  });

  it('returns null for a rejected login', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false });
    expect(await login('alice', 'wrong')).toBeNull();
  });
});

describe('checkSession', () => {
  it('returns the username when /api/auth/me is 200', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, username: 'alice' }) });
    expect(await checkSession()).toBe('alice');
  });

  it('returns null when /api/auth/me is 401', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false });
    expect(await checkSession()).toBeNull();
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
