import type { BlueprintField } from './sopBlueprint';

export const trainingBlueprint: BlueprintField[] = [
  { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'In Review', 'Approved', 'Obsolete'], required: true },
  { key: 'version', label: 'Version', type: 'text', required: true },
  { key: 'owner', label: 'Owner', type: 'text', required: true },
  { key: 'approved_by', label: 'Approved By', type: 'text' },
  { key: 'effective_date', label: 'Effective Date', type: 'date' },
  { key: 'review_date', label: 'Review Date', type: 'date', required: true },
  { key: 'department', label: 'Department', type: 'select', options: ['QC', 'QA', 'IT', 'Operations'], required: true },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'employee_name', label: 'Employee Name', type: 'text' },
  { key: 'role', label: 'Role', type: 'text' },
  { key: 'related_documents', label: 'Related Documents', type: 'related' },
];
