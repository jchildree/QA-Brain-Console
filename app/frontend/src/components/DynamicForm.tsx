import { useEffect, useState } from 'react';
import type { BlueprintField } from '../blueprint/sopBlueprint';
import { fetchAllRecordOptions, type RecordOption } from '../api/relatedRecords';
import { listActiveUsernames } from '../api/client';

interface Props {
  blueprint: BlueprintField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const inputClasses = 'text-sm px-3 py-1.5 rounded-lg focus:outline-none font-mono border';
const inputStyle = { background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' };

// Free-text, comma-separated -- same input shape as the 'tags' field. Related
// documents aren't required to exist in the console yet (a note might
// reference an SOP/CAP id that only exists in the source vault so far); the
// datalist just offers known ids as autocomplete, it doesn't restrict entry.
function RelatedDocumentsPicker({
  labelText,
  value,
  onChange,
}: {
  labelText: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [options, setOptions] = useState<RecordOption[]>([]);
  const listId = `related-documents-options-${labelText.replace(/\s+/g, '-')}`;

  useEffect(() => {
    fetchAllRecordOptions()
      .then(setOptions)
      .catch(() => setOptions([]));
  }, []);

  return (
    <>
      <input
        aria-label={labelText}
        list={listId}
        className={inputClasses}
        style={inputStyle}
        type="text"
        value={value.join(', ')}
        onChange={(e) =>
          onChange(
            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
          )
        }
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </datalist>
    </>
  );
}

function AssigneePicker({
  labelText,
  value,
  onChange,
}: {
  labelText: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [usernames, setUsernames] = useState<string[]>([]);

  useEffect(() => {
    listActiveUsernames()
      .then(setUsernames)
      .catch(() => setUsernames([]));
  }, []);

  return (
    <select
      aria-label={labelText}
      className={inputClasses}
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- unassigned --</option>
      {usernames.map((username) => (
        <option key={username} value={username}>
          {username}
        </option>
      ))}
    </select>
  );
}

export function DynamicForm({ blueprint, values, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {blueprint.map((field) => {
        const labelText = `${field.label}${field.required ? ' *' : ''}`;
        return (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>{labelText}</span>
            {field.type === 'select' ? (
              <select
                aria-label={labelText}
                className={inputClasses}
                style={inputStyle}
                value={(values[field.key] as string) ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                <option value="">-- select --</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === 'related' ? (
              <RelatedDocumentsPicker
                labelText={labelText}
                value={(values[field.key] as string[]) ?? []}
                onChange={(ids) => onChange(field.key, ids)}
              />
            ) : field.type === 'user' ? (
              <AssigneePicker
                labelText={labelText}
                value={(values[field.key] as string) ?? ''}
                onChange={(username) => onChange(field.key, username)}
              />
            ) : field.type === 'tags' ? (
              <input
                aria-label={labelText}
                className={inputClasses}
                style={inputStyle}
                type="text"
                value={((values[field.key] as string[]) ?? []).join(', ')}
                onChange={(e) =>
                  onChange(
                    field.key,
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
              />
            ) : (
              <input
                aria-label={labelText}
                className={inputClasses}
                style={inputStyle}
                type={field.type === 'date' ? 'date' : 'text'}
                value={(values[field.key] as string) ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
