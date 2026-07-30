# QA-Brain Console

A quality-management console for humans who would rather not manage quality in a shared spreadsheet named `CAPA_FINAL_v3_USE_THIS_ONE.xlsx`.

QA-Brain tracks SOPs, CAPs, Incidents, Changes, Audits, and Training records - with cross-linking, search, an evidence library, and a trash folder for the records you'll definitely want back in three weeks. It is a working application with tests, not a slide deck about one.

It also has a Notes area for free-form drafting and general note-taking that doesn't need to be a controlled record - meeting notes, scratch thinking, whatever. Notes cross-link to records the same way records link to each other, and any note can be promoted into a SOP/CAP/Incident/Change/Audit/Training draft in one click, landing you in the same AI-assisted intake every other record type already uses. Notes are not part of the compliance lifecycle below - see "Notes" further down.

**This vault is a drafting and analysis layer, not the system of record.** The real QMS of record is Intellect (EQMS); approved records get pushed there. Nothing in this repo is the final, authoritative documentation of a live quality system - it's where the thinking happens before that.

## What's actually in here

```
app/
  backend/    Express API, session auth, file-backed vault storage, AI-assisted intake
  frontend/   React + Vite + TypeScript console UI
qa-brain/     The vault itself - SOP/CAP/INCIDENT/CHANGE/AUDIT/TRAINING/Notes records + Dataview dashboards
```

Records are Markdown files with YAML frontmatter, one per document, filed under a strict ID scheme (`SOP-20260528-001`) and a four-state lifecycle (`Draft -> In Review -> Approved -> Obsolete`). No, you may not invent a fifth state. The Dataview dashboards will simply pretend your record doesn't exist, and they will be right to do so.

### Notes

Notes (`NOTE-20260528-001`, filed under `qa-brain/Notes/`) are exempt from that lifecycle on purpose - no status, no owner, no review date. They're a scratch space: title, an optional folder field for grouping, tags, and a body. Notes can link to records (and other notes) via the same Related Documents field every record type has, and any record or note with links pointing at it shows them in a "Referenced By" panel - that's the closest thing this app has to an Obsidian backlinks pane. "Promote to..." on a note carries its body into the normal intake+AI-extraction flow for whichever record type you pick.

## Running it locally

```bash
# backend
cd app/backend
cp .env.example .env   # fill in SESSION_SECRET, etc.
npm install
node scripts/create-user.js alice hunter2   # add a login (repeatable, resets the password if alice exists)
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
- Auth is per-user: named accounts with scrypt-hashed passwords in `app/backend/data/users.json` (gitignored, never commit it), rate-limited login, HMAC-signed session cookie carrying the username. Manage accounts with `node scripts/create-user.js <username> <password>` (also resets an existing user's password). Records get stamped with `created_by`/`updated_by` from the session, which is the actual audit trail a real QMS needs. There's no self-service signup or roles yet - every account has the same access, and adding one is a shell command, not a UI flow. Fine for a small trusted team; revisit if that stops being true.
- Vault data is flat Markdown on disk. Back it up like you mean it (Obsidian Git or equivalent). If your only copy of an incident report lives on one laptop, that is itself an incident.

## Deploying (internal server, no public DNS)

`docker-compose.prod.yml` layers a [Caddy](https://caddyserver.com/) reverse proxy on top of the base compose file: Caddy terminates TLS on `:443` and is the only container with a published port, proxying `/api/*` to the backend and everything else to the frontend. Backend and frontend become same-origin behind Caddy, so the frontend is built calling relative `/api` instead of an absolute URL baked in at build time.

1. Get a cert onto the box. No public domain here, so no Let's Encrypt -- either your company's internal CA issues one, or generate a self-signed one to get started:
   ```bash
   openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
     -keyout deploy/certs/site.key -out deploy/certs/site.crt \
     -subj "/CN=qa-brain.internal"
   ```
   Drop `site.crt` / `site.key` in `deploy/certs/` (gitignored -- never commit real keys). Clients trusting a self-signed cert will need to import it or click through the browser warning; an internal CA cert avoids that.
2. Set `app/backend/.env` for production -- `NODE_ENV=production`, a real `SESSION_SECRET`, and `FRONTEND_ORIGIN` set to the exact HTTPS origin browsers will hit (e.g. `https://qa-brain.internal`), not `localhost`.
3. Bring it up:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
4. Create the first login: `docker compose exec backend node scripts/create-user.js <username> <password>`.

`docker-compose.prod.yml` also adds `restart: unless-stopped` to every service, so the stack survives a host reboot without a babysitter.

## Known gaps before this is fully "release it and walk away" ready

- `react-router-dom` has an open high-severity advisory (RSC-mode server-action CSRF bypass, GHSA-qwww-vcr4-c8h2, affects >=7.12.0 <8.3.0 -- we're on 7.18.1, which is caught in that range). **Confirmed not exploitable**: the app uses plain `<BrowserRouter>` client-side routing, no `react-router/rsc` import, no server actions anywhere in the codebase for the CSRF bypass to act on. No patched release exists yet (7.18.2 is latest, still in the vulnerable range; no 8.x published) -- `npm audit fix` would only offer a downgrade to 7.11.0, which is a real regression for zero security benefit here. Leaving the dependency as-is; re-check when 8.3.0+ ships.

## A note on tone

Yes, this README has jokes in it. No, the ID convention, the status lifecycle, and the auth model are not jokes. Please do not test that distinction in a real audit.
