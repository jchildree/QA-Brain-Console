import type { BlueprintField } from './sopBlueprint';

export const auditBlueprint: BlueprintField[] = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'In Review', 'Approved', 'Obsolete'], required: true },
  { key: 'version', label: 'Version', type: 'text', required: true },
  { key: 'owner', label: 'Owner', type: 'owner', required: true },
  { key: 'approved_by', label: 'Approved By', type: 'text' },
  { key: 'effective_date', label: 'Effective Date', type: 'date' },
  { key: 'review_date', label: 'Review Date', type: 'date' },
  { key: 'department', label: 'Department', type: 'select', options: ['QC', 'QA', 'IT', 'Operations'], required: true },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'audit_type', label: 'Audit Type', type: 'select', options: ['Internal', 'External', 'Supplier'] },
  { key: 'scope', label: 'Scope', type: 'text' },
  { key: 'related_documents', label: 'Related Documents', type: 'related' },
];
