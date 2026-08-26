# NurseryLink — System Design

A day-to-day operations app for a nursery/daycare. Teachers log meals, temperature
checks, toilet visits, attendance, and incidents for the children in their class;
parents see that activity for their own children and get notified (in-app + email)
when something needs their attention.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React + TypeScript, Vite, React Router, Tailwind (v4 `@theme` tokens) |
| Backend  | Express (TypeScript, run via `tsx`), single `index.ts` with all routes |
| Database | PostgreSQL (`pg` driver, raw SQL — no ORM) |
| Email    | Resend (`backend/mailer.ts`) |

Frontend talks to the backend over plain `fetch`, base URL from `VITE_API_URL`
(defaults to `http://localhost:3000`). No auth tokens yet — `login` returns the
account row and the frontend stores it as JSON in `localStorage['account']`;
every page reads it back and treats `role` as the source of truth for what to
render (`parent` / `teacher` / `admin`).

## Roles & flows

- **Parent** — signs in, lands on `/parent` (list of their children), drills into
  `/parent/child/child_dashboard` for one child's temperature/incident/meal/supply
  history, and checks `/events` for notifications (unread count badges the bottom
  nav bell).
- **Teacher** — signs in, lands on `/teacher`, sees today's roster for their
  assigned class (one card per child: check-in status, latest temp/meal/toilet),
  and can log a meal, record a temperature, or file an incident directly from a
  card. Filing an incident or logging a high temperature automatically notifies
  every linked parent (in-app notification + email).
- **Admin** — role exists in the `account` table and is checked for in the
  sign-in redirect, but there is **no admin UI or route yet** (see Known Gaps).

## Data model

Postgres, no ORM — this reflects the **live database** (queried directly via
`information_schema`), not `Database/nurserylinkDB.sql`, which has drifted out of
sync with it (see Known Gaps). Treat this section as the source of truth.

```
account ──┬─< parent ──< child_parent >── child >── class
          ├─< teacher >── class
          └─< notifications

child ──< activity_logs        (meal / toilet / temperature / sleep / medication, one table, log_type discriminates)
child ──< attendance_records   (check-in / check-out per day)
child ──< incidient_report ──< incident_to_parent >── parent
teacher ──< supply_request ──< supplyrequest_to_parent >── parent
teacher ──< announcements >── class
```

### Tables

**account** — every user, one row per login. `role` is `parent | teacher | admin`.
| column | type | notes |
|---|---|---|
| id | bigint PK | |
| username, full_name, email | varchar | email is the login identifier |
| password | varchar | **plaintext**, see Known Gaps |
| role | varchar | `parent`, `teacher`, or `admin` |
| is_active | boolean | |
| created_by | bigint | unused today |
| created_at | timestamp | |

**parent** — 1:1 extension of a `parent`-role account.
`id PK, account_id -> account.id, child_count, gender, registered_at`

**teacher** — 1:1 extension of a `teacher`-role account. A teacher has **exactly
one** assigned class today (`class_id`), not the many-to-many `teacher_class`
join table the `.sql` file describes.
`id PK, account_id -> account.id, class_id -> class.class_id, gender, assigned_at`

**class** — `class_id PK, class_name, subjects, created_at, updated_at`.
Note the PK column is `class_id`, not `id`.

**child** — `id PK, parent_id -> parent.id, account_id -> account.id (nullable), class_id -> class.class_id, name, date_of_birth, summary_log, enrolled_at`

**child_parent** — many-to-many join so two parents (e.g. mother + father) can
both see the same child. `(child_id, parent_id)` composite PK.

**activity_logs** — the workhorse table. One row per logged activity;
`log_type` (`meal | toilet | temperature | sleep | medication | note`) decides
which of the type-specific columns are populated:
| column | used by |
|---|---|
| degree_celsius | temperature |
| food_portion, meal_type | meal |
| toilet_type | toilet |
| sleep_duration_minutes | sleep |
| medication_name, dosage | medication |
| comments | any type, optional |

`account_id` is whoever logged it (teacher or parent); `child_id` is who it's
about.

**attendance_records** — `id PK, child_id -> child.id, check_in_time, check_out_time, status (bool), reason, admin_id -> account.id, recorded_at`

**incidient_report** *(sic — typo baked into the schema)* —
`id PK, child_id -> child.id, teacher_id -> teacher.id, description, severity_level (low|medium|high|critical), incident_timestamp, reported_at, resolved_at`

**incident_to_parent** — fan-out + acknowledgment tracking per linked parent.
`id PK, incidient_id -> incidient_report.id, parent_id -> parent.id, notified_at, acknowledged_at`

**supply_request** / **supplyrequest_to_parent** — same fan-out pattern as
incidents, for a teacher requesting supplies (diapers, wipes, etc.) from parents.

**announcements** — `id PK, teacher_id -> teacher.id, class_id -> class.class_id, title, text, published_at, expires_at, is_active`. Not surfaced in the frontend yet.

**notifications** — the in-app inbox. `id PK, account_id -> account.id, notification_type (incident|supply|announcement|attendance|activity|temperature_alert), sent_at, seen_at, handled_at, seen (bool), handled (bool), description, priority (low|normal|high|urgent)`.
Powers the "Events & Notifications" page and the red unread-count badge on the
parent bottom nav.

**priviliedge** / **admin_previlledge** — scaffolding for admin permissions;
both empty, unused by any route today.

## API reference

All routes live in `backend/index.ts`. No auth middleware — every route trusts
whatever `account_id` / `child_id` the client sends.

**Accounts & auth**
- `POST /account` — create account
- `GET /account/role/:role`, `GET /account/id/:id`
- `PUT /account/:id`, `DELETE /account/:id`
- `POST /Login` — email + password, returns `{ id, full_name, email, role }`

**Children**
- `GET /children/account/:account_id` — a parent's children (covers both linked parents)

**Temperature** (`activity_logs`, `log_type='temperature'`)
- `GET /temperature/:child_id`
- `POST /temperature` — also emails + notifies every linked parent when `degree_celsius >= 38.0`

**Meals** (`activity_logs`, `log_type='meal'`)
- `GET /meals/:child_id`
- `POST /meals`

**Toilet** (`activity_logs`, `log_type='toilet'`)
- `GET /toilet/:child_id`
- `POST /toilet`

**Attendance**
- `GET /attendance/:child_id`
- `POST /attendance/checkin`
- `PUT /attendance/:id/checkout`

**Incidents**
- `GET /incidents/:child_id`
- `POST /incidents` — inserts the report, links every parent via `incident_to_parent`, and pushes a notification to each

**Supply requests**
- `GET /supplies/:account_id` (parent's view)

**Teacher / class roster**
- `GET /teacher/account/:account_id` — teacher row + assigned class name
- `GET /class/:class_id/roster` — every child in the class plus today's latest check-in/temp/meal/toilet in one query

**Notifications**
- `GET /notifications/:account_id`
- `PUT /notifications/:id/seen`
- `POST /notifications` — generic create + email
- `POST /notifications/:id/email` — resend the email for an existing notification

**Misc**
- `GET /` — health check
- `POST /test-email`

## Frontend structure

```
src/
  components/
    landing/        marketing page (Hero, TrustBar, CtaPanel, Footer, Header)
    signpage/        sign-in (email/password + OAuth stubs)
    parents/         parent-facing pages
      Header.tsx / Header2.tsx   two header variants (dashboard vs. child page)
      ParentDashboard.tsx
      Events.tsx                 notifications inbox
      settings.tsx
      bottomWidget.tsx            floating mobile nav (home / events / settings)
      child/
        child_dashboard.tsx       per-child temperature/incident/meal/supply history
        temperature.tsx, IncidentHistory.tsx, MealHistory.tsx, SupplyHistory.tsx
    teacher/         teacher-facing pages
      TeacherDashboard.tsx        class roster + entry point for logging
      RosterCard.tsx              one child's card + quick-action icons
      LogMealModal.tsx, RecordTemperatureModal.tsx, IncidentReportModal.tsx
      Header3.tsx
  lib/
    api.ts           every fetch call + shared types, single source of truth for the API contract
```

Routing (`App.tsx`): `/` (landing), `/sign-in`, `/parent`, `/parent/child/child_dashboard`,
`/teacher`, `/settings`, `/events`.

## Design conventions

Colors/spacing come from CSS custom properties in `index.css` under an `@theme`
block (Tailwind v4), so `bg-teal-700`, `text-coral`, `border-rule`, etc. are
generated utility classes, not one-off hex values. Reusable tokens: `--color-paper*`,
`--color-teal-*`, `--color-coral*`, `--color-ink*`, `--color-rule`, `--shadow-card`.

The recurring card pattern (incidents, meals, supplies, roster, notifications) is:
```
rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]
```
with a 1px colored left stripe (`absolute left-0 top-0 bottom-0 w-1 bg-{color}-400`)
indicating severity/status, and a small pill badge (`rounded-full px-2.5 py-0.5 text-xs font-semibold`)
for status labels.

## Known gaps / tech debt

- **`Database/nurserylinkDB.sql` is stale.** It describes a `teacher_class`
  many-to-many table and a `class.id` PK; the live database has neither — a
  teacher has one `class_id` directly, and the PK is `class.class_id`. Treat the
  "Data model" section above as authoritative until the file is regenerated
  from the live schema (`pg_dump --schema-only` or similar).
- **Passwords are stored and compared in plaintext** (`POST /Login` does a raw
  `WHERE password = $2`). Tracked separately in `SECURITY_HARDENING_PLAN.md`.
- **No auth/session layer.** Any client can call any endpoint with any
  `account_id`; nothing checks that the caller *is* that account.
- **No admin UI.** The sign-in flow branches on `role === 'admin'` but there's
  no `/admin`-style route registered yet, so an admin login has nowhere to go.
- **`admin_previlledge`/`priviliedge` tables are unused** — scaffolding for a
  permissions system that was never wired up.
- **`announcements` has no frontend surface** — teachers can't post one, parents
  can't read one, despite the table and its notification type existing.
