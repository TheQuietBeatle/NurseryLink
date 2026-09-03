# NurseryLink — Security Hardening Plan

> Generated from full codebase audit. 18 vulnerabilities found (4 critical).

---

## Current State (Problems)

- **Plaintext passwords** stored and compared in PostgreSQL (`backend/index.ts:84`)
- **No session/token system** — login returns JSON into `localStorage`, never verified server-side
- **All backend routes completely unprotected** — no auth middleware exists
- **Passwords returned in API responses** via `SELECT *` on `account` table (`backend/index.ts:39-42`)
- **Passwords emailed in cleartext** on account update (`backend/index.ts:62-63`)
- **CORS wide open** — `cors()` with no config allows any origin (`backend/index.ts:8`)
- **No rate limiting** — login brute-force possible
- **No input validation** — no email format, password strength, or role checks
- **Role escalation** — `PUT /account/:id` accepts `role` field from anyone (`backend/index.ts:51-54`)
- **Database credentials hardcoded** in `backend/DB.ts:6-10`
- **Resend API key committed** to repo in `backend/.env:1`
- **No security headers** (CSP, X-Frame-Options, HSTS, etc.)
- **XSS in email templates** — user input interpolated raw into HTML

---

## Phase 1 — Critical Fixes (must-do)

### 1. Hash passwords with bcrypt

**Files:** `backend/index.ts` (POST /account, PUT /account/:id, POST /Login)

- Install `bcrypt` (`npm i bcrypt @types/bcrypt`)
- On **account creation** (`POST /account`): hash `password` with `bcrypt.hash(password, 10)` before inserting
- On **account update** (`PUT /account/:id`): hash the new password before updating
- On **login** (`POST /Login`): fetch user by email only, then `bcrypt.compare(password, user.password)`
- **Migrate existing rows**: run a one-time script that hashes all current plaintext passwords in the `account` table
- **Remove the password from the update email** (`backend/index.ts:62-63`) — never send passwords in emails

### 2. JWT authentication middleware

**Files:** `backend/index.ts`, new file `backend/auth.ts`, `NurseryLinkFront/src/lib/api.ts`

- Install `jsonwebtoken` (`npm i jsonwebtoken @types/jsonwebtoken`)
- Create `backend/auth.ts`:
  ```
  export function generateToken(account) — signs { id, role, email } with a secret, 24h expiry
  export function authMiddleware(req, res, next) — verifies Authorization header, attaches req.user
  export function requireRole(...roles) — returns middleware that checks req.user.role
  ```
- On **login** (`POST /Login`): return `{ token, account }` instead of just account
- On **signup** (`POST /account`): return `{ token, account }`
- Frontend stores the **token** (not the full account) in `localStorage`
- Frontend sends `Authorization: Bearer <token>` on every API call (update `api.ts` fetch helpers)
- Apply `authMiddleware` to **all routes** except `/Login`, `/account` (POST), and `/` (health check)
- Add `requireRole('parent')`, `requireRole('teacher')`, `requireRole('admin')` to role-specific routes

### 3. Stop returning passwords in API responses

**Files:** `backend/index.ts`

- `GET /account/role/:role` (line 38): change `SELECT *` to `SELECT id, username, full_name, email, role`
- `GET /account/id/:id` (line 44): change `SELECT *` to `SELECT id, username, full_name, email, role`
- `POST /Login` (line 82): already only returns select fields — verify `password` is never included
- Any other query joining on `account` — ensure password column is never selected

### 4. Lock down account updates

**Files:** `backend/index.ts`

- `PUT /account/:id`: require auth middleware, verify `req.user.id === parseInt(req.params.id)` (users can only update themselves)
- **Remove `role` from the accepted body fields** — never let users set their own role
- Add a separate `PUT /admin/account/:id/role` endpoint (protected with `requireRole('admin')`) for role changes
- Consider splitting into `PUT /account/:id/profile` (name/email) and `PUT /account/:id/password` (password only)

---

## Phase 2 — Important Hardening

### 5. Role-based route authorization

**Files:** `backend/index.ts`

| Route | Required Role | Logic |
|-------|--------------|-------|
| `GET /children/account/:account_id` | parent | Verify `account_id` matches `req.user.id` |
| `GET /temperature/:child_id` | parent/teacher | Verify child belongs to parent, or teacher's class matches child |
| `POST /temperature` | parent | Verify `account_id` in body matches `req.user.id` |
| `GET /incidents/:child_id` | parent/teacher | Verify ownership or class membership |
| `GET /meals/:child_id` | parent/teacher | Verify ownership or class membership |
| `GET /supplies/:account_id` | parent | Verify `account_id` matches `req.user.id` |
| `GET /notifications/:account_id` | any (own only) | Verify `account_id` matches `req.user.id` |
| `GET /account/role/:role` | admin | Only admins can list all accounts |
| `DELETE /account/:id` | admin or self | Admins can delete anyone; users can delete themselves |
| `POST /notifications` | teacher/admin | Only staff can create notifications |

### 6. Restrict CORS

**Files:** `backend/index.ts`

```ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### 7. Rate limiting

**Files:** `backend/index.ts`

- Install `express-rate-limit` (`npm i express-rate-limit`)
- Login: 5 requests per minute per IP
- Account creation: 3 requests per minute per IP
- Email endpoints (`/test-email`, `/notifications/:id/email`): 3 requests per minute per IP
- General API: 100 requests per minute per IP

### 8. Input validation

**Files:** `backend/index.ts` (or new `backend/validators.ts`)

- Install `zod` (`npm i zod`)
- Validate on every POST/PUT:
  - `email`: valid email format
  - `password`: min 8 chars, at least one uppercase, one number
  - `role`: enum `['parent', 'teacher', 'admin']`
  - `degree_celsius`: number between 35.0 and 42.0
  - `severity_level`: enum `['low', 'medium', 'high']`
  - `meal_type`: enum `['Breakfast', 'Lunch', 'Snack']`
  - `status`: enum `['pending', 'approved', 'fulfilled']`
  - Required fields checked

---

## Phase 3 — Nice-to-Have

### 9. Security headers

**Files:** `backend/index.ts`

- Install `helmet` (`npm i helmet`)
- Add `app.use(helmet())` — sets X-Content-Type-Options, X-Frame-Options, HSTS, CSP, etc.

### 10. Move secrets to environment variables

**Files:** `backend/DB.ts`, `backend/.env`, `.gitignore`

- Move DB credentials from `backend/DB.ts` to `process.env.DATABASE_URL`
- Move JWT secret to `process.env.JWT_SECRET`
- Ensure `.env` is in `.gitignore`
- Remove the committed API key from repo history if this is a public repo

### 11. Sanitize email templates

**Files:** `backend/index.ts` (all `sendEmail` calls)

- Escape HTML entities in user-supplied values before interpolation
- Use a template library or a simple `escapeHtml()` helper for `<`, `>`, `&`, `"`, `'`

---

## Implementation Order

```
1. bcrypt password hashing + migration script
2. JWT auth middleware (backend)
3. Frontend: store token, send Authorization header
4. Remove passwords from SELECT * queries
5. Lock down PUT /account/:id (own-account only, no role field)
6. Role-based route guards
7. CORS restriction
8. Rate limiting
9. Input validation (zod)
10. Helmet security headers
11. Environment variable cleanup
12. Email template sanitization
```

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `bcrypt` + `@types/bcrypt` | Password hashing |
| `jsonwebtoken` + `@types/jsonwebtoken` | JWT token generation/verification |
| `express-rate-limit` | Rate limiting middleware |
| `zod` | Input validation schemas |
| `helmet` | Security headers |

---

## Migration Note

After implementing bcrypt, existing plaintext passwords in the `account` table must be hashed. Run a one-time migration:

```ts
// migrate_passwords.ts
const accounts = await pool.query('SELECT id, password FROM account');
for (const row of accounts.rows) {
  const hashed = await bcrypt.hash(row.password, 10);
  await pool.query('UPDATE account SET password = $1 WHERE id = $2', [hashed, row.id]);
}
```

**After migration, login must switch from SQL-level password comparison to bcrypt.compare().**

---

## 20-Point Audit Fix Checklist

> Added from the latest security audit. This section corrects stale items above where needed: the current Git scan found real `.env` files locally, but did not find real `.env` files tracked; the tracked secret issue found in code is the hardcoded database password in `backend/DB.ts:7`.

### 1. Committed `.env`

**Status:** Partial issue. Real env files exist locally at `backend/.env:1` and `NurseryLinkFront/.env.local:1`, but Git currently ignores them and the history scan found only `.env.example` files.

**Fix:** keep `.env` and `.env.local` ignored, keep examples placeholder-only, move the hardcoded database password from `backend/DB.ts:7` into env vars, and rotate any key or password that may ever have been exposed.

### 2. Real API keys in frontend code

**Status:** Not found. Frontend uses public Vite config such as `VITE_API_URL` in `NurseryLinkFront/src/lib/api.ts:2` and OAuth client ID config in `NurseryLinkFront/src/components/signpage/signing.tsx:15`.

**Fix:** keep only public browser-safe values in `VITE_*`. Keep `RESEND_API_KEY`, DB credentials, JWT secrets, service-role keys, and webhook secrets only in backend environment variables.

### 3. Row level security / database authorization

**Status:** Issue if this database is exposed through Supabase/client access. No RLS policies were found in `Database/nurserylinkDB.sql`, and the app uses direct Postgres through `backend/DB.ts:1`.

**Fix:** if using Supabase client access, enable RLS and add scoped policies for every table. If access is only through Express, enforce ownership and role checks in backend middleware and SQL joins before every read/write.

### 4. Frontend-only permission checks

**Status:** Present. Role gates depend on editable `localStorage` account data in `NurseryLinkFront/src/components/teacher/TeacherDashboard.tsx:15`, `TeacherDashboard.tsx:69`, and `NurseryLinkFront/src/components/parents/ParentDashboard.tsx:40`.

**Fix:** add server-side sessions plus `authMiddleware` and `requireRole(...)`. Keep frontend route guards only for UX.

### 5. No rate limiting

**Status:** Present. `backend/index.ts:8-9` only installs CORS and JSON parsing. `POST /Login` starts at `backend/index.ts:82` with no throttle.

**Fix:** install `express-rate-limit`; apply strict limits to `/Login`, `/account`, `/test-email`, `/notifications/:id/email`, and other write or expensive endpoints.

### 6. SQL string concatenation

**Status:** Not found in main API request paths. Request-driven queries use `$1`, `$2`, etc., for example `backend/index.ts:84-85`.

**Fix:** keep all user input parameterized. Avoid interpolation in scripts too, especially generated SQL in `backend/seed_george.ts`.

### 7. No server-side input validation

**Status:** Present. Routes destructure and trust `req.body`, for example `backend/index.ts:16`, `backend/index.ts:142`, and `backend/index.ts:334`.

**Fix:** install `zod`; validate body and params for every route before DB calls. Validate emails, IDs, roles, temperature ranges, severity levels, meal types, quantity/status fields, string lengths, and required fields.

### 8. Raw HTML rendering / injection

**Status:** No React `dangerouslySetInnerHTML` was found. Email HTML does interpolate user-controlled content in `backend/index.ts:170-173`, `backend/index.ts:569-573`, and `backend/mailer.ts:15`.

**Fix:** HTML-escape all dynamic values before inserting into email templates. Treat `comments`, `description`, `full_name`, `childName`, and similar values as untrusted.

### 9. Plaintext passwords

**Status:** Present. Passwords are inserted directly in `backend/index.ts:17-18`, updated directly in `backend/index.ts:52-54`, compared directly in SQL at `backend/index.ts:84-85`, and stored in `Database/nurserylinkDB.sql:34`.

**Fix:** replace plaintext storage with `argon2` or `bcrypt`, store only password hashes, fetch by email on login, verify with the hash library, migrate existing rows, and remove passwords from emails/API responses.

### 10. Auth state in `localStorage`

**Status:** Related issue present. No token was found, but the account object is stored in `localStorage` and treated as auth at `NurseryLinkFront/src/components/signpage/signing.tsx:97`.

**Fix:** use httpOnly, `Secure`, `SameSite=Lax` or `Strict` cookies for web sessions. Do not authorize backend requests from account IDs supplied by the frontend.

### 11. Admin/internal routes without auth

**Status:** Present. All backend routes are unauthenticated, including account listing at `backend/index.ts:38`, update at `backend/index.ts:51`, and delete at `backend/index.ts:74`.

**Fix:** protect every route except health check and login/signup. Restrict account listing, role changes, deletes, and notification creation to admin/staff roles.

### 12. CORS wildcard/permissive config

**Status:** Present. `app.use(cors())` at `backend/index.ts:8` is permissive.

**Fix:**

```ts
app.use(cors({
  origin: [process.env.FRONTEND_URL ?? 'http://localhost:5173'],
  credentials: true,
}));
```

Do not use `*` with credentialed requests.

### 13. No email verification

**Status:** Present. `POST /account` creates usable accounts immediately at `backend/index.ts:15-21`.

**Fix:** add an email verification token flow, store token hashes server-side, send a one-time verification link, and block access to real data until email verification succeeds.

### 14. Predictable IDs without ownership checks

**Status:** Present. Routes use raw IDs without proving ownership, for example `GET /temperature/:child_id` at `backend/index.ts:130`, `GET /incidents/:child_id` at `backend/index.ts:194`, and `PUT /notifications/:id/seen` at `backend/index.ts:532`.

**Fix:** derive requester identity from server auth. For parent access, join through `parent`/`child_parent` and require `parent.account_id = req.user.id`. For teacher access, require assigned class membership. For notifications, require `notifications.account_id = req.user.id`.

### 15. Unsafe account update body

**Status:** Present. `PUT /account/:id` accepts `username`, `full_name`, `email`, `password`, and `role` from the body at `backend/index.ts:52-54`.

**Fix:** split profile update, password change, and admin role change into separate endpoints. Allowlist editable fields, put role changes behind `requireRole('admin')`, and reject unexpected fields.

### 16. Webhooks without signature check

**Status:** Not applicable right now. No webhook endpoint was found.

**Fix:** when webhooks are added, use raw body parsing for that route, verify provider signatures before trusting the payload, and store webhook secrets only in backend env vars.

### 17. Stack traces in production

**Status:** Mostly OK. API responses are generic, for example `backend/index.ts:24`, while server logs print `err.message` in catch blocks.

**Fix:** keep client responses generic, add centralized error middleware, and in production log structured errors server-side without returning stacks, secrets, or raw request bodies to clients.

### 18. Dependency vulnerabilities / update process

**Status:** Backend `npm audit --omit=dev` reported one moderate vulnerability in `qs`. Frontend production audit reported zero vulnerabilities. Backend lockfile includes `qs` at `backend/package-lock.json:1785`.

**Fix:** run `npm audit fix` in `backend`, then run backend build/tests. Enable Dependabot or a scheduled monthly dependency update process and keep lockfiles committed.

### 19. No password strength or breach check

**Status:** Present. Signup and password update accept passwords without server-side policy at `backend/index.ts:16`; frontend password update calls `updateAccount(..., { password })` from `NurseryLinkFront/src/components/parents/settings.tsx:121`.

**Fix:** enforce password policy server-side, preferably 12+ characters, and reject common/breached passwords with Have I Been Pwned k-anonymity API or an auth-provider feature. Apply it to signup, password change, admin-created password flows, and reset.

### 20. File uploads without validation

**Status:** Not applicable right now. No upload endpoint or file input was found.

**Fix:** when uploads are added, validate MIME type, extension, and size server-side; store files in object storage or outside the web root; generate random object names; never execute uploaded files; and serve downloads with safe `Content-Type` and `Content-Disposition` headers.
