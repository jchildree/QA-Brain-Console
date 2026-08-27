const { RECORD_TYPES } = require('../config');

const RECORD_URL_SLUGS = new Set(Object.values(RECORD_TYPES).map((rt) => rt.urlSlug));

// Optional per-request allowlist for chat-assisted record creation. The
// frontend sends `allowedTypes: string[]` (urlSlugs) on POST /api/{type} when
// the user has scoped chat-assisted intake to specific record types; other
// callers (manual creates, non-record routes like /api/chat) omit it and pass
// through unrestricted.
function validateChatScope(req, res, next) {
  const { allowedTypes } = req.body || {};
  if (!Array.isArray(allowedTypes)) return next();

  const urlSlug = req.baseUrl.replace(/^\/api\//, '');
  if (!RECORD_URL_SLUGS.has(urlSlug)) return next(); // not a record-create route -- scope doesn't apply

  if (allowedTypes.includes(urlSlug)) return next();
  return res.status(403).json({ error: 'record type not in allowed scope for chat-assisted creation' });
}

module.exports = { validateChatScope };
