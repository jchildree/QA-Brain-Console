import type { BlueprintField } from './sopBlueprint';

export const notesBlueprint: BlueprintField[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'folder', label: 'Folder', type: 'text' },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'related_documents', label: 'Related Documents', type: 'related' },
];
