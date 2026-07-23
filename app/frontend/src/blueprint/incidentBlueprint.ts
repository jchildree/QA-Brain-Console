import type { BlueprintField } from './sopBlueprint';

export const incidentBlueprint: BlueprintField[] = [
  { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'In Review', 'Approved', 'Obsolete'], required: true },
  { key: 'version', label: 'Version', type: 'text', required: true },
  { key: 'owner', label: 'Owner', type: 'text', required: true },
  { key: 'approved_by', label: 'Approved By', type: 'text' },
  { key: 'effective_date', label: 'Effective Date', type: 'date' },
  { key: 'review_date', label: 'Review Date', type: 'date', required: true },
  { key: 'department', label: 'Department', type: 'select', options: ['QC', 'QA', 'IT', 'Operations'], required: true },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'detection_method', label: 'Detection Method', type: 'text' },
  { key: 'related_documents', label: 'Related Documents', type: 'related' },
];
