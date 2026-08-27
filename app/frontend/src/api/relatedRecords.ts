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
  const uniqueParsed = Array.from(new Set(parsed.filter((p): p is string => typeof p === 'string' && p.trim() !== '')));
  const out = [...base];
  for (const id of uniqueParsed) if (!out.includes(id)) out.push(id);
  return out;
}

// Same additive dedupe-and-append shape as mergeRelated, used for tags too.
export const mergeTags = mergeRelated;

// Matches document ids anywhere in text, e.g. inside a `[[wikilink]]` or as a
// bare mention outside any "## Related" section -- parseRelatedSection only
// catches the latter when it's explicitly listed under that heading.
const INLINE_ID_RE = /\b(SOP|CAP|INC|CHG|AUD|TRN|MTG|NOTE)-\d{8}-\d{3}\b/g;

export function parseInlineIds(text: string): string[] {
  const matches = (text ?? '').match(INLINE_ID_RE) ?? [];
  return Array.from(new Set(matches));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let cachedTagPromise: Promise<string[]> | null = null;

// Every string used anywhere in an existing record's `tags` field, across
// every record type -- reuses the same "list every record of every type"
// shape as fetchAllRecordOptions.
export function fetchTagVocabulary(): Promise<string[]> {
  if (!cachedTagPromise) {
    cachedTagPromise = Promise.all(
      TYPES.map(({ urlSlug }) =>
        createRecordApi(urlSlug)
          .list()
          .then((records) =>
            records.flatMap((r) => (Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : []))
          )
      )
    ).then((lists) => Array.from(new Set(lists.flat())));
  }
  return cachedTagPromise;
}

export function resetTagVocabularyCache(): void {
  cachedTagPromise = null;
}

// Case-insensitive, word-boundary match of each vocabulary tag against text --
// no fuzzy/substring matching, just "is this known tag mentioned here".
// Uses lookaround instead of \b: \b only fires at a word/non-word transition,
// which breaks for a tag like "pH+" whose own edge char is non-word (\b right
// after the "+" never matches, since both it and a following space are non-word).
export function suggestTags(text: string, vocabulary: string[]): string[] {
  const haystack = text ?? '';
  return vocabulary.filter((tag) =>
    new RegExp(`(?<![a-zA-Z0-9_])${escapeRegExp(tag)}(?![a-zA-Z0-9_])`, 'i').test(haystack)
  );
}
