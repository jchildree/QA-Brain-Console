import { createRecordApi } from './client';

// urlSlug differs from type for sop ('sops', per app/backend/src/config.js RECORD_TYPES)
// -- every other type's urlSlug happens to equal its type key.
export const TYPES = [
  { type: 'sop', urlSlug: 'sops' },
  { type: 'cap', urlSlug: 'cap' },
  { type: 'incident', urlSlug: 'incident' },
  { type: 'change', urlSlug: 'change' },
  { type: 'audit', urlSlug: 'audit' },
  { type: 'training', urlSlug: 'training' },
  { type: 'meeting', urlSlug: 'meeting' },
  { type: 'notes', urlSlug: 'notes' },
];

export interface RecordOption {
  value: string;
  label: string;
  title: string;
}

let cachedPromise: Promise<RecordOption[]> | null = null;

export function fetchAllRecordOptions(): Promise<RecordOption[]> {
  if (!cachedPromise) {
    cachedPromise = Promise.all(
      TYPES.map(({ type, urlSlug }) =>
        createRecordApi(urlSlug)
          .list()
          .then((records) =>
            records.map((r) => {
              const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : r.id;
              return { value: r.id, title, label: `${type.toUpperCase()}: ${title}` };
            })
          )
      )
    ).then((lists) => lists.flat());
  }
  return cachedPromise;
}

export function resetRecordOptionsCache(): void {
  cachedPromise = null;
}

// Some notes list their links in a body section:
//   ## Related
//   - [[SOP-20260101-001]]
//   - CAP-20260101-002
// Everything from a "Related" heading down to the next heading is treated as a
// related document, one per line. Strips list markers and [[wikilink]] braces.
export function parseRelatedSection(text: string): string[] {
  const lines = (text ?? '').split(/\r?\n/);
  const ids: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const heading = line.match(/^\s*#{1,6}\s+(.*\S)\s*$/);
    if (heading) {
      inSection = /^related\b/i.test(heading[1].trim());
      continue;
    }
    if (!inSection) continue;
    const cleaned = line
      .replace(/^\s*(?:[-*+]|\d+\.)\s*/, '') // list marker
      .replace(/\[\[|\]\]/g, '') // wikilink braces
      .trim();
    if (cleaned) ids.push(cleaned);
  }
  return ids;
}

export function mergeRelated(existing: unknown, parsed: string[]): string[] {
  const base = Array.isArray(existing) ? existing.filter((x): x is string => typeof x === 'string') : [];
  const out = [...base];
  for (const id of parsed) if (!out.includes(id)) out.push(id);
  return out;
}
