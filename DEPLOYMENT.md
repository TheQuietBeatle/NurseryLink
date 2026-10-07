# NurseryLink — Deployment Guide

Fixes the "Could not reach the server. Please try again." error on sign-in for the
Vercel-hosted frontend, and documents the steps to deploy the backend.

Written after the `tsc -b` build fix (commit `68d8bc2 fixing deployment`).

---

## 1. Why sign-in fails in production

The message comes from the generic network-error fallback in
`NurseryLinkFront/src/components/signpage/signing.tsx:120`:

```ts
setLoginError(error instanceof ApiError ? error.message : 'Could not reach the server. Please try again.')
```

It appears when `fetch` never receives an HTTP response at all, as opposed to a real
error returned by the API.

The cause is a missing environment variable. `NurseryLinkFront/src/lib/api.ts:2`:

```ts
export function getApiUrl() {
  return import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000'
}
```

Sign-in calls `login()`, which requests `${getApiUrl()}/Login`. `VITE_API_URL` is not
set in the Vercel project, so the deployed bundle fires `http://localhost:3000/Login`
from the visitor's browser. That works locally because you run the backend yourself;
on Vercel it resolves to the visitor's own machine and fails.

Two things made this easy to miss:

- `NurseryLinkFront/.env.example` never documented `VITE_API_URL` — only the Google and
  Apple client IDs and the redirect URI. Now added.
- Six call sites bypassed `getApiUrl()` and hardcoded `http://localhost:3000`, so those
  features would have stayed broken in production even after setting the variable. Now
  routed through `getApiUrl()`.

---

## 2. Fixed: the backend could not reach a hosted database

`backend/src/config/DB.ts` used to read `DATABASE_URL` into an unused variable while the
pool hardcoded `localhost` and the password `123456789`. On Render the server would have
booted but every database query would have failed, so sign-in would still break even
with `VITE_API_URL` set correctly.

The file now reads:

```ts
import "dotenv/config";
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if(!connectionString) {
    throw new Error("DATABASE_URL is not set in the environment");
}

export const pool = new Pool({
    connectionString,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
```

- The pool connects with `DATABASE_URL` and throws on boot if it is missing, the same
  way `env.ts` treats `JWT_SECRET`.
- The connection timeout went from 2s to 10s so a sleeping free-tier database has time
  to wake.
- The credentials are out of source. The old password `123456789` is still in git
  history, so rotate it if any database using it is reachable from anywhere.

The rest of the backend is deploy-ready:

- `backend/src/server.ts:4` honors `PORT`, falling back to `3000`.
- `backend/src/app.ts:20` has `app.use(cors())`, which is permissive enough that no
  CORS changes are needed for the Vercel origin.

---

## 3. Deploy order

Status: Step 1 is done. Steps 2–6 are still open.

### Step 1 — Fix `backend/src/config/DB.ts` (done)

As described in section 2.

### Step 2 — Commit and push

The `DB.ts` fix and the frontend fixes in section 5 are still uncommitted. Render and
Vercel both build from GitHub (`TheQuietBeatle/NurseryLink`), so neither sees them until
they are pushed. Pushing to `main` triggers a Vercel production deploy.

### Step 3 — Provision PostgreSQL

Neon is the easFiest fit: the SQL file can be loaded from the browser. Render's free
Postgres has no SQL editor, so it needs `psql`, which is not installed on this machine.
Supabase works the same way as Neon.

1. Sign up at neon.tech and create a project, in a region close to the Render service.
2. Open **SQL Editor**, paste the whole of `Database/nurserylinkDB.sql`, and click **Run**.
   The file is plain SQL (18 `CREATE TABLE`, 21 `INSERT`), with nothing provider-specific.
3. Check that it loaded. This should return 18:

   ```sql
   SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
   ```
4. Click **Connect** and copy the connection string. Keep the `?sslmode=require` part:

   ```text
   postgresql://<user>:<password>@<host>.neon.tech/neondb?sslmode=require
   ```

Do not commit the connection string. It belongs only in Render's environment variables.

### Step 4 — Deploy the backend to Render

New → Web Service → connect the `TheQuietBeatle/NurseryLink` repo.

| Setting        | Value                                      |
| -------------- | ------------------------------------------ |
| Root Directory | `backend`                                |
| Build Command  | `npm install`                            |
| Start Command  | `npm start` (runs `tsx src/server.ts`) |

Keep dev dependencies installed. `tsx` is in `devDependencies`, so
`npm ci --omit=dev` would break the start command.

### Step 5 — Set environment variables on Render

| Variable           | Source                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| `DATABASE_URL`   | Connection string from Step 3 —`DB.ts` throws on boot if missing            |
| `JWT_SECRET`     | Long random string —`backend/src/config/env.ts:2` throws on boot if missing |
| `RESEND_API_KEY` | From resend.com —`env.ts:6` also throws if missing                          |

### Step 6 — Set `VITE_API_URL` on Vercel and redeploy

Vercel → project → Settings → Environment Variables → add:

```text
VITE_API_URL = https://nurserylink-api.onrender.com
```

That URL is an example. Use the one Render actually assigns to the service.

Apply it to all environments, then **redeploy**. This step is mandatory: Vite inlines
`VITE_*` variables at build time, so adding the variable alone will not change the
already-running bundle.

---

## 4. Environment variable reference

### Vercel (build time — must redeploy to apply)

| Variable                   | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `VITE_API_URL`           | Backend base URL, e.g.`https://nurserylink-api.onrender.com`      |
| `VITE_GOOGLE_CLIENT_ID`  | Google sign-in. Note the correct spelling — see section 5          |
| `VITE_APPLE_CLIENT_ID`   | Apple sign-in; empty if unused                                      |
| `VITE_AUTH_REDIRECT_URI` | OAuth callback, e.g.`https://nursery-link-tau.vercel.app/sign-in` |

### Render (runtime)

| Variable           | Purpose                      |
| ------------------ | ---------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string |
| `JWT_SECRET`     | Token signing secret         |
| `RESEND_API_KEY` | Resend API key for email     |

### Local (`backend/.env`, gitignored)

The same three variables as Render. `DATABASE_URL` points at the local database:

```text
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/nurserylinkDB
```

The line is already in `backend/.env` with the old password `123456789`, but the local
Postgres rejects that password (`password authentication failed for user "postgres"`).
Replace it with the real one or the backend will not run locally.

---

## 5. Fixes applied to the frontend

All verified with `npm run build` exiting `0`.

| File                                                   | Fix                                                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `src/components/admin/ClassesAndStudents.tsx:5`      | `const API = getApiUrl()`                                                                                    |
| `src/components/admin/Administrator.tsx:23,76,108`   | 3 fetches changed to`` `${getApiUrl()}/…` ``                                                                  |
| `src/components/parents/child/temperature.tsx:38,49` | 2 fetches changed to`` `${getApiUrl()}/…` ``; also removed a stray trailing space inside the old URL template |
| `src/main.tsx:8`                                     | `VITE_GOGGLE_CLIENT_ID` → `VITE_GOOGLE_CLIENT_ID`                                                         |
| `.env.example:2`                                     | Added the missing`VITE_API_URL` line                                                                         |

The `VITE_GOGGLE_CLIENT_ID` typo was a separate bug: the env files have always defined
`VITE_GOOGLE_CLIENT_ID`, so `GoogleOAuthProvider` was receiving `undefined` and Google
sign-in was broken regardless of the API URL.

`src/lib/api.ts:2` is intentionally unchanged — the `localhost` fallback is the correct
local-development default.

---

## 6. Gotchas

- **Render free tier sleeps.** After roughly 15 minutes idle the service suspends. The
  first request after a pause is a slow cold start, not an error.
- **Do not set the Vercel root directory to the repo root.** The build command lives in
  `NurseryLinkFront`, and the root `package.json` has no `build` script.
- **Redeploy after every `VITE_*` change.** These are baked into the bundle at build time.
- **`app.use(cors())` is wide open.** Fine for a demo, but lock it down to the Vercel
  origin before any real deployment.

---

## 7. Verification checklist

- [X] `backend/src/config/DB.ts` uses `connectionString`
- [ ] Local `backend/.env` has a working `DATABASE_URL`
- [ ] `DB.ts` and frontend fixes committed and pushed
- [ ] PostgreSQL provisioned and `nurserylinkDB.sql` loaded (table count is 18)
- [ ] Backend deployed to Render, root directory `backend`
- [ ] `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY` set on Render
- [ ] `GET https://nurserylink-api.onrender.com/api/child/account/<id>` responds (not a DB error)
- [ ] `VITE_API_URL` set on Vercel for all environments
- [ ] Vercel redeployed
- [ ] Sign-in works on the Vercel URL
- [ ] Google sign-in works
- [ ] Admin panel loads (uses the previously hardcoded URLs)
