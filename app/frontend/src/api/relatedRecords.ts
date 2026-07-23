import { createRecordApi } from './client';

const TYPES = ['sop', 'cap', 'incident', 'change', 'audit', 'training'];

export interface RecordOption {
  value: string;
  label: string;
}

let cachedPromise: Promise<RecordOption[]> | null = null;

export function fetchAllRecordOptions(): Promise<RecordOption[]> {
  if (!cachedPromise) {
    cachedPromise = Promise.all(
      TYPES.map((type) =>
        createRecordApi(type)
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
