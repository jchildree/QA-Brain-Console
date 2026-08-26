const path = require('path');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (process.env.NODE_ENV === 'production' && (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY)) {
  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in production -- refusing to start. Generate with: node -e "const webpush = require(\'web-push\'); const {publicKey, privateKey} = webpush.generateVAPIDKeys(); console.log(\'Public:\', publicKey); console.log(\'Private:\', privateKey);"');
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('WARNING: VAPID keys not set. Push notifications disabled. Generate and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.');
}

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

// Evidence uploaded before it's attached to any record lands here. The
// evidence listing surfaces it as "Unlinked" alongside per-record attachments.
const UNLINKED_EVIDENCE_DIR = vaultDir(path.join('_Evidence', '_unlinked'), process.env.VAULT_UNLINKED_EVIDENCE_DIR);

const INSECURE_DEFAULT_SECRET = 'dev-only-insecure-secret-change-me';
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production -- refusing to start with the insecure default.');
}
const SESSION_SECRET = process.env.SESSION_SECRET || INSECURE_DEFAULT_SECRET;

const USERS_FILE = process.env.AUTH_USERS_FILE
  ? path.resolve(process.env.AUTH_USERS_FILE)
  : path.resolve(__dirname, '..', 'data', 'users.json');

module.exports = { SOP_DIR, RECORD_TYPES, TRASH_DIR, UNLINKED_EVIDENCE_DIR, SESSION_SECRET, USERS_FILE, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY };
