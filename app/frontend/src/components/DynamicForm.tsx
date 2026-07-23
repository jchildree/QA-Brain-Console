import type { BlueprintField } from '../blueprint/sopBlueprint';

interface Props {
  blueprint: BlueprintField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const inputClasses =
  'bg-slate-950 border border-slate-800 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-green-500 text-slate-200 font-mono';

export function DynamicForm({ blueprint, values, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {blueprint.map((field) => {
        const labelText = `${field.label}${field.required ? ' *' : ''}`;
        return (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">{labelText}</span>
            {field.type === 'select' ? (
              <select
                aria-label={labelText}
                className={inputClasses}
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
            ) : field.type === 'tags' ? (
              <input
                aria-label={labelText}
                className={inputClasses}
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
