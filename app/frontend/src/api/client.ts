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

export async function uploadAttachment(filename: string, file: File): Promise<{ attachmentPath: string; extracted: Record<string, unknown> | null; note: string | null }> {
  const formData = new FormData();
  formData.append('evidence', file);
  const res = await fetch(`${BASE_URL}/sops/${filename}/attachments`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error('Attachment upload failed');
  return res.json();
}

export async function login(username: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.username as string;
}

export async function checkSession(): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/auth/me`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.username as string;
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
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frontmatter, body }),
      });
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
  recordFilename: string;
  attachmentFilename: string;
}

export async function listEvidence(): Promise<EvidenceFile[]> {
  const res = await fetch(`${BASE_URL}/evidence`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load evidence library');
  return res.json();
}
