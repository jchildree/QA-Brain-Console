require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { RECORD_TYPES, TRASH_DIR, UNLINKED_EVIDENCE_DIR, SESSION_SECRET, USERS_FILE } = require('./config');
const { loadUsers } = require('./users');
const { getProvider } = require('./providers');
const { createRecordsRouter } = require('./routes/records');
const { createIntakeRouter } = require('./routes/intake');
const { createAttachmentsRouter } = require('./routes/attachments');
const { createSearchRouter } = require('./routes/search');
const { createAlertsRouter } = require('./routes/alerts');
const { createChatRouter } = require('./routes/chat');
const { createEvidenceRouter } = require('./routes/evidence');
const { createTrashRouter } = require('./routes/trash');
const { createAuthRouter } = require('./routes/auth');
const { createAdminRouter } = require('./routes/admin');
const { createUsersRouter } = require('./routes/users');
const { createParseRouter } = require('./routes/parse');
const { createRequireAuth } = require('./middleware/requireAuth');
const { requireAdmin } = require('./middleware/requireAdmin');
const { validateChatScope } = require('./middleware/validateChatScope');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (req.secure || req.get('x-forwarded-proto') === 'https') return next();
    return res.status(403).json({ error: 'HTTPS required' });
  });
}

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', createAuthRouter(SESSION_SECRET, USERS_FILE));

const requireAuth = createRequireAuth(SESSION_SECRET, USERS_FILE);
const provider = getProvider();

app.use('/api/admin', requireAuth, requireAdmin);
app.use('/api', createAdminRouter(USERS_FILE));

app.use('/api/users', requireAuth);
app.use('/api', createUsersRouter(USERS_FILE));

app.use('/api/parse-frontmatter', requireAuth);
app.use('/api', createParseRouter());

app.use('/api/intake', requireAuth);
app.use('/api', createIntakeRouter(provider));

for (const [slug, { idPrefix, dir, urlSlug }] of Object.entries(RECORD_TYPES)) {
  app.use(`/api/${urlSlug}`, requireAuth, validateChatScope);
  app.use('/api', createRecordsRouter(urlSlug, idPrefix, dir, TRASH_DIR));
  app.use('/api', createAttachmentsRouter(urlSlug, dir, provider));
}

app.use('/api/search', requireAuth);
app.use('/api', createSearchRouter(RECORD_TYPES));

app.use('/api/chat', requireAuth, validateChatScope);
app.use('/api', createChatRouter(provider, RECORD_TYPES));

app.use('/api/alerts', requireAuth);
app.use('/api', createAlertsRouter());

app.use('/api/evidence', requireAuth);
app.use('/api', createEvidenceRouter(RECORD_TYPES, UNLINKED_EVIDENCE_DIR));

app.use('/api/trash', requireAuth);
app.use('/api', createTrashRouter(RECORD_TYPES, TRASH_DIR));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal server error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  if (loadUsers(USERS_FILE).length === 0) {
    console.warn(`WARNING: no users in ${USERS_FILE} -- login will reject all attempts. Run: node scripts/create-user.js <username> <password>`);
  }
  if (!process.env.SESSION_SECRET) console.warn('WARNING: SESSION_SECRET is not set -- using an insecure default from source control. Set it in .env.');
  app.listen(PORT, () => console.log(`QA-Brain backend listening on ${PORT}`));
}

module.exports = app;
