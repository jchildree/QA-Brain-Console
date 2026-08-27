import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveConflictError, extractFromText, login, checkSession, logout, createRecordApi, setupPassword, adminApi, listActiveUsernames, listEvidence, uploadAttachment, setChatScope } from './client';

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

describe('listEvidence', () => {
  it('GETs /api/evidence', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ type: 'notes', urlSlug: 'notes', recordFilename: 'NOTE-1.md', attachmentFilename: 'report.pdf' }],
    });
    const result = await listEvidence();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/evidence', { credentials: 'include' });
    expect(result).toEqual([{ type: 'notes', urlSlug: 'notes', recordFilename: 'NOTE-1.md', attachmentFilename: 'report.pdf' }]);
  });
});

describe('uploadAttachment', () => {
  it('POSTs the file to the given urlSlug/filename attachments route', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ attachmentPath: 'attachments/NOTE-1/report.pdf', extracted: null, note: null }) });
    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
    const result = await uploadAttachment('notes', 'NOTE-1.md', file);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/notes/NOTE-1.md/attachments');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.body.get('evidence')).toBe(file);
    expect(result).toEqual({ attachmentPath: 'attachments/NOTE-1/report.pdf', extracted: null, note: null });
  });

  it('throws on a failed upload', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false });
    const file = new File(['content'], 'report.pdf');
    await expect(uploadAttachment('notes', 'NOTE-1.md', file)).rejects.toThrow('Attachment upload failed');
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

  describe('chat scope', () => {
    afterEach(() => localStorage.removeItem('qa_brain_chat_scope'));

    it('includes allowedTypes from localStorage on create when a scope is set', async () => {
      setChatScope(['sops', 'cap']);
      (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ filename: 'CAP-1.md', frontmatter: {} }) });
      await capApi.create({ status: 'Draft' }, 'body');
      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frontmatter: { status: 'Draft' }, body: 'body', allowedTypes: ['sops', 'cap'] }),
      });
    });

    it('still sends the request when the scope excludes this type (backend enforces the reject)', async () => {
      setChatScope(['sops']);
      (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ filename: 'CAP-1.md', frontmatter: {} }) });
      await capApi.create({ status: 'Draft' }, 'body');
      const [, init] = (fetch as any).mock.calls[0];
      expect(JSON.parse(init.body).allowedTypes).toEqual(['sops']);
    });

    it('throws a user-facing message when the backend rejects with 403', async () => {
      setChatScope(['sops']);
      (fetch as any).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'record type not in allowed scope for chat-assisted creation' }) });
      await expect(capApi.create({ status: 'Draft' }, 'body')).rejects.toThrow('record type not in allowed scope for chat-assisted creation');
    });
  });
});
