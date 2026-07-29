import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRecordApi, type RecordSummary } from '../api/client';
import { isOverdue } from '../components/RecordDashboard';
import { RecordCard } from '../components/RecordCard';
import { StripChart } from '../components/StripChart';
import { dailyCumulativeCounts } from '../api/chartData';

const RECORD_TYPES = [
  { type: 'sop', urlSlug: 'sops', label: 'SOP', colorVar: '--teal', api: createRecordApi('sops') },
  { type: 'cap', urlSlug: 'cap', label: 'CAP', colorVar: '--gold', api: createRecordApi('cap') },
  { type: 'incident', urlSlug: 'incident', label: 'Incident', colorVar: '--red', api: createRecordApi('incident') },
  { type: 'change', urlSlug: 'change', label: 'Change', colorVar: '--navy-dim', api: createRecordApi('change') },
  { type: 'audit', urlSlug: 'audit', label: 'Audit', colorVar: '--navy', api: createRecordApi('audit') },
  { type: 'training', urlSlug: 'training', label: 'Training', colorVar: '--ink-dim', api: createRecordApi('training') },
];

function readFolderFile(files: FileList): Promise<string> {
  const textLike = Array.from(files).find((f) => f.type.startsWith('text/') || /\.(md|txt)$/i.test(f.name));
  const target = textLike ?? files[0];
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(target);
  });
}

function AccessionPanel() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState('');
  const [type, setType] = useState('sop');
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const first = files[0] as File & { webkitRelativePath?: string };
    const folder = first.webkitRelativePath ? first.webkitRelativePath.split('/')[0] + '/' : 'selection';
    setPickedLabel(`${files.length} file${files.length === 1 ? '' : 's'} from ${folder}`);
    try {
      const text = await readFolderFile(files);
      setRawText(text);
    } catch {
      // ponytail: unreadable file, user can still paste text manually
    }
  };

  const goAccession = () => {
    navigate(`/${type}/new`, { state: { rawText } });
  };

  return (
    <div className="rail-panel">
      <div className="rail-title">New Accession</div>
      <div className="accession">
        <label
          className={`accession-drop${dragOver ? ' drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          Select a file or folder to catalogue
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Select file or folder"
            // @ts-expect-error -- non-standard attributes for folder selection
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        {pickedLabel && (
          <div className="accession-picked show">
            Selected: <b>{pickedLabel}</b>
          </div>
        )}
        <div className="accession-divider">or paste</div>
        <textarea
          placeholder="Paste raw notes to be catalogued into the register..."
          aria-label="Accession notes"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-dim)' }}>
          Catalogue as
          <select
            aria-label="Record type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', color: 'var(--ink)', borderRadius: 6, padding: '2px 6px' }}
          >
            {RECORD_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="accession-btn" disabled={!rawText.trim()} onClick={goAccession}>
          Accession
        </button>
      </div>
    </div>
  );
}

export function Overview() {
  const [records, setRecords] = useState<Record<string, RecordSummary[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    RECORD_TYPES.forEach(({ type, api }) => {
      api
        .list()
        .then((list) => setRecords((prev) => ({ ...prev, [type]: list })))
        .catch((err: Error) => setError(err.message));
    });
  }, []);

  if (error) return <p role="alert">{error}</p>;

  const all = RECORD_TYPES.flatMap(({ type, urlSlug, label }) =>
    (records[type] ?? []).map((r) => ({ record: r, type, urlSlug, label }))
  );
  const overdue = all.filter(({ record }) => isOverdue(record));
  const draftOrReview = all.filter(({ record }) => record.status === 'Draft' || record.status === 'In Review');
  const totalCount = all.length;

  const recent = [...all]
    .sort((a, b) => (a.record.id < b.record.id ? 1 : -1))
    .slice(0, 12);

  const related = all.filter(({ record }) => {
    const docs = record.related_documents;
    return Array.isArray(docs) && docs.length > 0;
  });

  return (
    <div className="flex flex-col gap-6">
      <StripChart
        title="Open Records, 14-Day Trace"
        quip="the vault has a pulse -- watch it beat"
        series={RECORD_TYPES.map(({ label, colorVar, type }) => ({
          label,
          colorVar,
          data: dailyCumulativeCounts((records[type] ?? []).map((r) => r.id)),
        }))}
        readouts={[
          { label: 'Total on file', value: String(totalCount), direction: 'flat' },
          { label: 'Overdue reviews', value: String(overdue.length), direction: overdue.length > 0 ? 'up' : 'flat' },
          { label: 'Draft / in review', value: String(draftOrReview.length), direction: 'flat' },
          { label: 'Cross-linked', value: String(related.length), direction: 'flat' },
        ]}
      />

      <div className="layout">
        <div className="specimen-grid">
          {recent.map(({ record, type, label }) => (
            <RecordCard
              key={`${type}-${record.filename}`}
              record={record}
              type={type}
              typeLabel={label}
              linkTo={`/${type}/${record.filename}`}
            />
          ))}
        </div>

        <div className="rail">
          <div className="rail-panel">
            <div className="rail-title">Drawers Requiring Attention</div>
            <div className="rail-body">
              <div className="drawer-item">
                <span>Overdue reviews</span>
                <span className="drawer-count">{overdue.length}</span>
              </div>
              <div className="drawer-item">
                <span>Draft / in review</span>
                <span className="drawer-count calm">{draftOrReview.length}</span>
              </div>
              {RECORD_TYPES.map(({ type, label }) => (
                <div className="drawer-item" key={type}>
                  <span>{label} on file</span>
                  <span className="drawer-count calm">{(records[type] ?? []).length}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rail-panel">
            <div className="rail-title">Cross-Reference</div>
            <div className="rail-body">
              {related.length === 0 ? (
                <p className="text-xs py-3" style={{ color: 'var(--ink-dim)' }}>
                  No cross-linked records yet.
                </p>
              ) : (
                related.slice(0, 6).map(({ record }) => {
                  const docs = record.related_documents as string[];
                  return docs.map((docId) => (
                    <div className="xref-row" key={`${record.id}-${docId}`}>
                      <span>{record.id}</span>
                      <span className="xref-arrow">&rarr;</span>
                      <span>{docId}</span>
                    </div>
                  ));
                })
              )}
            </div>
          </div>

          <AccessionPanel />
        </div>
      </div>
    </div>
  );
}
