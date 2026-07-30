import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listSops, getSop, saveSop, extractFromText, login, checkSession, logout, createRecordApi } from './client';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('listSops', () => {
  it('GETs /api/sops and returns parsed JSON', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'SOP-1' }] });
    const result = await listSops();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/sops', { credentials: 'include' });
    expect(result).toEqual([{ id: 'SOP-1' }]);
  });

  it('throws when the response is not ok', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false });
    await expect(listSops()).rejects.toThrow('Failed to load SOPs');
  });
});

describe('getSop', () => {
  it('GETs /api/sops/:filename', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ filename: 'a.md' }) });
    const result = await getSop('a.md');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/sops/a.md', { credentials: 'include' });
    expect(result).toEqual({ filename: 'a.md' });
  });
});

describe('saveSop', () => {
  it('PUTs frontmatter and body', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    await saveSop('a.md', { status: 'Draft' }, 'body text');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/sops/a.md', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ frontmatter: { status: 'Draft' }, body: 'body text' }),
    });
  });
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
});
