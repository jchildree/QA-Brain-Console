import { useEffect, useState } from 'react';
import type { BlueprintField } from '../blueprint/sopBlueprint';
import { fetchAllRecordOptions, type RecordOption } from '../api/relatedRecords';

interface Props {
  blueprint: BlueprintField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const inputClasses = 'text-sm px-3 py-1.5 rounded-lg focus:outline-none font-mono border';
const inputStyle = { background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' };

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

  useEffect(() => {
    fetchAllRecordOptions()
      .then(setOptions)
      .catch(() => setOptions([]));
  }, []);

  return (
    <select
      aria-label={labelText}
      multiple
      className={`${inputClasses} h-28`}
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((opt) => opt.value))}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
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
