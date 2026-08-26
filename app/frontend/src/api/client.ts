const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export class SaveConflictError extends Error {
  constructor() {
    super('This record changed on disk since it was loaded. Reload and re-apply your edits.');
    this.name = 'SaveConflictError';
  }
}

export async function extractFromText(rawText: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/intake/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rawText }),
  });
  if (!res.ok) throw new Error('Extraction failed');
  return res.json();
}

export async function parseFrontmatter(rawText: string): Promise<{ frontmatter: Record<string, unknown>; body: string }> {
  const res = await fetch(`${BASE_URL}/parse-frontmatter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rawText }),
  });
  if (!res.ok) throw new Error('Failed to parse frontmatter');
  return res.json();
}

export async function uploadAttachment(urlSlug: string, filename: string, file: File): Promise<{ attachmentPath: string; extracted: Record<string, unknown> | null; note: string | null }> {
  const formData = new FormData();
  formData.append('evidence', file);
  const res = await fetch(`${BASE_URL}/${urlSlug}/${filename}/attachments`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error('Attachment upload failed');
  return res.json();
}

export type Role = 'admin' | 'user';

export interface AuthedUser {
  username: string;
  role: Role;
}

export async function login(username: string, password: string): Promise<AuthedUser | null> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { username: data.username, role: data.role };
}

export async function checkSession(): Promise<AuthedUser | null> {
  const res = await fetch(`${BASE_URL}/auth/me`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return { username: data.username, role: data.role };
}

export async function setupPassword(username: string, token: string, password: string): Promise<AuthedUser | null> {
  const res = await fetch(`${BASE_URL}/auth/setup-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, token, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { username: data.username, role: data.role };
}

export interface AdminUserSummary {
  username: string;
  role: Role;
  active: boolean;
  pending: boolean;
}

export const adminApi = {
  async listUsers(): Promise<AdminUserSummary[]> {
    const res = await fetch(`${BASE_URL}/admin/users`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },
  async createUser(username: string, role: Role): Promise<{ username: string; role: Role; setupToken: string }> {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, role }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to create user');
    return res.json();
  },
  async resendSetup(username: string): Promise<{ setupToken: string }> {
    const res = await fetch(`${BASE_URL}/admin/users/${username}/resend-setup`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to resend setup link');
    return res.json();
  },
  async updateUser(username: string, updates: { active?: boolean; role?: Role }): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/users/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update user');
  },
};

export async function listActiveUsernames(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/users/active`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export interface RecordSummary {
  id: string;
  status: string;
  version: string;
  department: string;
  review_date: string;
  owner: string;
  filename: string;
  [key: string]: unknown;
}

export interface RecordDetail {
  frontmatter: Record<string, unknown>;
  body: string;
  filename: string;
  hash: string;
}

// One overdue/due-soon/aging flag computed server-side (see backend/src/alerts.js).
// `type` is the uppercase record-type ("SOP", "CAP", ...); `id` combined with
// ".md" is the record's filename by convention (vault.js always names files
// `${id}.md`).
export interface Alert {
  id: string;
  type: string;
  urlSlug: string;
  reason: string;
  dueDate: string;
  severity: 'high' | 'medium' | 'low';
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(`${BASE_URL}/alerts`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load alerts');
  return res.json();
}

// Per-device scope restricting which record types allow chat-assisted (AI
// intake) creates. Unset = unrestricted (all types allowed); this is the
// default so existing behavior is unchanged until a user opts into scoping
// via the Settings page. See ChatScopePicker.tsx.
const CHAT_SCOPE_KEY = 'qa_brain_chat_scope';

export function getChatScope(): string[] | null {
  try {
    const raw = localStorage.getItem(CHAT_SCOPE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setChatScope(allowedTypes: string[]): void {
  try {
    localStorage.setItem(CHAT_SCOPE_KEY, JSON.stringify(allowedTypes));
  } catch {
    // localStorage unavailable (private mode, etc.) -- scope just won't persist.
  }
}

export function createRecordApi(typeSlug: string) {
  const base = `${BASE_URL}/${typeSlug}`;

  return {
    async list(): Promise<RecordSummary[]> {
      const res = await fetch(base, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load ${typeSlug} records`);
      return res.json();
    },
    async get(filename: string): Promise<RecordDetail> {
      const res = await fetch(`${base}/${filename}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load ${typeSlug} record`);
      return res.json();
    },
    async save(filename: string, frontmatter: Record<string, unknown>, body: string, expectedHash?: string): Promise<{ hash: string }> {
      const res = await fetch(`${base}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frontmatter, body, expectedHash }),
      });
      if (res.status === 409) throw new SaveConflictError();
      if (!res.ok) throw new Error(`Failed to save ${typeSlug} record`);
      return res.json();
    },
    async create(frontmatter: Record<string, unknown>, body: string): Promise<RecordDetail> {
      const allowedTypes = getChatScope();
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(allowedTypes ? { frontmatter, body, allowedTypes } : { frontmatter, body }),
      });
      if (res.status === 403) {
        const detail = (await res.json().catch(() => ({}))).error;
        throw new Error(detail || `${typeSlug} is not enabled for chat-assisted creation. Ask an admin to enable it, or create it manually via the record editor.`);
      }
      if (!res.ok) throw new Error(`Failed to create ${typeSlug} record`);
      return res.json();
    },
    async extract(rawText: string): Promise<Record<string, unknown>> {
      const res = await fetch(`${BASE_URL}/intake/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rawText, type: typeSlug }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      return res.json();
    },
    async remove(filename: string): Promise<void> {
      const res = await fetch(`${base}/${filename}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to delete ${typeSlug} record`);
    },
  };
}

export function createTrashApi() {
  const base = `${BASE_URL}/trash`;

  return {
    async list(): Promise<RecordSummary[]> {
      const res = await fetch(base, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load trash');
      return res.json();
    },
    async restore(filename: string): Promise<void> {
      const res = await fetch(`${base}/${filename}/restore`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to restore record');
    },
    async purge(filename: string): Promise<void> {
      const res = await fetch(`${base}/${filename}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to permanently delete record');
    },
  };
}

export interface EvidenceFile {
  type: string;
  urlSlug: string;
  recordFilename: string | null;
  attachmentFilename: string;
}

export async function listEvidence(): Promise<EvidenceFile[]> {
  const res = await fetch(`${BASE_URL}/evidence`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load evidence library');
  return res.json();
}

export async function uploadUnlinkedEvidence(files: File[]): Promise<{ saved: string[] }> {
  const formData = new FormData();
  for (const file of files) formData.append('evidence', file);
  const res = await fetch(`${BASE_URL}/evidence/unlinked`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))).error;
    throw new Error(detail ? `Evidence upload failed: ${detail}` : `Evidence upload failed (${res.status})`);
  }
  return res.json();
}
