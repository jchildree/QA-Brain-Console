const path = require('path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..', '..', 'qa-brain');

function vaultDir(folder, envOverride) {
  return envOverride ? path.resolve(envOverride) : path.join(VAULT_ROOT, folder);
}

const SOP_DIR = vaultDir('SOP', process.env.VAULT_SOP_DIR);

const RECORD_TYPES = {
  sop: { idPrefix: 'SOP', dir: SOP_DIR, urlSlug: 'sops' },
  cap: { idPrefix: 'CAP', dir: vaultDir('CAP', process.env.VAULT_CAP_DIR), urlSlug: 'cap' },
  incident: { idPrefix: 'INC', dir: vaultDir('INCIDENT', process.env.VAULT_INCIDENT_DIR), urlSlug: 'incident' },
  change: { idPrefix: 'CHG', dir: vaultDir('CHANGE', process.env.VAULT_CHANGE_DIR), urlSlug: 'change' },
  audit: { idPrefix: 'AUD', dir: vaultDir('AUDIT', process.env.VAULT_AUDIT_DIR), urlSlug: 'audit' },
  training: { idPrefix: 'TRN', dir: vaultDir('TRAINING', process.env.VAULT_TRAINING_DIR), urlSlug: 'training' },
  meeting: { idPrefix: 'MTG', dir: vaultDir('MEETING', process.env.VAULT_MEETING_DIR), urlSlug: 'meeting' },
  notes: { idPrefix: 'NOTE', dir: vaultDir('Notes', process.env.VAULT_NOTES_DIR), urlSlug: 'notes' },
};

const TRASH_DIR = vaultDir('To-Be-Deleted', process.env.VAULT_TRASH_DIR);

const INSECURE_DEFAULT_SECRET = 'dev-only-insecure-secret-change-me';
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production -- refusing to start with the insecure default.');
}
const SESSION_SECRET = process.env.SESSION_SECRET || INSECURE_DEFAULT_SECRET;

const USERS_FILE = process.env.AUTH_USERS_FILE
  ? path.resolve(process.env.AUTH_USERS_FILE)
  : path.resolve(__dirname, '..', 'data', 'users.json');

module.exports = { SOP_DIR, RECORD_TYPES, TRASH_DIR, SESSION_SECRET, USERS_FILE };
