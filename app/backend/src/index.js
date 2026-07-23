require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { RECORD_TYPES, SESSION_SECRET, AUTH_PASSWORD } = require('./config');
const { getProvider } = require('./providers');
const { createRecordsRouter } = require('./routes/records');
const { createIntakeRouter } = require('./routes/intake');
const { createAttachmentsRouter } = require('./routes/attachments');
const { createSearchRouter } = require('./routes/search');
const { createEvidenceRouter } = require('./routes/evidence');
const { createAuthRouter } = require('./routes/auth');
const { createRequireAuth } = require('./middleware/requireAuth');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', createAuthRouter(SESSION_SECRET, AUTH_PASSWORD));

const requireAuth = createRequireAuth(SESSION_SECRET);
const provider = getProvider();

app.use('/api/intake', requireAuth);
app.use('/api', createIntakeRouter(provider));

for (const [slug, { idPrefix, dir, urlSlug }] of Object.entries(RECORD_TYPES)) {
  app.use(`/api/${urlSlug}`, requireAuth);
  app.use('/api', createRecordsRouter(urlSlug, idPrefix, dir));
  app.use('/api', createAttachmentsRouter(urlSlug, dir, provider));
}

app.use('/api/search', requireAuth);
app.use('/api', createSearchRouter(RECORD_TYPES));

app.use('/api/evidence', requireAuth);
app.use('/api', createEvidenceRouter(RECORD_TYPES));

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  if (!AUTH_PASSWORD) console.warn('WARNING: AUTH_PASSWORD is not set -- login will reject all attempts. Set it in .env.');
  if (!process.env.SESSION_SECRET) console.warn('WARNING: SESSION_SECRET is not set -- using an insecure default from source control. Set it in .env.');
  app.listen(PORT, () => console.log(`QA-Brain backend listening on ${PORT}`));
}

module.exports = app;
