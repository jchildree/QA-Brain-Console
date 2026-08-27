# Deploy Stabilization Plan

**Wave:** 6 (stabilization close-out -- runs alone, after every Wave 1-5 plan has committed. Blocks all Phase B / Jarvis waves per ADR-0001 phase order.)
**Consumes:** the fully stabilized app/backend and app/frontend from Waves 1-5
**Produces:** running prod Docker/Caddy stack reachable over LAN/tablet HTTPS; 3 provisioned user accounts (joseph/admin, IT, QA)
**Owns exclusively:** docker-compose.prod.yml, deploy/Caddyfile, deploy/certs/*, app/backend/.env (ops-only, no application code)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (this is an ops/deploy plan, not a multi-file code plan -- most tasks are shell commands run against Docker, not source edits). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the already-composed prod stack (`docker-compose.prod.yml` + `deploy/Caddyfile`) actually running and reachable from other devices on the LAN over HTTPS, with the 3 real users (joseph/admin, IT user, QA user) able to log in from a non-localhost device (including a tablet).

**Context:** Per ADR-0001 (`docs/superpowers/adrs/0001-project-scope.md`), "Deployment groundwork exists ... but nothing is actually running yet." This plan closes that gap. No code changes are expected -- this is standing up infrastructure that's already written, plus fixing whatever the first real run surfaces (self-signed cert trust, env var gaps, CORS/cookie edge cases from real-device access).

---

## What already exists (read before starting)

- `docker-compose.yml` (base) -- builds `backend` (`app/backend/Dockerfile`, port 4000, `env_file: app/backend/.env`) and `frontend` (`app/frontend/Dockerfile`, nginx serving the Vite build on port 80, exposed on host `8080` in dev).
- `docker-compose.prod.yml` (override) -- strips the direct host port publishes from `backend`/`frontend` (`ports: !override []`), rebuilds frontend with `VITE_API_BASE_URL=/api` (same-origin, no absolute URL baked in), and adds a `proxy` service (`caddy:2-alpine`) publishing `80:80` and `443:443`, mounting `./deploy/Caddyfile` and `./deploy/certs`.
- `deploy/Caddyfile` -- `auto_https off` (internal deployment, no ACME/Let's Encrypt); terminates TLS at `:443` using `/etc/caddy/certs/site.crt` + `site.key` (**files do not exist yet** -- `deploy/certs/` currently holds only `.gitkeep`, confirmed via `Get-ChildItem`); routes `/api/*` to `backend:4000`, everything else to `frontend:80`; redirects `:80` to `https`.
- `app/backend/.env` (gitignored, real file already present with placeholder values) is the **only** env file either compose file reads (`docker-compose.prod.yml` does not override `env_file:`) -- so dev and prod share one file. There is no `.env.prod`. Whoever runs the prod stack must edit this file's values before `up`, and know to revert them for local dev afterward (or keep two copies and swap manually -- see Task 2).
- `app/backend/src/config.js` -- throws at startup if `NODE_ENV=production` and `SESSION_SECRET` is unset (refuses to start with the insecure default). This is the hard gate that will catch a missed env var immediately in `docker compose logs`.
- `app/backend/src/index.js` -- in production mode: sets `trust proxy`, rejects any request that isn't `req.secure` or doesn't carry `x-forwarded-proto: https` (403 `HTTPS required`), sets HSTS, and applies `cors({ origin: FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true })`. Caddy's `reverse_proxy` sets `X-Forwarded-Proto` automatically, so this should pass once traffic actually comes through Caddy. Because the browser will hit the app at a single origin (Caddy proxies both `/api/*` and the SPA from the same `https://<host>`), these are same-origin fetches -- **the CORS `origin` mismatch (default `http://localhost:5173`) will not actually block anything in this topology**, but it's worth setting `FRONTEND_ORIGIN` correctly anyway for clarity/defense-in-depth (Task 2).
- `app/backend/scripts/create-user.js` -- `node scripts/create-user.js <username> <password> [admin|user]`, writes to `AUTH_USERS_FILE` (defaults to `app/backend/data/users.json`, which docker-compose mounts as the named volume `qa-brain-users` so it survives container rebuilds). This is how the 3 real accounts get created -- run inside the running `backend` container via `docker compose exec`.
- `app/backend/src/routes/auth.js` -- login cookie is `httpOnly, sameSite: 'lax', secure: NODE_ENV === 'production'`. `secure` cookies are only sent back over HTTPS, which is exactly what Caddy provides -- but this means a non-HTTPS fallback test will silently fail to persist login; always test through `https://`.

## Non-goals

- No Let's Encrypt / public ACME (LAN-only, `auto_https off` is deliberate).
- No new auth/permission model -- existing admin/user roles are enough for 3 users (per ADR-0001).
- No systemd/reboot-persistence automation beyond `restart: unless-stopped` (already set on all 3 services).
- Not fixing unrelated app bugs found elsewhere in the stabilization audit -- if login/deploy surfaces an actual code bug (not a config/cert issue), note it and stop; that's a separate fix, not silently absorbed into this deploy task.

---

## Task 1: Generate a self-signed TLS cert into `deploy/certs/`

**Files:**
- Create: `deploy/certs/site.crt`, `deploy/certs/site.key` (gitignored by `deploy/certs/*` + `!deploy/certs/.gitkeep` -- confirmed in `.gitignore`, safe to generate locally, never committed)

- [ ] **Step 1: Decide the LAN address the console will be reached at.**
  Determine the host machine's LAN IP (`ipconfig` -> IPv4 Address on the active adapter) or a hostname if one is set up (e.g. via router DNS or the hosts file on each device, including the tablet). Use this same value consistently as the cert's SAN and later as `FRONTEND_ORIGIN`.

- [ ] **Step 2: Generate a self-signed cert covering that IP/hostname.**
  From the repo root, using OpenSSL (available via Git Bash on this machine) or `docker run --rm -v "${PWD}/deploy/certs:/certs" alpine/openssl ...` if OpenSSL isn't on PATH:
  ```
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout deploy/certs/site.key -out deploy/certs/site.crt \
    -days 825 -subj "/CN=<LAN-IP-or-hostname>" \
    -addext "subjectAltName=IP:<LAN-IP>,DNS:<hostname-if-any>"
  ```
  Use `IP:` for a bare IP address, `DNS:` for a hostname -- include both if both will be used to reach it. A cert with only a `CN` and no `subjectAltName` will be rejected by modern browsers/mobile Safari as untrusted even after you accept the warning once, so the `-addext subjectAltName` is required, not optional.

- [ ] **Step 3: Verify the cert files landed correctly.**
  `Get-ChildItem deploy/certs` should show `site.crt`, `site.key`, `.gitkeep`. `openssl x509 -in deploy/certs/site.crt -noout -text | grep -A1 "Subject Alternative Name"` should list the IP/DNS from Step 2.

---

## Task 2: Set production env vars

**Files:**
- Edit: `app/backend/.env` (not `.env.example` -- the real gitignored file)

- [ ] **Step 1: Before editing, back up the current dev values.**
  Copy `app/backend/.env` to `app/backend/.env.dev.bak` (also gitignored via `.env.*`) so local dev can be restored after the prod smoke test without re-typing values.

- [ ] **Step 2: Set production values in `app/backend/.env`:**
  ```
  ANTHROPIC_API_KEY=<real key>
  PORT=4000
  NODE_ENV=production
  SESSION_SECRET=<random 32+ byte value, e.g. `openssl rand -hex 32`>
  FRONTEND_ORIGIN=https://<same LAN-IP-or-hostname used in Task 1>
  AI_PROVIDER=anthropic
  CUSTOM_AI_ENDPOINT=
  ```
  `NODE_ENV=production` is what triggers the `SESSION_SECRET`-required check in `config.js`, the HTTPS-required check in `index.js`, and `secure` cookies in `auth.js` -- all three must be production for this to be a real test of the prod path, not a dev server pretending.

- [ ] **Step 3: Confirm `AUTH_USERS_FILE` is left unset.**
  Leave it commented out as-is -- the default (`app/backend/data/users.json`, backed by the `qa-brain-users` named volume in `docker-compose.yml`) is correct and survives `docker compose down`/rebuilds. Do not point it at a bind mount unless there's a specific reason to.

---

## Task 3: Build and start the prod stack

- [ ] **Step 1: Build and start.**
  ```
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
  ```
  Run from the repo root (both compose files use `context: .` relative to repo root, per the comments in `docker-compose.yml`/Dockerfiles).

- [ ] **Step 2: Check all 3 containers are up and the backend didn't crash-loop on the `SESSION_SECRET` guard.**
  `docker compose ps` -- expect `backend`, `frontend`, `proxy` all `Up`/`running`. If `backend` is restarting, `docker compose logs backend` -- the most likely cause is a typo/missing var from Task 2.

- [ ] **Step 3: Confirm Caddy loaded the cert without error.**
  `docker compose logs proxy` -- look for TLS handshake/cert errors (e.g. missing file, bad PEM). A clean log has no `tls: failed to load` lines.

- [ ] **Step 4: Local smoke test from the host machine first (before testing from another device).**
  `curl -k https://localhost/api/health` should return `{"ok":true}`. The `-k` is expected here since `localhost` isn't in the cert's SAN -- this only checks Caddy -> backend routing works, not cert trust.

---

## Task 4: Create the 3 real user accounts

**Files:**
- None (writes to the `qa-brain-users` Docker volume via the running container, not a repo file)

- [ ] **Step 1: Create the admin account (joseph).**
  ```
  docker compose exec backend node scripts/create-user.js joseph "<real password>" admin
  ```
- [ ] **Step 2: Create the IT user and QA user accounts** (role `user` unless one of them should also be `admin` -- confirm with the user which role each gets; ADR-0001 says existing admin/user is sufficient but doesn't say who besides joseph is admin).
  ```
  docker compose exec backend node scripts/create-user.js <it-username> "<password>" user
  docker compose exec backend node scripts/create-user.js <qa-username> "<password>" user
  ```
- [ ] **Step 3: Verify all 3 landed in the volume.**
  `docker compose exec backend cat data/users.json` -- 3 entries, each with a `salt`/`hash` (never a plaintext password), correct `username`/`role`.

---

## Task 5: Verify from a non-localhost device (including the tablet)

- [ ] **Step 1: Trust the self-signed cert on each test device.**
  Since `auto_https off` means no public CA signed this cert, every device (including the tablet) will show a browser trust warning on first visit to `https://<LAN-IP-or-hostname>` unless the cert (or a company internal CA, if one exists and was used instead in Task 1) is installed as trusted on that device. Document exactly which path was used (manual "proceed anyway" click vs. installed profile) since it affects what other LAN users will see.

- [ ] **Step 2: Load the console from another machine on the LAN.**
  Navigate to `https://<LAN-IP-or-hostname>` (port 443, no `:8080` -- that port is not published in prod, confirmed via `ports: !override []` in `docker-compose.prod.yml`). Confirm the login page renders (proves Caddy -> frontend routing and the nginx SPA fallback in `app/frontend/nginx.conf` both work).

- [ ] **Step 3: Log in as each of the 3 users from that device.**
  For each account created in Task 4: enter credentials, confirm successful login (lands past `AuthGate`, not bounced back to `LoginPage`), confirm the session persists across a page reload (proves the `secure`/`sameSite=lax` cookie round-trips correctly over real HTTPS, not just `localhost`).

- [ ] **Step 4: Repeat Steps 2-3 from the tablet specifically.**
  Tablet browsers (mobile Safari in particular) are the strictest about cert SAN matching and cookie `secure` handling -- this is the device most likely to surface a problem the desktop test missed. If it fails where desktop succeeded, suspect the cert's SAN (Task 1, Step 2) first.

- [ ] **Step 5: Confirm an AI-provider-backed action works end-to-end for at least one user.**
  Use any flow that calls `getProvider().extractFields(...)` (e.g. the intake/extraction flow already covered by `2026-07-16-auth-and-provider-abstraction.md`) to confirm `ANTHROPIC_API_KEY` set in Task 2 actually works from inside the container (outbound network access, key validity) -- not just that the container started.

---

## Task 6: Restore local dev environment

- [ ] **Step 1: Stop the prod stack** (unless the intent is to leave it running as the permanent deployment -- confirm with the user before tearing down what they may want to keep running).
  `docker compose -f docker-compose.yml -f docker-compose.prod.yml down` if it should not stay up, or leave it running if this LAN box is meant to be the persistent host.
- [ ] **Step 2: Restore dev env values** if `app/backend/.env` needs to go back to local-dev settings for continued local development (`NODE_ENV=development`, dev `SESSION_SECRET`, `AI_PROVIDER=cli`, etc.) -- restore from `app/backend/.env.dev.bak` written in Task 2, Step 1, then delete the backup.

---

## Final verification checklist

- [ ] `docker compose ps` shows `backend`, `frontend`, `proxy` all healthy/running (or intentionally stopped, per Task 6 decision).
- [ ] `deploy/certs/site.crt` + `site.key` exist, are gitignored (`git status` shows nothing new under `deploy/certs/`), and have the correct SAN.
- [ ] `app/backend/.env` has real production values while the stack is meant to be up (or was restored to dev values if torn down).
- [ ] All 3 users exist in `data/users.json` (via `docker compose exec backend cat data/users.json`) with correct roles.
- [ ] Login + session persistence confirmed from at least one non-host device and the tablet specifically, over `https://`, not `http://` or `localhost`.
- [ ] One AI-provider-backed action confirmed working end-to-end from a non-host device.
- [ ] Any code bug surfaced during this process (as opposed to a config/cert/env issue) is written down and reported back rather than silently patched inside this deploy task.
