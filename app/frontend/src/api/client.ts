const BASE_URL = 'http://localhost:4000/api';

export interface SopSummary {
  id: string;
  status: string;
  version: string;
  department: string;
  review_date: string;
  owner: string;
  filename: string;
}

export interface SopDetail {
  frontmatter: Record<string, unknown>;
  body: string;
  filename: string;
}

export async function listSops(): Promise<SopSummary[]> {
  const res = await fetch(`${BASE_URL}/sops`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load SOPs');
  return res.json();
}

export async function getSop(filename: string): Promise<SopDetail> {
  const res = await fetch(`${BASE_URL}/sops/${filename}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load SOP');
  return res.json();
}

export async function saveSop(filename: string, frontmatter: Record<string, unknown>, body: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/sops/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ frontmatter, body }),
  });
  if (!res.ok) throw new Error('Failed to save SOP');
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

export async function login(password: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

export async function checkSession(): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/auth/me`, { credentials: 'include' });
  return res.ok;
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
    async save(filename: string, frontmatter: Record<string, unknown>, body: string): Promise<void> {
      const res = await fetch(`${base}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frontmatter, body }),
      });
      if (!res.ok) throw new Error(`Failed to save ${typeSlug} record`);
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
