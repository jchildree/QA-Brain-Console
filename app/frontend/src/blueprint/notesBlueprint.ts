import type { BlueprintField } from './sopBlueprint';

export const notesBlueprint: BlueprintField[] = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'folder', label: 'Folder', type: 'text' },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'related_documents', label: 'Related Documents', type: 'related' },
];

// Assignment is admin-only -- regular users get notesBlueprint (no assigned_to
// field in their form at all), not a permission check on a shared field.
export const notesBlueprintAdmin: BlueprintField[] = [
  ...notesBlueprint,
  { key: 'assigned_to', label: 'Assigned To', type: 'user' },
];
