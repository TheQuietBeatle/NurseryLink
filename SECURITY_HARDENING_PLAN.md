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
