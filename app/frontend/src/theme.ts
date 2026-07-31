// Stamp class per record type, matching the artifact's .stamp-* colors:
// SOP teal, CAP gold, Incident red, Change navy-dim, Audit gold, Training ink-dim, Meeting plum.
export const stampClass: Record<string, string> = {
  SOP: 'stamp-sop',
  CAP: 'stamp-cap',
  Incident: 'stamp-inc',
  Change: 'stamp-chg',
  Audit: 'stamp-aud',
  Training: 'stamp-trn',
  Meeting: 'stamp-mtg',
};

export const DEFAULT_STAMP = 'stamp-trn';
