import { useState } from 'react';
import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi, parseFrontmatter } from '../api/client';
import { parseRelatedSection, mergeRelated } from '../api/relatedRecords';

const meetingApi = createRecordApi('meeting');

const isTextLike = (f: File) => f.type.startsWith('text/') || /\.(md|txt)$/i.test(f.name);
const titleFromFilename = (name: string) => name.replace(/\.[^./]+$/, '');
const readFileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });

export function MeetingDashboard() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Each text file in the picked folder becomes its own meeting record, using
  // the file's own frontmatter; the picked folder name is a fallback folder.
  const handleFiles = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    const first = picked[0] as File & { webkitRelativePath?: string };
    const folder = first.webkitRelativePath ? first.webkitRelativePath.split('/')[0] : '';
    const textFiles = Array.from(picked).filter(isTextLike);
    setImporting(true);
    setResult(null);
    let created = 0;
    let failed = 0;
    for (const file of textFiles) {
      try {
        const text = await readFileText(file);
        const { frontmatter, body } = await parseFrontmatter(text);
        const related = mergeRelated(frontmatter.related_documents, parseRelatedSection(body));
        await meetingApi.create({ folder, title: titleFromFilename(file.name), ...frontmatter, related_documents: related }, body);
        created += 1;
      } catch {
        failed += 1;
      }
    }
    setImporting(false);
    setResult(`Imported ${created} meeting record${created === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}.`);
    if (created > 0) window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="tab-sm" style={{ cursor: 'pointer' }}>
          {importing ? 'Importing…' : 'Select a folder to import'}
          <input
            type="file"
            aria-label="Select folder to import as meeting records"
            // @ts-expect-error -- non-standard attributes for folder selection
            webkitdirectory=""
            directory=""
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        {result && <span className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }} role="status">{result}</span>}
      </div>
      <RecordDashboard api={meetingApi} title="Meeting Minute" type="meeting" />
    </div>
  );
}
