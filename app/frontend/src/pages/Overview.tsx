import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createRecordApi, parseFrontmatter, type RecordSummary } from '../api/client';
import { parseRelatedSection, mergeRelated } from '../api/relatedRecords';
import { RecordCard } from '../components/RecordCard';
import { StripChart } from '../components/StripChart';
import { DonutChart } from '../components/DonutChart';
import { dailyCumulativeCounts, statusBreakdown, STATUS_COLORS, effectivenessFunnel } from '../api/chartData';
import { useAlerts } from '../hooks/useAlerts';

const RECORD_TYPES = [
  { type: 'sop', urlSlug: 'sops', label: 'SOP', colorVar: '--teal', api: createRecordApi('sops') },
  { type: 'cap', urlSlug: 'cap', label: 'CAP', colorVar: '--gold', api: createRecordApi('cap') },
  { type: 'incident', urlSlug: 'incident', label: 'Incident', colorVar: '--red', api: createRecordApi('incident') },
  { type: 'change', urlSlug: 'change', label: 'Change', colorVar: '--navy-dim', api: createRecordApi('change') },
  { type: 'audit', urlSlug: 'audit', label: 'Audit', colorVar: '--navy', api: createRecordApi('audit') },
  { type: 'training', urlSlug: 'training', label: 'Training', colorVar: '--ink-dim', api: createRecordApi('training') },
  { type: 'meeting', urlSlug: 'meeting', label: 'Meeting Minutes', colorVar: '--plum', api: createRecordApi('meeting') },
];

const notesApi = createRecordApi('notes');

function isTextLike(file: File): boolean {
  return file.type.startsWith('text/') || /\.(md|txt)$/i.test(file.name);
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^./]+$/, '');
}

function AccessionPanel() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState('');
  const [folderName, setFolderName] = useState('');
  const [titleName, setTitleName] = useState('');
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multiple files (a selected/dropped folder, or several loose files at
  // once) each get their own note immediately -- no clicking through one at a
  // time. Each file's own frontmatter (title/folder/tags/related_documents/
  // etc, parsed as-is) is what lands in the note; the dropped folder name is
  // only a fallback for files that don't already specify their own folder.
  const importFolder = async (files: File[], folder: string) => {
    setImportResult(null);
    setImporting(true);
    let created = 0;
    let failed = 0;
    for (const file of files) {
      try {
        const text = await readFileText(file);
        const { frontmatter, body } = await parseFrontmatter(text);
        const related = mergeRelated(frontmatter.related_documents, parseRelatedSection(body));
        await notesApi.create({ folder, title: titleFromFilename(file.name), ...frontmatter, related_documents: related }, body);
        created += 1;
      } catch {
        failed += 1;
      }
    }
    setImporting(false);
    setImportResult(
      `Imported ${created} note${created === 1 ? '' : 's'} from ${folder ? folder + '/' : 'selection'}${failed ? ` (${failed} failed)` : ''}.`
    );
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const first = files[0] as File & { webkitRelativePath?: string };
    const folder = first.webkitRelativePath ? first.webkitRelativePath.split('/')[0] : '';
    const textFiles = Array.from(files).filter(isTextLike);

    if (files.length > 1) {
      await importFolder(textFiles, folder);
      return;
    }

    const target = textFiles[0] ?? files[0];
    setFolderName(folder);
    setTitleName(titleFromFilename(target.name));
    setPickedLabel(`1 file from ${folder ? folder + '/' : 'selection'}`);
    try {
      setRawText(await readFileText(target));
    } catch {
      // ponytail: unreadable file, user can still paste text manually
    }
  };

  // Accessioning always lands in Notes, not a fixed QMS type -- a dropped
  // folder can hold mixed record types or ones already organized, and forcing
  // one type up front broke that. The dropped folder's name carries through
  // as the note's folder field; promote it to a real record type later. The
  // file's own name (if this came from a file rather than pasted text) seeds
  // the title -- extraction can't out-rank a name we already know is right.
  const goAccession = () => {
    navigate('/notes/new', { state: { rawText, folder: folderName, title: titleName } });
  };

  return (
    <div className="rail-panel">
      <div className="rail-title">New Notes/Folder</div>
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
        {importing && (
          <div className="accession-picked show" role="status">
            Importing notes…
          </div>
        )}
        {importResult && (
          <div className="accession-picked show" role="status">
            {importResult}{' '}
            <button type="button" className="accession-btn" onClick={() => navigate('/notes')}>
              View Notes
            </button>
          </div>
        )}
        <div className="accession-divider">or paste</div>
        <textarea
          placeholder="Paste raw notes to be catalogued into the register..."
          aria-label="Accession notes"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <button type="button" className="accession-btn" disabled={!rawText.trim()} onClick={goAccession}>
          UPLOAD
        </button>
      </div>
    </div>
  );
}

export function Overview() {
  const [records, setRecords] = useState<Record<string, RecordSummary[]>>({});
  const [failedTypes, setFailedTypes] = useState<string[]>([]);
  const { alerts } = useAlerts();

  useEffect(() => {
    RECORD_TYPES.forEach(({ type, api }) => {
      api
        .list()
        .then((list) => setRecords((prev) => ({ ...prev, [type]: list })))
        .catch(() => setFailedTypes((prev) => (prev.includes(type) ? prev : [...prev, type])));
    });
  }, []);

  const all = RECORD_TYPES.flatMap(({ type, urlSlug, label }) =>
    (records[type] ?? []).map((r) => ({ record: r, type, urlSlug, label }))
  );
  const draftOrReview = all.filter(({ record }) => record.status === 'Draft' || record.status === 'In Review');
  const totalCount = all.length;

  const recent = [...all]
    .sort((a, b) => (a.record.id < b.record.id ? 1 : -1))
    .slice(0, 12);

  const related = all.filter(({ record }) => {
    const docs = record.related_documents;
    return Array.isArray(docs) && docs.length > 0;
  });

  // Records whose status isn't one of the 4 controlled values are dropped from
  // every per-type donut -- roll them into an "Other" bucket so nothing hides.
  const knownStatuses = new Set(STATUS_COLORS.map(({ label }) => label));
  const otherCount = all.filter(({ record }) => !knownStatuses.has(record.status as string)).length;

  const capEffectiveness = effectivenessFunnel(records['cap'] ?? []);
  const capCount = (label: string) => capEffectiveness.find((s) => s.label === label)?.value ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {failedTypes.length > 0 && (
        <p role="alert" className="text-sm" style={{ color: 'var(--red)' }}>
          Failed to load: {failedTypes.map((t) => RECORD_TYPES.find((rt) => rt.type === t)?.label ?? t).join(', ')}
        </p>
      )}
      <details className="metrics-section" open>
        <summary className="metrics-summary">
          Metrics
          <span className="chart-quip" style={{ marginLeft: 10 }}>collapse to focus on the register</span>
        </summary>
        <div className="flex flex-col gap-6" style={{ marginTop: 16 }}>
          <StripChart
            title="Open Records, 14-Day Trace"
            quip="the vault has a pulse -- watch it beat"
            series={RECORD_TYPES.map(({ label, colorVar, type }) => ({
              label,
              colorVar,
              data: dailyCumulativeCounts((records[type] ?? []).map((r) => r.id)),
            }))}
            footer={
              <>
                <div className="chart-head" style={{ marginTop: 12 }}>
                  <span className="chart-title">Status by Record Type</span>
                  <span className="chart-quip">where every drawer stands in the lifecycle</span>
                  <div className="chart-legend">
                    {STATUS_COLORS.map((s) => (
                      <span key={s.label}>
                        <i className="swatch" style={{ background: `var(${s.colorVar})` }} />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="donut-row">
                  {RECORD_TYPES.map(({ type, label }) => (
                    <DonutChart key={type} title={label} data={statusBreakdown(records[type] ?? [])} />
                  ))}
                  <DonutChart title="Other" data={[{ label: 'Uncategorized', value: otherCount, colorVar: '--ink-dim' }]} />
                </div>
                <div className="chart-readout">
                  <div>
                    <span className="r-label">CAP Pending</span>
                    <span className="r-value r-flat">{capCount('Pending')} &#9644;</span>
                  </div>
                  <div>
                    <span className="r-label">CAP Pass</span>
                    <span className="r-value r-up">{capCount('Pass')} &#9650;</span>
                  </div>
                  <div>
                    <span className="r-label">CAP Fail</span>
                    <span className="r-value r-down">{capCount('Fail')} &#9660;</span>
                  </div>
                </div>
              </>
            }
          />
        </div>
      </details>

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
          <AccessionPanel />

          <div className="rail-panel">
            <div className="rail-title">Drawers Requiring Attention</div>
            <div className="rail-body">
              {alerts.length === 0 ? (
                <p className="text-xs py-3" style={{ color: 'var(--ink-dim)' }}>
                  No overdue or due-soon reviews.
                </p>
              ) : (
                alerts.map((alert) => {
                  const rt = RECORD_TYPES.find((r) => r.type.toUpperCase() === alert.type);
                  const type = rt?.type ?? alert.type.toLowerCase();
                  return (
                    <Link
                      key={alert.id}
                      to={`/${type}/${alert.id}.md`}
                      className={`drawer-item alert-row${alert.severity === 'high' ? ' alert-high' : ' alert-medium'}`}
                    >
                      <span>{alert.id}</span>
                      <span className="drawer-count calm" style={{ fontSize: 11, fontWeight: 600 }}>{alert.reason}</span>
                    </Link>
                  );
                })
              )}
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
        </div>
      </div>
    </div>
  );
}
