import { useState } from 'react';
import { getChatScope, setChatScope } from '../api/client';

// urlSlug differs from type for sop ('sops') -- see app/backend/src/config.js
// RECORD_TYPES / api/relatedRecords.ts TYPES. These are the values sent as
// `allowedTypes` and checked by the backend's validateChatScope middleware.
const TYPES = [
  { urlSlug: 'sops', label: 'SOP' },
  { urlSlug: 'cap', label: 'CAP' },
  { urlSlug: 'incident', label: 'Incident' },
  { urlSlug: 'change', label: 'Change' },
  { urlSlug: 'audit', label: 'Audit' },
  { urlSlug: 'training', label: 'Training' },
  { urlSlug: 'meeting', label: 'Meeting Minutes' },
  { urlSlug: 'notes', label: 'Notes' },
];

// Self-contained: reads/writes localStorage directly rather than lifting
// scope into shared app state, since api.create() also reads localStorage
// directly at call time -- no context/provider needed for one consumer.
export function ChatScopePicker() {
  const [scope, setScope] = useState<string[]>(() => getChatScope() ?? TYPES.map((t) => t.urlSlug));

  const toggle = (urlSlug: string) => {
    const next = scope.includes(urlSlug) ? scope.filter((s) => s !== urlSlug) : [...scope, urlSlug];
    setScope(next);
    setChatScope(next);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-dim)' }}>
        Chat-Assisted Record Types
      </legend>
      {TYPES.map(({ urlSlug, label }) => (
        <label key={urlSlug} className="flex items-center gap-2.5">
          <input
            type="checkbox"
            aria-label={label}
            checked={scope.includes(urlSlug)}
            onChange={() => toggle(urlSlug)}
          />
          <span className="text-sm">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
