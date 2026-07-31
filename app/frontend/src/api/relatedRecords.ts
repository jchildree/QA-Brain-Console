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
}

let cachedPromise: Promise<RecordOption[]> | null = null;

export function fetchAllRecordOptions(): Promise<RecordOption[]> {
  if (!cachedPromise) {
    cachedPromise = Promise.all(
      TYPES.map(({ type, urlSlug }) =>
        createRecordApi(urlSlug)
          .list()
          .then((records) => records.map((r) => ({ value: r.id, label: `${type.toUpperCase()}: ${r.id}` })))
      )
    ).then((lists) => lists.flat());
  }
  return cachedPromise;
}

export function resetRecordOptionsCache(): void {
  cachedPromise = null;
}
