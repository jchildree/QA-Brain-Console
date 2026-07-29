# QA-Brain Console

A quality-management console for humans who would rather not manage quality in a shared spreadsheet named `CAPA_FINAL_v3_USE_THIS_ONE.xlsx`.

QA-Brain tracks SOPs, CAPs, Incidents, Changes, Audits, and Training records - with cross-linking, search, an evidence library, and a trash folder for the records you'll definitely want back in three weeks. It is a working application with tests, not a slide deck about one.

**This vault is a drafting and analysis layer, not the system of record.** The real QMS of record is Intellect (EQMS); approved records get pushed there. Nothing in this repo is the final, authoritative documentation of a live quality system - it's where the thinking happens before that.

## What's actually in here

```
app/
  backend/    Express API, session auth, file-backed vault storage, AI-assisted intake
  frontend/   React + Vite + TypeScript console UI
qa-brain/     The vault itself - SOP/CAP/INCIDENT/CHANGE/AUDIT/TRAINING records + Dataview dashboards
```

Records are Markdown files with YAML frontmatter, one per document, filed under a strict ID scheme (`SOP-20260528-001`) and a four-state lifecycle (`Draft -> In Review -> Approved -> Obsolete`). No, you may not invent a fifth state. The Dataview dashboards will simply pretend your record doesn't exist, and they will be right to do so.

## Running it locally

```bash
# backend
cd app/backend
cp .env.example .env   # fill in SESSION_SECRET, AUTH_PASSWORD, etc.
npm install
npm start               # http://localhost:4000

# frontend, in another terminal
cd app/frontend
npm install
npm run dev              # http://localhost:5173
```

Or skip both terminals and let Docker Compose do the typing:

```bash
docker compose up --build
```

Backend on `:4000`, frontend on `:8080`, vault data mounted straight from `./qa-brain` on the host, so a container restart doesn't take your CAPs with it.

## Testing

```bash
cd app/backend  && npm test    # vitest, backend
cd app/frontend && npm test    # vitest, frontend
cd app/frontend && npm run build   # tsc -b && vite build
```

CI (`.github/workflows/ci.yml`) runs all three on every push and PR to `main`/`master`, plus a Docker build smoke test, so if it's broken, it'll be broken loudly and in public, not quietly on your machine at 4:58pm on a Friday.

## Production notes

- Set `NODE_ENV=production` and a real `SESSION_SECRET`. The backend will refuse to boot in production without one, rather than quietly falling back to a secret that's sitting in this repo's git history for anyone to read.
- Put a TLS-terminating reverse proxy in front of the backend. It enforces HTTPS via `x-forwarded-proto` and will 403 plain HTTP on purpose. This is a feature, not a bug you get to file.
- Auth is currently a single shared password (rate-limited, HMAC-signed session cookie). Per-user accounts with individual audit trails are a known, tracked gap, see the punch list below, not an oversight anyone is proud of.
- Vault data is flat Markdown on disk. Back it up like you mean it (Obsidian Git or equivalent). If your only copy of an incident report lives on one laptop, that is itself an incident.

## Known gaps before this is fully "release it and walk away" ready

- Multi-user accounts / per-user audit trail (currently one shared password for everyone with API access - fine for a small trusted team, not fine for a real audit)
- No deployment target configured yet beyond "a machine that can run Docker Compose"
- `react-router` has an open high-severity advisory (RSC CSRF bypass); likely not exploitable here since this is a plain client SPA, not RSC, but it's unconfirmed and worth a look before you forget it exists

## A note on tone

Yes, this README has jokes in it. No, the ID convention, the status lifecycle, and the auth model are not jokes. Please do not test that distinction in a real audit.
