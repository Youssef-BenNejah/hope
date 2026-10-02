# Hope — Master Reference (Tickets + Data Model + API)

> This is the single, self-contained reference for the Hope / Cabinet rebuild: every ticket from `hope-tickets.json`, fused inline with the exact data-model fields and API endpoints it touches, so each ticket carries everything needed to implement it without opening a second document. The two source references are also kept in full as appendices (Part B and Part C) for browsing independent of any one ticket.
>
> Generated from `hope-tickets.json`, `docs/DATA-MODEL.md` and `docs/API-ENDPOINTS.md`. Where a ticket touches a domain excluded from those two documents (vaccinations, documents, payments, analyses/lab results), it is called out explicitly under **Reference notes** rather than silently left blank — search this file for "⚠️ OUT OF SCOPE" to find every such ticket.
>
> **Role model (3 roles, asymmetric creation):** `admin` (a separate login, not a `Doctor` row) creates *either* `medecin` or `secretaire` accounts via `/admin`. `medecin` creates *only* `secretaire` accounts, via `/personnel` — there is no UI path for a doctor to create another doctor. `secretaire` creates nobody and is refused `/personnel` outright. ⚠️ Confirmed prototype gap: `/admin` has no role guard of its own — a logged-in `medecin` who navigates there directly reaches the full admin account screen today. See `DATA-MODEL.md` §3.1 and §7 points 8–9, and the tickets tagged `admin,accounts` / `staff,hr` / `auth,security` below (especially `HOPE-AUTH-06`, `HOPE-USR-01`, `HOPE-USR-02`, `HOPE-PERS-01`, `HOPE-PERS-02`) for the full detail.

**Contents:** 108 tickets across 11 sprints/milestones · 21 data-model entities · 88 API endpoints.

## Table of contents

- [Part A — Ticket catalog](#part-a--ticket-catalog)
  - [Foundations (`s0`)](#foundations-s0)
  - [Authentication & accounts (`s1`)](#authentication-accounts-s1)
  - [Patients, appointments (API), audit, email (`s2`)](#patients-appointments-api-audit-email-s2)
  - [Calendar, waiting room, real time, dashboard (`s3`)](#calendar-waiting-room-real-time-dashboard-s3)
  - [Patient record & interview grid (`s4`)](#patient-record-interview-grid-s4)
  - [Consultation, PDF, prescriptions (`s5`)](#consultation-pdf-prescriptions-s5)
  - [Certificates, referrals, directory, lab results (`s6`)](#certificates-referrals-directory-lab-results-s6)
  - [Settings, reminders, audit log, staff, statistics, search (`s7`)](#settings-reminders-audit-log-staff-statistics-search-s7)
  - [Security, tests, acceptance, go-live (`s8`)](#security-tests-acceptance-go-live-s8)
  - [Post-v1 quick wins (v1.1) (`v1.1`)](#post-v1-quick-wins-v1-1--v1.1)
  - [Future scope (v2) (`v2`)](#future-scope-v2--v2)
- [Part B — Full Data Model Reference (appendix)](#part-b--full-data-model-reference-appendix)
- [Part C — Full API Endpoints Reference (appendix)](#part-c--full-api-endpoints-reference-appendix)

---

## Part A — Ticket catalog

### Foundations (`s0`)

<a id="foundations-s0"></a>

### HOPE-FND-01 — Decide repository layout (monorepo vs separate API repo) and backend stack (D1)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 1 | 4 | todo | foundation, docs, s0 |

Settle D1 (Spring Boot vs NestJS) and the layout: the repo syncs with Lovable, and moving src/ to apps/web breaks editing in Lovable.

- **Folder:** `docs/`
- **Prototype reference:** —
- **Depends on:** —

**Subtasks**

1. Compare Spring Boot vs NestJS against team skills and Lovable sync constraint
2. Decide monorepo vs separate hope-api repository
3. Settle D2 (multi-doctor), D4 (multi-practice), D7 (secretary access)
4. Write docs/adr/0001-stack.md

**Acceptance criteria**

- Decision recorded in docs/adr/0001-stack.md
- Decisions D2, D4 and D7 settled and recorded

**Rejection criteria**

- Moving src/ to apps/web without checking the impact on Lovable editing

**Test scenarios**

- A new developer can tell from the ADR where front and back code live and why

*Hope V1 · Sprint 0 — Foundations · P0 · 1 pts. French version: FND-01 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Architecture/repo-layout decision — no direct data-model or API mapping; see the SQL schema in the Data Model appendix (§8) for the shape this decision ultimately governs.


---

### HOPE-FND-02 — Bootstrap the API project (Spring Boot 3 / Java 21) with modules, profiles and OpenAPI

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 1 | 12 | todo | foundation, backend, spring, s0 |

Skeleton: Web, Security, Data JPA, Validation, Actuator, springdoc; RFC 7807 error format; one package per domain (see design doc §3).

- **Folder:** `hope-api/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-01`

**Subtasks**

1. Generate Spring Boot 3 / Java 21 project with Web, Security, Data JPA, Validation, Actuator
2. Add springdoc-openapi and RFC 7807 error handler
3. Create one package per domain (auth, patients, agenda…) and dev/staging/prod profiles

**Acceptance criteria**

- GET /actuator/health returns 200
- Swagger UI available in dev
- Validation errors returned as problem+json

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Business logic added before the skeleton is reviewed

**Test scenarios**

- Start the app locally — /actuator/health is UP and /swagger-ui loads
- Post an invalid body — response is application/problem+json

*Hope V1 · Sprint 0 — Foundations · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: FND-02 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Backend skeleton bootstrap — no specific entity/endpoint yet. Every entity and endpoint in this file's appendices will eventually live inside this Spring Boot project.


---

### HOPE-FND-03 — PostgreSQL + Flyway: initial schema (cabinet, app_user, common columns, unaccent/pg_trgm extensions)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 2 | 12 | todo | foundation, backend, spring, s0 |

Create the PostgreSQL schema baseline with Flyway: cabinet and app_user tables, the common columns every business table carries, and the unaccent / pg_trgm extensions needed for patient search and duplicate detection.

- **Folder:** `hope-api/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-02`

**Subtasks**

1. V1 migration: cabinet, app_user
2. Base entity with id/cabinet_id/created_*/updated_*/version
3. Enable unaccent and pg_trgm extensions

**Acceptance criteria**

- V1 migration applied automatically on startup
- Common columns id/cabinet_id/created_*/updated_*/version
- unaccent and pg_trgm extensions enabled

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Schema changes made outside Flyway migrations

**Test scenarios**

- Fresh database: app starts and applies V1 automatically
- Restart: no migration re-applied

*Hope V1 · Sprint 0 — Foundations · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: FND-03 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Foundational schema (cabinet, app_user, common columns). See Data Model appendix §8 for the full suggested SQL schema this migration should start from, and the 'common columns' pattern (id/cabinet_id/created_*/updated_*/version) referenced across every table. §8 also specifies app_user as a base identity table with role ENUM(medecin,secretaire,admin), extended by two SEPARATE 1:1 profile tables (doctor_profile, staff_profile) rather than one wide row per staff member — get that split into this initial migration rather than retrofitting it later.


---

### HOPE-FND-04 — Multi-tenancy: automatic cabinet_id filter on every query

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 4 | 12 | todo | foundation, backend, spring, s0 |

Hibernate filter or PostgreSQL RLS, driven by the authenticated user's practice.

- **Folder:** `hope-api/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-03`

**Subtasks**

1. Resolve cabinet_id from the authenticated user
2. Apply Hibernate filter or PostgreSQL RLS
3. Integration test per repository proving isolation

**Acceptance criteria**

- Test: a user of practice A can neither read nor write any data of practice B
- The filter cannot be bypassed (integration test on every repository)

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Per-query manual cabinet_id filtering that can be forgotten

**Test scenarios**

- User of practice A requests a patient of practice B — 404/403, no data returned

*Hope V1 · Sprint 0 — Foundations · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: FND-04 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Multi-tenancy filter. See Data Model appendix §7 point 3 ('No tenant isolation column') and §8 (every table gets a cabinet_id FK) — this ticket is what actually builds that filter.


---

### HOPE-FND-05 — Development Docker Compose (postgres, minio, mailpit, api, web)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 5 | 8 | todo | foundation, infra, s0 |

One command starts the full local environment: PostgreSQL, MinIO (file storage), Mailpit (email catcher), the API and the web front end.

- **Folder:** `infra/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-02`

**Subtasks**

1. docker-compose.yml with postgres, minio, mailpit, api, web
2. Seed volumes and .env.example
3. README getting-started section

**Acceptance criteria**

- `docker compose up` starts the whole environment
- Getting-started README updated

**Rejection criteria**

- Secrets committed to the repository

**Test scenarios**

- Clean clone: docker compose up — web on localhost, API healthy, Mailpit UI reachable

*Hope V1 · Sprint 0 — Foundations · P0 · 2 pts. French version: FND-05 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Local dev infrastructure only — no entity/endpoint mapping.


---

### HOPE-FND-06 — GitHub Actions CI (front: lint, typecheck, build; back: build, tests)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 6 | 12 | todo | foundation, infra, s0 |

GitHub Actions pipeline that blocks pull requests on lint, type or build errors for the front end, and on build or test failures for the API.

- **Folder:** `infra/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-02`

**Subtasks**

1. Front job: npm ci, lint, typecheck, build
2. API job: build + tests
3. Path filters and dependency cache
4. README status badge

**Acceptance criteria**

- CI required on pull requests
- Dependency caching
- Status badge in the README

**Rejection criteria**

- Secrets committed to the repository
- CI green while type errors exist

**Test scenarios**

- Introduce an intentional lint error — pipeline fails
- Break a unit test in the API — pipeline fails

*Hope V1 · Sprint 0 — Foundations · P0 · 3 pts. French version: FND-06 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> CI pipeline only — no entity/endpoint mapping.


---

### HOPE-FND-07 — Front-end API client: typed fetch, types generated from OpenAPI, 401/refresh handling, global errors

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 8 | 12 | todo | foundation, frontend, react, s0 |

Create src/api/client.ts plus an `npm run gen:api` script (openapi-typescript). TanStack Query at the root (already wired in __root.tsx).

- **Folder:** `src/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-02`

**Subtasks**

1. src/api/client.ts with base URL, auth header, normalized errors
2. npm run gen:api with openapi-typescript
3. 401 → silent refresh → replay
4. Global 'connection lost' banner

**Acceptance criteria**

- A 401 triggers a silent refresh, then replays the request
- Network errors show a toast and a 'connection lost' banner
- Generated types committed or generated in CI

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer
- Hooks calling the API without going through the client layer

**Test scenarios**

- Expire the access token — next request refreshes and succeeds
- Stop the API — banner appears, disappears on recovery

*Hope V1 · Sprint 0 — Foundations · P0 · 3 pts. French version: FND-07 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### Reference notes

> The 401→refresh→replay logic this ticket builds is exactly what POST /api/auth/refresh (below) exists to serve.


---

### HOPE-FND-08 — Demo data script (SQL) built from seed.ts

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 9 | 8 | todo | foundation, backend, spring, s0 |

SQL demo dataset reproducing the prototype's seed (10 patients, appointments, prescriptions, contacts, staff accounts) so staging and demos look like the Lovable app.

- **Folder:** `hope-api/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-03`

**Subtasks**

1. Translate seed.ts data to SQL inserts
2. Load only with the demo profile

**Acceptance criteria**

- The `demo` profile loads 10 patients, appointments, prescriptions and contacts, like the prototype
- Disabled in production

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Demo data loaded in production

**Test scenarios**

- Start with demo profile — patients list shows the 10 demo patients
- Start with prod profile — database stays empty

*Hope V1 · Sprint 0 — Foundations · P1 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: FND-08 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Note`** _(table)_ — Clinical note / consultation record — the most overloaded table  
📄 Source: `types.ts:76`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Free-text body |
| `attachments` | `NoteAttachment[]` | optional | Embedded 1:N, see §3.9 |
| `motif` | `string` | optional | Structured consultation: chief complaint |
| `exam` | `string` | optional | Structured consultation: physical exam |
| `diagnosis` | `string` | optional | Structured consultation: diagnosis |
| `plan` | `string` | optional | Structured consultation: plan |
| `icd` | `IcdCode[]` | optional | Embedded snapshot of picked ICD-10 codes (see §5.1) — copied by value, not by reference |
| `authorId` | `string` | optional | FK-like → Doctor.id |

> It stores **both free-text notes and structured consultation data** in the same row.

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Certificate`** _(table)_ — Issued certificate (sick leave, sport fitness, etc.)  
📄 Source: `types.ts:146`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `type` | `string` | ✅ | One of BUILTIN_CERTIFICATE_TYPES (§5.4) or a custom CertificateTemplate.type |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from startDate + days |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/certificats.tsx` (monthly register, print/duplicate).

**`Referral`** _(table)_ — Letter to a specialist  
📄 Source: `types.ts:159`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → Contact.id (recipient) |
| `reason` | `string` | ✅ |  |
| `documentDate` | `string` | ✅ |  |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/orientations.tsx`.

**`Contact`** _(table)_ — Address book entry — colleague, lab, supplier  
📄 Source: `types.ts:197`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `string` | ✅ | One of CONTACT_KINDS (§5.5) or free text |
| `specialty` | `string` | optional |  |
| `phone` | `string` | optional |  |
| `email` | `string` | optional |  |
| `address` | `string` | optional |  |
| `notes` | `string` | optional |  |

Used in: `routes/annuaire.tsx`, referenced by Referral.contactId.

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

**`AuditEntry`** _(table)_ — Activity log — append-only by convention, not by enforcement  
📄 Source: `types.ts:226`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `at` | `string (ISO)` | ✅ |  |
| `actor` | `string` | ✅ | **Name snapshot**, not an FK — resolved once at write time from the current user (`store.tsx:151-152`) |
| `summary` | `string` | ✅ | Human-readable description of the action |

> Written centrally by the `update()` function in `store.tsx:146-159`, whenever a caller passes an `audit` message. **Capped at 400 entries** (`.slice(0, 400)`) — oldest entries silently dropped. This cap and the lack of structured action/entity/entityId/diff fields is exactly what the tickets file flags as needing a real append-only, ungapped audit table server-side.

**`Checkup`** _(unused)_ — Manual clinical follow-up point — typed, seeded, not wired to any screen  
📄 Source: `types.ts:117`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `state` | `"mieux"\|"stable"\|"moins_bien"` | ✅ | Doctor's subjective assessment |
| `weight` | `number (kg)` | optional |  |
| `systolic` | `number (mmHg)` | optional |  |
| `diastolic` | `number (mmHg)` | optional |  |
| `heartRate` | `number (bpm)` | optional |  |
| `temperature` | `number (°C)` | optional |  |
| `pain` | `number (0–10)` | optional |  |
| `comment` | `string` | optional |  |

> `stateMeta` (`tracking.ts:3`) maps each state to a label, CSS class, color dot, and a numeric score (100/65/25). Per repo scan, this table is currently **not surfaced in any route** — defined in the type system and seeded, but no UI reads/writes it yet (flagged in the tickets file as "Not in UI").

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Seed data must cover every in-scope entity below so staging/demo matches the prototype's seed.ts.


---

### HOPE-FND-10 — Rename the app to 'Hope' (title, login screen, sidebar, favicon, emails, PDFs)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 10 | 4 | todo | foundation, frontend, react, s0 |

The prototype shows 'Cabinet' as the product name (LockScreen, Sidebar, route <title> tags).

- **Folder:** `src/`
- **Prototype reference:** —
- **Depends on:** —

**Subtasks**

1. Add a single APP_NAME constant
2. Update LockScreen, Sidebar, route <title> meta, favicon
3. Update email and PDF templates

**Acceptance criteria**

- No remaining use of 'Cabinet' as the product name in the UI
- Product name defined in a single constant

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Search the UI for 'Cabinet' as product name — none left

*Hope V1 · Sprint 0 — Foundations · P1 · 1 pts. French version: FND-10 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.


#### Reference notes

> 'Hope' branding likely lands in Settings.doctorName-adjacent config or a dedicated APP_NAME constant — see the Settings entity below.


---

### Authentication & accounts (`s1`)

<a id="authentication-accounts-s1"></a>

### HOPE-FND-09 — Staging environment deployed (private URL, HTTPS)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 11 | 12 | todo | foundation, infra, s1 |

Staging server where the doctor and the team can test every merged change over HTTPS on a private URL.

- **Folder:** `infra/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-05`, `HOPE-FND-06`

**Subtasks**

1. Provision VPS or container host
2. Reverse proxy + TLS certificate
3. Auto-deploy job on merge to main
4. Secrets in the CI secret store

**Acceptance criteria**

- Automatic deployment on every merge to main
- Valid TLS certificate
- Secrets kept out of the repository

**Rejection criteria**

- Secrets committed to the repository
- Staging reachable without HTTPS
- Deploying a commit other than the one CI verified

**Test scenarios**

- Merge a change — staging updates and /health returns 200

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 3 pts. French version: FND-09 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Deployment infra only — no entity/endpoint mapping.


---

### HOPE-AUTH-01 — Login API: login, refresh (rotation), logout, /me

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 11 | 20 | todo | auth, security, backend, spring, s1 |

15-minute access JWT; opaque refresh token hashed in the database, HttpOnly Secure SameSite=Strict cookie.

- **Folder:** `hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-FND-03`

**Subtasks**

1. Login endpoint issuing access JWT + refresh cookie
2. Refresh with rotation and reuse detection
3. Logout revoking the token family
4. GET /me

**Acceptance criteria**

- Valid login returns 200 and sets the refresh cookie
- Wrong credentials return 401 with a generic message
- Reusing a refresh token revokes the whole token family
- Logout revokes the refresh token

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Valid login → 200 + cookie
- Wrong password → 401 generic message
- Replay an old refresh token → whole family revoked

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé



---

### HOPE-AUTH-02 — Argon2id password hashing; no password ever returned or displayed

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 13 | 8 | todo | auth, security, backend, frontend, bugfix, s1 |

Fixes B2: the prototype stores passwords in plain text and shows them in toasts.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`

**Subtasks**

1. Argon2id encoder
2. Strip password from every response DTO
3. Remove 'password is X' toasts in admin.tsx and personnel.tsx

**Acceptance criteria**

- No password field in any response DTO
- 'Password is X' toasts removed from the front end
- Test: the stored hash never equals the password

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Any password visible in UI, logs or API responses

**Test scenarios**

- Create an account — response has no password field
- Inspect DB — only a hash is stored

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 2 pts. Fixes prototype issue(s) B2 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.



---

### HOPE-AUTH-03 — Login screen wired to the API; session survives a page reload

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 13 | 12 | todo | auth, security, frontend, react, bugfix, s1 |

Fixes B1. Reuse LockScreen.tsx. On load, call /auth/refresh silently.

- **Folder:** `src/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`, `HOPE-FND-07`

**Subtasks**

1. Wire LockScreen form to /auth/login
2. Silent /auth/refresh on app load
3. Redirect back to the requested deep link

**Acceptance criteria**

- Reloading any page keeps the user signed in
- Deep link (/patients?p=…) after login redirects to the requested page
- Show/hide password toggle kept

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer
- Session kept only in React state (lost on reload)

**Test scenarios**

- Log in, press F5 — still signed in
- Open /patients?p=… signed out → log in → lands on that record

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 3 pts. Fixes prototype issue(s) B1 (specification §7). French version: AUTH-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé



---

### HOPE-AUTH-04 — Automatic lock after inactivity + unlock with password

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 14 | 12 | todo | auth, security, backend, frontend, s1 |

Delay set per user (1, 5, 15 min, never). Unlock via POST /auth/unlock without losing the current screen.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-03`

**Subtasks**

1. Inactivity timer from user preference
2. Lock overlay hiding all data
3. POST /auth/unlock with password

**Acceptance criteria**

- After the delay the screen is hidden (no data visible)
- Unlocking restores the page and unsaved drafts
- Sidebar 'Lock' button works

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Locked screen still showing patient data behind a blur

**Test scenarios**

- Set delay to 1 min, wait — screen locks
- Unlock — same page and unsaved draft restored

*Hope V1 · Sprint 1 — Authentication & accounts · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé



---

### HOPE-AUTH-05 — Password policy, forced change on first login, change from Settings

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 15 | 12 | todo | auth, security, backend, frontend, s1 |

Enforce a password policy, force new accounts to choose their own password at first login, and let users change their password from Settings.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`

**Subtasks**

1. Shared zod + server validation rules
2. must_change_password gate screen
3. Change-password form requiring the current password

**Acceptance criteria**

- At least 10 characters with upper case, lower case and a digit (validated front and back)
- must_change_password shows a dedicated screen before any access
- Changing requires the current password

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- First login with activation password → forced to change
- Weak password → rejected with clear message

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé



---

### HOPE-AUTH-06 — Role-based access control in the API + route guards in the front end

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 16 | 20 | todo | auth, security, backend, frontend, bugfix, s1 |

Fixes B4. Access matrix: specification §3.2. The secretary never receives clinical data (dedicated DTO).

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`

**Subtasks**

1. Access matrix as code (roles × endpoints)
2. @PreAuthorize on every controller
3. Role-specific DTOs (secretary gets administrative patient DTO)
4. Front route guards + role-filtered sidebar

**Acceptance criteria**

- Authorization tests for every endpoint × role
- Secretary: 403 on notes, consultations, lab results, prescriptions, certificates, referrals, staff, settings
- Admin: 403 on all patient data
- Sidebar and routes filtered by role (replaces SECRETAIRE_ALLOWED)

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Client-only role checks without server enforcement

**Test scenarios**

- Secretary calls GET /patients/{id}/notes → 403
- Admin calls GET /patients → 403
- Secretary opens /ordonnances URL → redirected

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 5 pts. Fixes prototype issue(s) B4 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-06 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### Reference notes

> Role model this ticket must enforce: admin creates EITHER medecin or secretaire (role selector, admin.tsx:409-417); medecin creates ONLY secretaire (personnel.tsx hardcodes it, no UI path for a doctor to create another doctor); secretaire creates nobody and is refused /personnel entirely. ⚠️ Confirmed prototype gap this ticket must fix: routes/admin.tsx has NO role guard of its own — isAdmin only toggles the Sidebar link and force-redirects an admin session back to /admin; a logged-in medecin who navigates to /admin directly reaches the full account screen today, including the ability to create/deactivate other doctors. The access matrix (spec §3.2) must restrict every /api/staff* mutation with role:"medecin" in the body to admin only, server-side — not rely on the route.


---

### HOPE-AUTH-07 — Rate limiting and lockout after 5 failed logins

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 17 | 8 | todo | auth, security, backend, spring, s1 |

Protect login against brute force: rate-limit authentication endpoints per IP and lock an account for 15 minutes after 5 failed attempts.

- **Folder:** `hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`

**Subtasks**

1. Failed-login counter and locked_until on app_user
2. Per-IP rate limiter on /auth/*
3. Audit event on lockout

**Acceptance criteria**

- 5 failures lock the account for 15 min and log an audit event
- Per-IP rate limit on /auth/*

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- 6 wrong passwords → account locked, correct password refused until unlock time

*Hope V1 · Sprint 1 — Authentication & accounts · P1 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-07 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé



---

### HOPE-AUTH-08 — Remove demo quick-login and default admin credentials; bootstrap the first admin

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 18 | 8 | todo | auth, security, backend, frontend, bugfix, s1 |

Fixes B2. The prototype shows Doctor/Secretary/Admin quick-login buttons and defaults to admin@cabinet.tn / Admin@2024.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`

**Subtasks**

1. Hide quick-login buttons unless demo profile
2. Remove default admin@cabinet.tn credentials
3. CLI/env bootstrap of the first admin

**Acceptance criteria**

- Quick-login buttons only visible with the demo profile
- First admin created via a CLI command or environment variable at install time

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Default credentials usable in production

**Test scenarios**

- Production build — no quick-login buttons
- Fresh install — admin created from env, can log in

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 2 pts. Fixes prototype issue(s) B2 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-08 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### Reference notes

> The bootstrapped first admin is the top of the creation hierarchy: it's the only account that can create the first medecin (via /admin's role selector), who in turn is the only account type that can create secretaire accounts (via /personnel). Get this bootstrap wrong and there is no path to create any other account at all.


---

### HOPE-USR-01 — Accounts API: CRUD, activate/deactivate, reset by link

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 18 | 20 | todo | admin, accounts, backend, spring, s1 |

Account management API used by the admin (doctors and secretaries) and by the doctor for secretary accounts: create, edit, activate/deactivate, and send a reset link.

- **Folder:** `hope-api/`
- **Prototype reference:** /admin — src/routes/admin.tsx
- **Depends on:** `HOPE-AUTH-06`

**Subtasks**

1. CRUD endpoints with email uniqueness per practice
2. Deactivate instead of delete
3. Activation / reset link via NOT-01

**Acceptance criteria**

- Email unique per practice (constraint + clear message)
- Delete = deactivate (history stays linked)
- Reset = sends a link, never a plain-text password

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Create two accounts with the same email → second refused
- Deactivated user cannot log in

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: USR-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### Reference notes

> This is the API both admin.tsx (all staff, both roles) and personnel.tsx (secretary accounts only) call. Every write endpoint below must key its authorization off BOTH the caller's role AND the target's role: admin acts on any target; medecin acts on secretaire targets only (via /personnel); secretaire acts on nobody. Creation is asymmetric too — admin's request may set role:"medecin" or role:"secretaire"; a medecin's request must be rejected server-side if it sets role:"medecin" (the prototype's /personnel form never even offers that choice).


---

### HOPE-SEC-04 — INPDP compliance file (Tunisian law 2004-63) and hosting choice (D8)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 20 | 12 | todo | security, compliance, docs, s1 |

Write the record of processing activities and the authorization request; review with a lawyer. Start early: administrative delays are long.

- **Folder:** `docs/`
- **Prototype reference:** —
- **Depends on:** —

**Subtasks**

1. Record of processing activities
2. INPDP authorization request
3. Legal review
4. Hosting decision (D8)

**Acceptance criteria**

- Record of processing activities written
- Request filed before go-live

**Rejection criteria**

- Going live with real patient data before the request is filed

**Test scenarios**

- Filed request reference recorded in docs before go-live

*Hope V1 · Sprint 1 — Authentication & accounts · P0 · 3 pts. French version: SEC-04 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Legal/compliance document — no direct entity/endpoint mapping. See Data Model appendix §7 for the security posture this filing must describe.


---

### Patients, appointments (API), audit, email (`s2`)

<a id="patients-appointments-api-audit-email-s2"></a>

### HOPE-AUTH-09 — Forgot password: reset link by email

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 31 | 12 | todo | auth, security, backend, frontend, s2 |

Users who forget their password request a reset link by email and set a new password; the response never reveals whether an email exists.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`, `HOPE-NOT-01`

**Subtasks**

1. POST /auth/password/forgot + token table
2. Reset email template
3. Reset page in the front end

**Acceptance criteria**

- Single-use link valid for 30 min
- Same response whether or not the email exists
- Audit event

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Reset link reusable or valid longer than 30 minutes

**Test scenarios**

- Request reset → email in Mailpit → set new password → old link rejected

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-09 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé



---

### HOPE-USR-02 — Administration screen wired: account list, form, actions

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 21 | 12 | todo | admin, accounts, frontend, react, s2 |

Reuse admin.tsx. Replace the password field with 'send activation link'.

- **Folder:** `src/`
- **Prototype reference:** /admin — src/routes/admin.tsx
- **Depends on:** `HOPE-USR-01`

**Subtasks**

1. Wire account list and form to USR-01
2. Replace password field by 'send activation link'
3. Show last reset date only

**Acceptance criteria**

- Creating an account sends an activation email
- The password column only shows the last reset date
- Every action is audited (missing in the prototype)

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Admin creates a doctor — activation email arrives
- Deactivate — status badge updates

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 3 pts. French version: USR-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### Reference notes

> /admin's list is unfiltered (both medecin and secretaire rows) and its create/edit form includes a Rôle selector (admin.tsx:409-417) — this is the ONE screen in the whole app where a secretary account can be created by someone other than a doctor. ⚠️ Wiring this screen for real must also add the role guard it's currently missing (see HOPE-AUTH-06): today any logged-in medecin can open /admin directly and use this exact screen to create/deactivate other doctors.


---

### HOPE-PAT-01 — Patients API: paginated list, accent-insensitive search, sorting, recent tab

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 22 | 20 | todo | patients, backend, spring, s2 |

Search by name (trigram + unaccent), phone, patient ID. Sort by name, age, last visit.

- **Folder:** `hope-api/`
- **Prototype reference:** /patients — src/routes/patients.tsx
- **Depends on:** `HOPE-FND-04`, `HOPE-AUTH-06`

**Subtasks**

1. Search query with unaccent + trigram
2. Sort by name/age/last visit
3. Recent tab query
4. Administrative vs clinical DTO by role

**Acceptance criteria**

- Response < 300 ms on 50,000 patients (test dataset)
- 'Recent' = the 10 patients with the latest activity
- The secretary receives the administrative DTO

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Search 'hedi' finds 'Hédi'
- 50,000-patient fixture — p95 < 300 ms

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PAT-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-PAT-02 — Create-patient API + server-side generation of the AB-123456 patient ID

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 24 | 12 | todo | patients, backend, spring, s2 |

Port makePatientCode() to the server, with a per-practice unique constraint and retry on collision.

- **Folder:** `hope-api/`
- **Prototype reference:** /patients — src/routes/patients.tsx
- **Depends on:** `HOPE-PAT-01`

**Subtasks**

1. Port makePatientCode() with unique constraint + retry
2. Validation rules (Tunisian phone, CNAM number, birth date)

**Acceptance criteria**

- ID uniqueness guaranteed under concurrency (parallel test)
- Validation: name required, Tunisian phone format, birth date not in the future, CNAM number if CNAM coverage

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Create 100 patients in parallel — all codes unique
- Future birth date → 400

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PAT-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-PAT-03 — Duplicate detection (similar name, same phone, same birth date)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 24 | 12 | todo | patients, backend, spring, s2 |

POST /patients/duplicates-check, used by the full creation form AND by quick creation from an appointment.

- **Folder:** `hope-api/`
- **Prototype reference:** /patients — src/routes/patients.tsx
- **Depends on:** `HOPE-PAT-02`

**Subtasks**

1. POST /patients/duplicates-check
2. Similarity on name, same phone, same birth date

**Acceptance criteria**

- Levenshtein ≤ 2 or trigram similarity ≥ 0.6
- 'View existing record' / 'Create anyway' choice kept
- Quick creation (appointment modal) also protected

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Create 'Salma Trabelsi' when 'Salma Trablsi' exists → duplicate warning

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PAT-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-PAT-04 — Edit a patient's identity

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 25 | 12 | todo | patients, backend, frontend, bugfix, s2 |

Fixes B7: not possible in the prototype. Same form as creation, pre-filled, with optimistic locking.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /patients — src/routes/patients.tsx
- **Depends on:** `HOPE-PAT-02`

**Subtasks**

1. PATCH /patients/{id} with version check
2. Edit form reusing the creation form
3. ConflictDialog on 409

**Acceptance criteria**

- Change recorded in the audit log with a diff
- 409 on concurrent edit shows a ConflictDialog

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Edit phone — change visible and audited with diff
- Two tabs edit the same patient — second save gets conflict dialog

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 3 pts. Fixes prototype issue(s) B7 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PAT-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-PAT-06 — Patients screen wired to the API (list, search, sort, pagination, creation)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 26 | 12 | todo | patients, frontend, react, s2 |

Rework routes/patients.tsx with usePatients() and useCreatePatient(). Form built with react-hook-form + zod.

- **Folder:** `src/`
- **Prototype reference:** /patients — src/routes/patients.tsx
- **Depends on:** `HOPE-PAT-01`, `HOPE-PAT-02`, `HOPE-PAT-03`

**Subtasks**

1. usePatients / useCreatePatient hooks
2. react-hook-form + zod creation form
3. Loading skeleton and error state
4. Hide Consultation button for secretary

**Acceptance criteria**

- Feature parity with the prototype
- Loading skeleton and error state
- 'Consultation' button hidden for the secretary

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Search, sort, paginate — same behaviour as the prototype
- Create patient with a near-duplicate name — warning shown

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 3 pts. French version: PAT-06 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-AGD-01 — Appointments API: CRUD, date ranges, filter by practitioner

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 27 | 20 | todo | calendar, appointments, backend, spring, s2 |

Single unified status (design doc §4.3). Cancelling = CANCELLED status + reason, never a deletion.

- **Folder:** `hope-api/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-PAT-01`

**Subtasks**

1. Appointment entity with unified status
2. Range query + practitioner filter
3. Transition endpoints (confirm, check-in, call, finish, no-show, cancel)

**Acceptance criteria**

- GET /appointments?from=&to= returns the period's appointments
- Invalid transitions return 422
- Audit on every action

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Cancelling by deleting the appointment row

**Test scenarios**

- Cancel with reason — status CANCELLED, row kept
- Finish a cancelled appointment → 422

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AGD-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`AppointmentCategory`** _(embedded)_ — Calendar category / color — embedded in Settings.appointmentCategories[]  
📄 Source: `types.ts:58`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `label` | `string` | ✅ | e.g. "Consultation", "Contrôle" |
| `color` | `string (hex)` | ✅ | Calendar color coding |

**`Resource`** _(embedded)_ — Room / equipment / practitioner — embedded in Settings.resources[]  
📄 Source: `types.ts:52`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `"salle" \| "équipement" \| "praticien"` | ✅ |  |

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.



---

### HOPE-AUD-01 — Append-only server audit log for every write and every record access

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 28 | 20 | todo | audit, backend, spring, bugfix, s2 |

Fixes B15: partial coverage and a 400-entry cap in the prototype. Wire it from the start: every module publishes its events.

- **Folder:** `hope-api/`
- **Prototype reference:** /journal — src/routes/journal.tsx
- **Depends on:** `HOPE-FND-03`

**Subtasks**

1. audit_event table with SQL grants preventing UPDATE/DELETE
2. Publisher used by every service
3. Mutation → one event test

**Acceptance criteria**

- Table with no UPDATE/DELETE (SQL grants)
- Actor, action, entity, patient, IP, diff
- Test: every API mutation produces exactly one event

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Audit written from the browser

**Test scenarios**

- Try UPDATE on audit_event as app user → permission denied

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 5 pts. Fixes prototype issue(s) B15 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUD-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`AuditEntry`** _(table)_ — Activity log — append-only by convention, not by enforcement  
📄 Source: `types.ts:226`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `at` | `string (ISO)` | ✅ |  |
| `actor` | `string` | ✅ | **Name snapshot**, not an FK — resolved once at write time from the current user (`store.tsx:151-152`) |
| `summary` | `string` | ✅ | Human-readable description of the action |

> Written centrally by the `update()` function in `store.tsx:146-159`, whenever a caller passes an `audit` message. **Capped at 400 entries** (`.slice(0, 400)`) — oldest entries silently dropped. This cap and the lack of structured action/entity/entityId/diff fields is exactly what the tickets file flags as needing a real append-only, ungapped audit table server-side.

#### API endpoints used by this ticket

#### `GET /api/audit`
List audit events  
**Auth:** admin, medecin · **Source:** `journal.tsx:28 (data.audit.map)`

Request: Query: ?from=&to=&actorId=&entity=&patientId=&page=&size=

Response:
```json
{
  "content": [
    { "id": "aud-1", "at": "2025-01-20T10:00:00Z", "actorId": "doc-amine", "actor": "Dr Amine Gastro", "action": "PATIENT_CREATED", "entity": "patient", "entityId": "pat-hedi", "patientId": "pat-hedi", "summary": "Patient créé — Hédi Ben Salah", "diff": null }
  ],
  "page": 0, "size": 50, "totalElements": 400, "totalPages": 8
}
```

> The `action`/`entity`/`entityId`/`diff` fields are additions over the prototype (which only stores `actor`+`summary` as free text) — required per DATA-MODEL.md §7.4/§8 (HOPE-AUD-01: structured, append-only, no row cap, no UPDATE/DELETE grant).



---

### HOPE-NOT-01 — SMTP email service + templates (account activation, password reset, export ready)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 30 | 12 | todo | email, backend, spring, s2 |

Replaces the simulated sending (SendCredentialsModal). Mailpit in dev.

- **Folder:** `hope-api/`
- **Prototype reference:** SendCredentialsModal (simulated send)
- **Depends on:** `HOPE-FND-02`

**Subtasks**

1. SMTP client + send queue with retries
2. Templates: activation, reset, export ready
3. Mailpit in dev

**Acceptance criteria**

- Send queue with retries
- No password ever in an email
- French templates with the practice header

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Password included in any email

**Test scenarios**

- Create account — activation email visible in Mailpit

*Hope V1 · Sprint 2 — Patients, appointments (API), audit, email · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: NOT-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### Reference notes

> Backs POST /api/staff/{id}/send-credentials and the (planned) POST /api/auth/password/forgot — see both below.


---

### Calendar, waiting room, real time, dashboard (`s3`)

<a id="calendar-waiting-room-real-time-dashboard-s3"></a>

### HOPE-PAT-05 — Archive a patient (soft delete)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 31 | 8 | todo | patients, backend, frontend, s3 |

Archive a patient instead of deleting: the record disappears from lists and search but stays intact and can be shown with an 'archived' filter.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /patients — src/routes/patients.tsx
- **Depends on:** `HOPE-PAT-02`

**Subtasks**

1. archived_at column + archive endpoint
2. Archive button and 'archived' filter in the list

**Acceptance criteria**

- Archived patients hidden from lists and search by default, with an 'archived' filter
- No hard deletion

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Physical deletion of any patient data

**Test scenarios**

- Archive a patient — hidden from search, visible with the archived filter

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P1 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PAT-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### Reference notes

> POST /api/patients/{id}/archive is marked 'planned' below — this ticket is what builds it. Patient has no archivedAt field yet; add one (see the suggested SQL schema §8, patient.archived_at).


---

### HOPE-PAT-07 — Split first and last name in the patient model

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 31 | 8 | todo | patients, backend, frontend, s3 |

Store first name and last name separately (the prototype has one name field) so documents, search and sorting are consistent.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /patients — src/routes/patients.tsx
- **Depends on:** `HOPE-PAT-02`

**Subtasks**

1. Migration splitting name
2. Update forms and every display of the name

**Acceptance criteria**

- Search on both first and last name
- Consistent 'First LAST' display on every document

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Sort by last name works
- Prescription PDF shows 'First LAST'

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P1 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PAT-07 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### Reference notes

> Patient.name is currently a single string (see field table below). Splitting it into first/last name is a data-model change beyond what's documented — treat the Patient entity below as the pre-split baseline and add firstName/lastName alongside or instead of name.


---

### HOPE-AGD-02 — Blocked slots and public holidays: API + Tunisian holidays preloaded

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 32 | 12 | todo | calendar, appointments, backend, spring, s3 |

API for blocked time slots (with optional daily/weekly recurrence) and public holidays, with Tunisian national holidays preloaded.

- **Folder:** `hope-api/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-AGD-01`

**Subtasks**

1. Blocks CRUD with end > start check
2. Recurrence rule
3. Holiday migration for the current year

**Acceptance criteria**

- CHECK end > start
- National holidays for the year loaded by migration
- Recurring daily or weekly block (e.g. lunch break)

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Create block 14:00–12:00 → 400
- Daily lunch block appears on every weekday

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AGD-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Block`** _(table)_ — Agenda block-out  
📄 Source: `types.ts:37`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string` | ✅ |  |
| `start` | `string (HH:mm)` | ✅ |  |
| `end` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | e.g. "Congé", "Formation" |

Used in: `routes/agenda.tsx` to grey out slots.

**`Holiday`** _(table)_ — Practice-wide holiday, blocks the whole day  
📄 Source: `types.ts:46`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `label` | `string` | ✅ | e.g. "Aïd el-Fitr" |

Used in: Blocks the whole day automatically in `agenda.tsx` / `index.tsx`.

#### API endpoints used by this ticket

#### `GET /api/agenda/blocks`
List agenda block-outs  
**Auth:** session · **Source:** `agenda.tsx:58 (data.blocks.find)`

Request: Query: ?from=&to=

Response:
```json
{ "content": [ { "id": "blk-1", "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" } ] }
```


#### `POST /api/agenda/blocks`
Block out a time slot  
**Auth:** medecin, secretaire · **Source:** `agenda.tsx:233`

Request:
```json
{ "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" }
```

Response: 201 Created — the new block


#### `DELETE /api/agenda/blocks/{id}`
Remove a block-out  
**Auth:** medecin, secretaire · **Source:** `implied by the block list UI (delete affordance next to each block)`

Response: 204 No Content


#### `GET /api/agenda/holidays`
List holidays  
**Auth:** session · **Source:** `agenda.tsx:59,272, parametres.tsx holiday list`

Response:
```json
{ "content": [ { "id": "hol-1", "date": "2025-04-10", "label": "Aïd el-Fitr" } ] }
```


#### `POST /api/agenda/holidays`
Add a holiday (blocks the whole day)  
**Auth:** admin, medecin · **Source:** `parametres.tsx:572`

Request:
```json
{ "date": "2025-04-10", "label": "Aïd el-Fitr" }
```

Response: 201 Created


#### `DELETE /api/agenda/holidays/{id}`
Remove a holiday  
**Auth:** admin, medecin · **Source:** `parametres.tsx:557`

Response: 204 No Content


#### Reference notes

> Confirmed: the prototype's seed already preloads 4 real Tunisian civil holidays (fixed calendar dates — Fête de l'Indépendance 20/03, Journée des Martyrs 09/04, Fête du Travail 01/05, Fête de la République 25/07). It has NONE of the lunar/religious holidays (Aïd el-Fitr, Aïd el-Adha, Mawlid, Ras el-Am Hijri) since those shift dates every year and can't be hardcoded the same way — those need either a yearly manual entry or a lunar-calendar conversion library, not just extending the same static seed list.


---

### HOPE-AGD-03 — Conflict detection (practitioner/resource overlap, blocked slot, holiday)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 32 | 12 | todo | calendar, appointments, backend, spring, bugfix, s3 |

Fixes B9. PostgreSQL exclusion constraint (tstzrange) + clear message in the UI.

- **Folder:** `hope-api/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-AGD-01`, `HOPE-AGD-02`

**Subtasks**

1. Exclusion constraint on practitioner time range
2. Blocked/holiday check in service
3. Doctor override with confirmation flag

**Acceptance criteria**

- Double booking refused (or forced by the doctor after confirmation)
- Booking on a blocked slot or holiday refused
- Concurrency test: two simultaneous bookings, only one succeeds

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Two parallel bookings on the same slot — one succeeds, one gets 409

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P0 · 3 pts. Fixes prototype issue(s) B9 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AGD-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Block`** _(table)_ — Agenda block-out  
📄 Source: `types.ts:37`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string` | ✅ |  |
| `start` | `string (HH:mm)` | ✅ |  |
| `end` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | e.g. "Congé", "Formation" |

Used in: `routes/agenda.tsx` to grey out slots.

**`Holiday`** _(table)_ — Practice-wide holiday, blocks the whole day  
📄 Source: `types.ts:46`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `label` | `string` | ✅ | e.g. "Aïd el-Fitr" |

Used in: Blocks the whole day automatically in `agenda.tsx` / `index.tsx`.

**`Resource`** _(embedded)_ — Room / equipment / practitioner — embedded in Settings.resources[]  
📄 Source: `types.ts:52`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `"salle" \| "équipement" \| "praticien"` | ✅ |  |

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### `GET /api/agenda/blocks`
List agenda block-outs  
**Auth:** session · **Source:** `agenda.tsx:58 (data.blocks.find)`

Request: Query: ?from=&to=

Response:
```json
{ "content": [ { "id": "blk-1", "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" } ] }
```


#### `POST /api/agenda/blocks`
Block out a time slot  
**Auth:** medecin, secretaire · **Source:** `agenda.tsx:233`

Request:
```json
{ "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" }
```

Response: 201 Created — the new block


#### `DELETE /api/agenda/blocks/{id}`
Remove a block-out  
**Auth:** medecin, secretaire · **Source:** `implied by the block list UI (delete affordance next to each block)`

Response: 204 No Content


#### `GET /api/agenda/holidays`
List holidays  
**Auth:** session · **Source:** `agenda.tsx:59,272, parametres.tsx holiday list`

Response:
```json
{ "content": [ { "id": "hol-1", "date": "2025-04-10", "label": "Aïd el-Fitr" } ] }
```


#### `POST /api/agenda/holidays`
Add a holiday (blocks the whole day)  
**Auth:** admin, medecin · **Source:** `parametres.tsx:572`

Request:
```json
{ "date": "2025-04-10", "label": "Aïd el-Fitr" }
```

Response: 201 Created


#### `DELETE /api/agenda/holidays/{id}`
Remove a holiday  
**Auth:** admin, medecin · **Source:** `parametres.tsx:557`

Response: 204 No Content


#### Reference notes

> Confirmed: there is NO conflict-detection logic anywhere in the prototype today (no 'overlap'/'conflict' check in agenda.tsx or AppointmentModal.tsx) — double-booking the same slot, resource, or a blocked/holiday period is currently silently allowed. This ticket builds that check from scratch, not a fix to existing (broken) logic.


---

### HOPE-AGD-04 — Calendar screen wired (day, week, month) + 'Today' button + practitioner filter

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 33 | 20 | todo | calendar, appointments, frontend, react, s3 |

Wire the day / week / month calendar to the API, keeping the prototype's look, and add a 'Today' button and a practitioner filter.

- **Folder:** `src/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-AGD-01`, `HOPE-AGD-02`

**Subtasks**

1. useAppointments(range) hook
2. Opening hours drive the grid
3. Practitioner filter
4. Today button

**Acceptance criteria**

- Parity with the prototype (hatching, category colours, holiday badge)
- Configurable opening hours drive the grid
- Practitioner filter when there are several doctors (D2)

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Week view matches prototype layout
- Switch practitioner — only their appointments shown

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P0 · 5 pts. French version: AGD-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Resource`** _(embedded)_ — Room / equipment / practitioner — embedded in Settings.resources[]  
📄 Source: `types.ts:52`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `"salle" \| "équipement" \| "praticien"` | ✅ |  |

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> Confirmed partial: the day/week/month view toggle already exists (agenda.tsx:35, `useState<"day"|"week"|"month">`), and resourceId is already settable per-appointment from AppointmentModal.tsx (a picker over Settings.resources). But there is NO 'Today' button anywhere in agenda.tsx, and agenda.tsx itself never reads resourceId at all — the calendar view doesn't display which practitioner/room an appointment is assigned to, and has no filter-by-practitioner control. Both are new work.


---

### HOPE-AGD-05 — Manage blocked slots from the calendar (create, edit, delete)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 35 | 8 | todo | calendar, appointments, frontend, react, bugfix, s3 |

Fixes B9: in the prototype a block can be neither deleted nor edited.

- **Folder:** `src/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-AGD-02`

**Subtasks**

1. Click on hatched area opens block editor
2. Edit and delete with confirmation

**Acceptance criteria**

- Clicking a blocked area opens an edit modal
- Deletion asks for confirmation

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Delete a block — slot becomes bookable

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P1 · 2 pts. Fixes prototype issue(s) B9 (specification §7). French version: AGD-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Block`** _(table)_ — Agenda block-out  
📄 Source: `types.ts:37`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string` | ✅ |  |
| `start` | `string (HH:mm)` | ✅ |  |
| `end` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | e.g. "Congé", "Formation" |

Used in: `routes/agenda.tsx` to grey out slots.

#### API endpoints used by this ticket

#### `GET /api/agenda/blocks`
List agenda block-outs  
**Auth:** session · **Source:** `agenda.tsx:58 (data.blocks.find)`

Request: Query: ?from=&to=

Response:
```json
{ "content": [ { "id": "blk-1", "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" } ] }
```


#### `POST /api/agenda/blocks`
Block out a time slot  
**Auth:** medecin, secretaire · **Source:** `agenda.tsx:233`

Request:
```json
{ "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" }
```

Response: 201 Created — the new block


#### `DELETE /api/agenda/blocks/{id}`
Remove a block-out  
**Auth:** medecin, secretaire · **Source:** `implied by the block list UI (delete affordance next to each block)`

Response: 204 No Content


#### `GET /api/agenda/holidays`
List holidays  
**Auth:** session · **Source:** `agenda.tsx:59,272, parametres.tsx holiday list`

Response:
```json
{ "content": [ { "id": "hol-1", "date": "2025-04-10", "label": "Aïd el-Fitr" } ] }
```


#### `POST /api/agenda/holidays`
Add a holiday (blocks the whole day)  
**Auth:** admin, medecin · **Source:** `parametres.tsx:572`

Request:
```json
{ "date": "2025-04-10", "label": "Aïd el-Fitr" }
```

Response: 201 Created


#### `DELETE /api/agenda/holidays/{id}`
Remove a holiday  
**Auth:** admin, medecin · **Source:** `parametres.tsx:557`

Response: 204 No Content



---

### HOPE-AGD-06 — Appointment modal wired (patient, quick creation, category, resource, reason)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 35 | 12 | todo | calendar, appointments, frontend, react, s3 |

Wire the appointment modal: patient search or quick creation (with duplicate check), category, resource, reason and free-slot picker.

- **Folder:** `src/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-AGD-01`, `HOPE-PAT-03`

**Subtasks**

1. Patient picker on the API
2. Quick creation with duplicate check
3. Free slots only
4. Cancel with reason

**Acceptance criteria**

- Quick patient creation with duplicate detection
- 'Cancel appointment' asks for a reason
- Only free slots are offered

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Quick-create a near-duplicate patient — warning shown
- Busy slot not offered

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P0 · 3 pts. French version: AGD-06 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`AppointmentCategory`** _(embedded)_ — Calendar category / color — embedded in Settings.appointmentCategories[]  
📄 Source: `types.ts:58`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `label` | `string` | ✅ | e.g. "Consultation", "Contrôle" |
| `color` | `string (hex)` | ✅ | Calendar color coding |

**`Resource`** _(embedded)_ — Room / equipment / practitioner — embedded in Settings.resources[]  
📄 Source: `types.ts:52`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `"salle" \| "équipement" \| "praticien"` | ✅ |  |

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-AGD-07 — Opening hours per weekday

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 36 | 8 | todo | calendar, appointments, backend, frontend, s3 |

Configure opening hours per weekday (e.g. Saturday morning only) instead of a fixed 8:00–18:00 grid.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-AGD-04`

**Subtasks**

1. Opening hours table + API
2. Settings form
3. Calendar reads hours

**Acceptance criteria**

- Opening hours editable per weekday in Settings
- Calendar grid and free slots follow them
- Booking outside opening hours refused

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Set Saturday 8:00–13:00 — Saturday afternoon not bookable

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P2 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AGD-07 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.


#### Reference notes

> Opening hours per weekday are not yet a field on Settings below — this ticket adds them (e.g. Settings.openingHours: {day, start, end}[]).


---

### HOPE-SAL-01 — Real-time SSE channel /api/events (calendar, waiting room, reminders)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 37 | 12 | todo | waiting-room, realtime, backend, frontend, s3 |

Server-Sent Events channel pushing appointment, waiting-room and reminder changes to every connected computer of the practice.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /tracker — src/routes/tracker.tsx
- **Depends on:** `HOPE-AGD-01`

**Subtasks**

1. GET /api/events SSE endpoint filtered by practice and role
2. Front hook with auto-reconnect
3. Invalidate TanStack Query caches on events

**Acceptance criteria**

- An appointment created on computer A shows on computer B in < 2 s
- Automatic reconnection
- Events filtered by practice and role

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Reconnect creating duplicate listeners

**Test scenarios**

- Create appointment on computer A — appears on B in < 2 s
- Kill the connection — client reconnects

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: SAL-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> The realtime SSE channel itself (/api/events) is not part of the REST endpoint catalog below (which documents request/response HTTP, not a streaming channel) — design it as a separate push channel that emits the same Appointment/tracker payloads documented under 'Appointments'.


---

### HOPE-SAL-02 — Patient-flow actions: check in, call in, finish, remove — unified appointment status

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 37 | 12 | todo | waiting-room, realtime, backend, spring, bugfix, s3 |

Fixes B10: 'Finish' in the waiting room sets the appointment to DONE.

- **Folder:** `hope-api/`
- **Prototype reference:** /tracker — src/routes/tracker.tsx
- **Depends on:** `HOPE-AGD-01`

**Subtasks**

1. check-in / call / finish / undo-check-in transitions
2. Timestamps stored
3. Events published on SAL-01

**Acceptance criteria**

- checked_in_at, called_at and finished_at timestamps recorded
- The Today dashboard shows the same status

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Finish in waiting room — Today dashboard shows Done

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P0 · 3 pts. Fixes prototype issue(s) B10 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: SAL-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> This ticket's name lists 4 distinct actions ('check in, call in, finish, remove') but TrackerStatus only has 3 states (waiting/in_consult/done) plus checkedInAt unset = not arrived. There's no separate 'called into the consultation room but not yet started' state — the prototype conflates 'call in' and 'actually in consultation' into the same in_consult value. If the real app needs a distinct 'called' step, TrackerStatus needs a 4th value, not just an API port of the existing 3.


---

### HOPE-SAL-03 — Waiting-room screen wired and synced in real time

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 38 | 12 | todo | waiting-room, realtime, frontend, react, s3 |

Wire the waiting-room board (expected, waiting, in consultation, done) to the API and keep it in sync live between reception and the doctor's office.

- **Folder:** `src/`
- **Prototype reference:** /tracker — src/routes/tracker.tsx
- **Depends on:** `HOPE-SAL-01`, `HOPE-SAL-02`

**Subtasks**

1. Board on appointments of the day
2. Live updates via SAL-01
3. Waiting time refreshed every minute

**Acceptance criteria**

- Waiting time refreshed every minute
- Two computers see the same board without reloading

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Secretary checks in a patient — doctor's board updates without reload

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P0 · 3 pts. French version: SAL-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.



---

### HOPE-SAL-04 — Walk-in patient added straight to the waiting room

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 39 | 8 | todo | waiting-room, realtime, backend, frontend, s3 |

Add a patient who arrives without an appointment straight into the waiting room (creates an appointment on the fly).

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /tracker — src/routes/tracker.tsx
- **Depends on:** `HOPE-SAL-02`

**Subtasks**

1. Walk-in endpoint
2. Walk-in dialog

**Acceptance criteria**

- 'Walk-in' button on the waiting-room board
- Creates an appointment at the current time with status ARRIVED
- Duplicate patient check applies

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Add walk-in — appears in Waiting column and in the calendar

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P2 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: SAL-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### Reference notes

> Confirmed: tracker.tsx has no walk-in path at all today — its only interaction is checkIn() on an appointment already in `notArrived` (i.e. already scheduled for today). There is no button/modal on this screen to create a same-day appointment or check-in a patient with no prior booking. This ticket is entirely new functionality, not a fix.


---

### HOPE-DASH-01 — Today dashboard wired; greeting uses the signed-in user

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 40 | 8 | todo | dashboard, frontend, react, bugfix, s3 |

Fixes B5 (hard-coded 'Bonjour, Dr. Belhaj').

- **Folder:** `src/`
- **Prototype reference:** / (Aujourd'hui) — src/routes/index.tsx
- **Depends on:** `HOPE-AGD-01`, `HOPE-AUTH-03`

**Subtasks**

1. Greeting from /me
2. Today list from appointments API
3. Status actions wired

**Acceptance criteria**

- Greeting shows the current user's name
- Done, no-show, edit and cancel actions work

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Log in as another doctor — greeting shows their name

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P0 · 2 pts. Fixes prototype issue(s) B5 (specification §7). French version: DASH-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### Reference notes

> Confirmed the exact bug this ticket exists to fix: index.tsx:54 has a fully hardcoded greeting — `title="Bonjour, Dr. Belhaj"` — with no reference to currentUser or data.settings.doctorName anywhere in the file. Every signed-in user, including a secretaire, sees 'Bonjour, Dr. Belhaj' today.


---

### HOPE-DASH-02 — '30-day attendance rate' computed over a rolling 30 days

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 40 | 4 | todo | dashboard, backend, spring, bugfix, s3 |

Fixes B6: the prototype uses the whole history.

- **Folder:** `hope-api/`
- **Prototype reference:** / (Aujourd'hui) — src/routes/index.tsx
- **Depends on:** `HOPE-AGD-01`

**Subtasks**

1. Attendance endpoint over D-30..D-1
2. Boundary unit tests

**Acceptance criteria**

- Rate = done / (done + no-show) over D-30..D-1
- Unit test on the period boundaries

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Fixture with 8 done and 2 no-shows in 30 days → 80%

*Hope V1 · Sprint 3 — Calendar, waiting room, real time, dashboard · P1 · 1 pts. Fixes prototype issue(s) B6 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DASH-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> The '30-day attendance rate' is a new aggregate not yet in the endpoint catalog — likely a query parameter or a dedicated GET /api/appointments/stats endpoint layered on top of GET /api/appointments below.

> Confirmed a second bug this ticket must fix, distinct from the missing endpoint: the prototype's own 'Taux de présence (30 j)' tile (index.tsx:43-45) does NOT actually filter by the last 30 days despite its variable name (`last30`) and its label — it's `data.appointments.filter(a => a.status !== "upcoming")` with no date bound at all, i.e. every done/absent appointment ever, not a rolling 30-day window.


---

### Patient record & interview grid (`s4`)

<a id="patient-record-interview-grid-s4"></a>

### HOPE-DOS-01 — Record summary API (identity, allergies, history, recent prescriptions) with access auditing

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 41 | 12 | todo | patient-record, backend, spring, bugfix, s4 |

Fixes B4: every time a doctor opens a record, a RecordAccessed event is logged.

- **Folder:** `hope-api/`
- **Prototype reference:** Patient record drawer /patients?p=… — src/components/cabinet/PatientDrawer.tsx
- **Depends on:** `HOPE-PAT-01`

**Subtasks**

1. GET /patients/{id}/summary
2. RecordAccessed audit event
3. Secretary: allergies only

**Acceptance criteria**

- Secretary gets 403 (except read-only allergies)
- Audit event on every opening

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Clinical fields returned to the secretary role

**Test scenarios**

- Doctor opens a record — audit log shows access
- Secretary calls summary → 403 except allergies endpoint

*Hope V1 · Sprint 4 — Patient record & interview grid · P0 · 3 pts. Fixes prototype issue(s) B4 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOS-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

**`Note`** _(table)_ — Clinical note / consultation record — the most overloaded table  
📄 Source: `types.ts:76`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Free-text body |
| `attachments` | `NoteAttachment[]` | optional | Embedded 1:N, see §3.9 |
| `motif` | `string` | optional | Structured consultation: chief complaint |
| `exam` | `string` | optional | Structured consultation: physical exam |
| `diagnosis` | `string` | optional | Structured consultation: diagnosis |
| `plan` | `string` | optional | Structured consultation: plan |
| `icd` | `IcdCode[]` | optional | Embedded snapshot of picked ICD-10 codes (see §5.1) — copied by value, not by reference |
| `authorId` | `string` | optional | FK-like → Doctor.id |

> It stores **both free-text notes and structured consultation data** in the same row.

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`AuditEntry`** _(table)_ — Activity log — append-only by convention, not by enforcement  
📄 Source: `types.ts:226`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `at` | `string (ISO)` | ✅ |  |
| `actor` | `string` | ✅ | **Name snapshot**, not an FK — resolved once at write time from the current user (`store.tsx:151-152`) |
| `summary` | `string` | ✅ | Human-readable description of the action |

> Written centrally by the `update()` function in `store.tsx:146-159`, whenever a caller passes an `audit` message. **Capped at 400 entries** (`.slice(0, 400)`) — oldest entries silently dropped. This cap and the lack of structured action/entity/entityId/diff fields is exactly what the tickets file flags as needing a real append-only, ungapped audit table server-side.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### `GET /api/patients/{patientId}/notes`
List a patient's clinical notes / consultations  
**Auth:** medecin (secretary → 403, clinical data) · **Source:** `PatientDrawer.tsx:102, historique.$id.tsx:66, patients.tsx:66`

Response:
```json
{
  "content": [
    {
      "id": "note-1", "patientId": "pat-salma", "date": "2025-01-10",
      "text": "RAS, patiente rassurée.",
      "motif": "Douleur épigastrique", "exam": "Souple, indolore", "diagnosis": "RGO",
      "plan": "IPP 4 semaines", "icd": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ],
      "authorId": "doc-amine",
      "attachments": [ { "id": "att-1", "name": "compte-rendu.pdf", "type": "application/pdf", "url": "/files/att-1" } ]
    }
  ]
}
```

> `attachments[].url` replaces the prototype's inline `dataUrl` (DATA-MODEL.md §7.5).


#### `POST /api/patients/{patientId}/notes` 🔴
Create a note / structured consultation  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:53-77 (structured consultation), free-text note creation in PatientDrawer.tsx`

Request:
```json
{
  "date": "2025-01-20",
  "text": "",
  "motif": "Douleur abdominale",
  "exam": "Sensibilité en FID",
  "diagnosis": "Suspicion d'appendicite",
  "plan": "Échographie en urgence",
  "icd": [ { "code": "K37", "label": "Appendicite, sans précision" } ]
}
```

Response: 201 Created — the new note

> Audit: *“Consultation enregistrée — {patientName}”*.


#### `PATCH /api/patients/{patientId}/notes/{noteId}` 🔴
Edit an existing note / consultation  
**Auth:** medecin (author or admin) · **Source:** `editing an existing note/consultation`

Request:
```json
{ "plan": "IPP 8 semaines", "version": 2 }
```

Response: Updated note.

> Audit: *“Consultation modifiée — {patientName}”*.


#### `POST /api/patients/{patientId}/notes/{noteId}/attachments`
Upload a file attachment to a note  
**Auth:** medecin · **Source:** `PatientDrawer.tsx attachment upload (drag/drop or file picker, currently base64)`

Request: multipart/form-data, field: file

Response:
```json
{ "id": "att-2", "name": "scanner.jpg", "type": "image/jpeg", "url": "/files/att-2" }
```


#### `DELETE /api/patients/{patientId}/notes/{noteId}/attachments/{attachmentId}` 🔴
Remove a note attachment  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:658-667`

Response: 204 No Content

> Audit: *“Fichier supprimé — {fileName}”*.


#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### `GET /api/audit`
List audit events  
**Auth:** admin, medecin · **Source:** `journal.tsx:28 (data.audit.map)`

Request: Query: ?from=&to=&actorId=&entity=&patientId=&page=&size=

Response:
```json
{
  "content": [
    { "id": "aud-1", "at": "2025-01-20T10:00:00Z", "actorId": "doc-amine", "actor": "Dr Amine Gastro", "action": "PATIENT_CREATED", "entity": "patient", "entityId": "pat-hedi", "patientId": "pat-hedi", "summary": "Patient créé — Hédi Ben Salah", "diff": null }
  ],
  "page": 0, "size": 50, "totalElements": 400, "totalPages": 8
}
```

> The `action`/`entity`/`entityId`/`diff` fields are additions over the prototype (which only stores `actor`+`summary` as free text) — required per DATA-MODEL.md §7.4/§8 (HOPE-AUD-01: structured, append-only, no row cap, no UPDATE/DELETE grant).


#### Reference notes

> Confirmed: 'with access auditing' in this ticket's name is entirely new — PatientDrawer.tsx never calls update() (the only way to write an AuditEntry) just from opening a record; all 7 of its update() calls are genuine writes (allergy edit, attachment delete, etc.), none fire on read. The prototype's audit system as it exists today logs writes only, and even that isn't guaranteed (DATA-MODEL.md §7 point 4) — logging every read (record access) is new server-side behavior this ticket must add, not a client-side gap to close.


---

### HOPE-DOS-02 — Allergies and medical history: add, edit, remove

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 42 | 12 | todo | patient-record, backend, frontend, bugfix, s4 |

Fixes B7: in the prototype you can neither clear all allergies nor remove a history item.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Patient record drawer /patients?p=… — src/components/cabinet/PatientDrawer.tsx
- **Depends on:** `HOPE-DOS-01`

**Subtasks**

1. PUT allergies (empty list allowed)
2. Conditions CRUD with active flag
3. Wire allergy modal and history chips

**Acceptance criteria**

- Allergy list can be emptied
- History item can be deleted or deactivated
- Red 'Allergies' banner updates immediately

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Remove every allergy — banner switches to 'No known allergy'
- Remove a history item — gone after reload

*Hope V1 · Sprint 4 — Patient record & interview grid · P0 · 3 pts. Fixes prototype issue(s) B7 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOS-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-DOS-03 — Consultation notes (free text or structured + ICD-10) and attachments in object storage

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 50 | 20 | todo | patient-record, backend, frontend, bugfix, s4 |

Rework the Notes section of PatientDrawer. Fixes B17 (delete button nested inside a link).

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Patient record drawer /patients?p=… — src/components/cabinet/PatientDrawer.tsx
- **Depends on:** `HOPE-DOS-01`, `HOPE-DOC-01`

**Subtasks**

1. Notes API (free + structured + ICD-10)
2. ICD-10 reference table and search
3. Attachment upload via DOC-01
4. Fix nested delete button

**Acceptance criteria**

- Files ≤ 20 MB, image/PDF types, uploaded as multipart and served via signed URL
- ICD-10 reference table with /icd10?q= search
- Deleting an attachment asks for confirmation, with valid HTML

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Attachments stored as base64 in the database or browser

**Test scenarios**

- Attach a 5 MB PDF — opens via signed URL
- Upload a 30 MB file → rejected with clear message

*Hope V1 · Sprint 4 — Patient record & interview grid · P0 · 5 pts. Fixes prototype issue(s) B17 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOS-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Note`** _(table)_ — Clinical note / consultation record — the most overloaded table  
📄 Source: `types.ts:76`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Free-text body |
| `attachments` | `NoteAttachment[]` | optional | Embedded 1:N, see §3.9 |
| `motif` | `string` | optional | Structured consultation: chief complaint |
| `exam` | `string` | optional | Structured consultation: physical exam |
| `diagnosis` | `string` | optional | Structured consultation: diagnosis |
| `plan` | `string` | optional | Structured consultation: plan |
| `icd` | `IcdCode[]` | optional | Embedded snapshot of picked ICD-10 codes (see §5.1) — copied by value, not by reference |
| `authorId` | `string` | optional | FK-like → Doctor.id |

> It stores **both free-text notes and structured consultation data** in the same row.

**`NoteAttachment`** _(embedded)_ — Embedded in Note.attachments[]  
📄 Source: `types.ts:64`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `name` | `string` | ✅ | File name |
| `type` | `string` | ✅ | MIME type |
| `dataUrl` | `string` | ✅ | Base64 inline — **must become a real file store / object storage in the real app** |

**`IcdCode`** _(embedded)_ — Embedded value object  
📄 Source: `types.ts:71`

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | `string` | ✅ |  |
| `label` | `string` | ✅ |  |

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/notes`
List a patient's clinical notes / consultations  
**Auth:** medecin (secretary → 403, clinical data) · **Source:** `PatientDrawer.tsx:102, historique.$id.tsx:66, patients.tsx:66`

Response:
```json
{
  "content": [
    {
      "id": "note-1", "patientId": "pat-salma", "date": "2025-01-10",
      "text": "RAS, patiente rassurée.",
      "motif": "Douleur épigastrique", "exam": "Souple, indolore", "diagnosis": "RGO",
      "plan": "IPP 4 semaines", "icd": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ],
      "authorId": "doc-amine",
      "attachments": [ { "id": "att-1", "name": "compte-rendu.pdf", "type": "application/pdf", "url": "/files/att-1" } ]
    }
  ]
}
```

> `attachments[].url` replaces the prototype's inline `dataUrl` (DATA-MODEL.md §7.5).


#### `POST /api/patients/{patientId}/notes` 🔴
Create a note / structured consultation  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:53-77 (structured consultation), free-text note creation in PatientDrawer.tsx`

Request:
```json
{
  "date": "2025-01-20",
  "text": "",
  "motif": "Douleur abdominale",
  "exam": "Sensibilité en FID",
  "diagnosis": "Suspicion d'appendicite",
  "plan": "Échographie en urgence",
  "icd": [ { "code": "K37", "label": "Appendicite, sans précision" } ]
}
```

Response: 201 Created — the new note

> Audit: *“Consultation enregistrée — {patientName}”*.


#### `PATCH /api/patients/{patientId}/notes/{noteId}` 🔴
Edit an existing note / consultation  
**Auth:** medecin (author or admin) · **Source:** `editing an existing note/consultation`

Request:
```json
{ "plan": "IPP 8 semaines", "version": 2 }
```

Response: Updated note.

> Audit: *“Consultation modifiée — {patientName}”*.


#### `POST /api/patients/{patientId}/notes/{noteId}/attachments`
Upload a file attachment to a note  
**Auth:** medecin · **Source:** `PatientDrawer.tsx attachment upload (drag/drop or file picker, currently base64)`

Request: multipart/form-data, field: file

Response:
```json
{ "id": "att-2", "name": "scanner.jpg", "type": "image/jpeg", "url": "/files/att-2" }
```


#### `DELETE /api/patients/{patientId}/notes/{noteId}/attachments/{attachmentId}` 🔴
Remove a note attachment  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:658-667`

Response: 204 No Content

> Audit: *“Fichier supprimé — {fileName}”*.


#### Reference notes

> Depends on HOPE-DOC-01 (object storage) which is out of this document's scope (see the DOC-01 entry below) — NoteAttachment.dataUrl (inline base64) must become NoteAttachment.url once that storage service exists.


---

### HOPE-DOS-04 — Record timeline (appointments, notes, consultations, certificates, prescriptions, referrals)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 44 | 12 | todo | patient-record, backend, spring, s4 |

Server-side merged timeline of everything that happened to a patient, paginated and filterable by type.

- **Folder:** `hope-api/`
- **Prototype reference:** Patient record drawer /patients?p=… — src/components/cabinet/PatientDrawer.tsx
- **Depends on:** `HOPE-DOS-01`

**Subtasks**

1. Timeline query across appointments, notes, consultations, certificates, prescriptions, referrals
2. Type filter + pagination

**Acceptance criteria**

- Paginated GET /patients/{id}/timeline?types=
- Last 6 items shown in the record + full view in a modal

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Patient with 50 events — pages of 20, newest first

*Hope V1 · Sprint 4 — Patient record & interview grid · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOS-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Note`** _(table)_ — Clinical note / consultation record — the most overloaded table  
📄 Source: `types.ts:76`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Free-text body |
| `attachments` | `NoteAttachment[]` | optional | Embedded 1:N, see §3.9 |
| `motif` | `string` | optional | Structured consultation: chief complaint |
| `exam` | `string` | optional | Structured consultation: physical exam |
| `diagnosis` | `string` | optional | Structured consultation: diagnosis |
| `plan` | `string` | optional | Structured consultation: plan |
| `icd` | `IcdCode[]` | optional | Embedded snapshot of picked ICD-10 codes (see §5.1) — copied by value, not by reference |
| `authorId` | `string` | optional | FK-like → Doctor.id |

> It stores **both free-text notes and structured consultation data** in the same row.

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

**`Certificate`** _(table)_ — Issued certificate (sick leave, sport fitness, etc.)  
📄 Source: `types.ts:146`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `type` | `string` | ✅ | One of BUILTIN_CERTIFICATE_TYPES (§5.4) or a custom CertificateTemplate.type |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from startDate + days |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/certificats.tsx` (monthly register, print/duplicate).

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Referral`** _(table)_ — Letter to a specialist  
📄 Source: `types.ts:159`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → Contact.id (recipient) |
| `reason` | `string` | ✅ |  |
| `documentDate` | `string` | ✅ |  |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/orientations.tsx`.

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### `GET /api/patients/{patientId}/notes`
List a patient's clinical notes / consultations  
**Auth:** medecin (secretary → 403, clinical data) · **Source:** `PatientDrawer.tsx:102, historique.$id.tsx:66, patients.tsx:66`

Response:
```json
{
  "content": [
    {
      "id": "note-1", "patientId": "pat-salma", "date": "2025-01-10",
      "text": "RAS, patiente rassurée.",
      "motif": "Douleur épigastrique", "exam": "Souple, indolore", "diagnosis": "RGO",
      "plan": "IPP 4 semaines", "icd": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ],
      "authorId": "doc-amine",
      "attachments": [ { "id": "att-1", "name": "compte-rendu.pdf", "type": "application/pdf", "url": "/files/att-1" } ]
    }
  ]
}
```

> `attachments[].url` replaces the prototype's inline `dataUrl` (DATA-MODEL.md §7.5).


#### `POST /api/patients/{patientId}/notes` 🔴
Create a note / structured consultation  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:53-77 (structured consultation), free-text note creation in PatientDrawer.tsx`

Request:
```json
{
  "date": "2025-01-20",
  "text": "",
  "motif": "Douleur abdominale",
  "exam": "Sensibilité en FID",
  "diagnosis": "Suspicion d'appendicite",
  "plan": "Échographie en urgence",
  "icd": [ { "code": "K37", "label": "Appendicite, sans précision" } ]
}
```

Response: 201 Created — the new note

> Audit: *“Consultation enregistrée — {patientName}”*.


#### `PATCH /api/patients/{patientId}/notes/{noteId}` 🔴
Edit an existing note / consultation  
**Auth:** medecin (author or admin) · **Source:** `editing an existing note/consultation`

Request:
```json
{ "plan": "IPP 8 semaines", "version": 2 }
```

Response: Updated note.

> Audit: *“Consultation modifiée — {patientName}”*.


#### `POST /api/patients/{patientId}/notes/{noteId}/attachments`
Upload a file attachment to a note  
**Auth:** medecin · **Source:** `PatientDrawer.tsx attachment upload (drag/drop or file picker, currently base64)`

Request: multipart/form-data, field: file

Response:
```json
{ "id": "att-2", "name": "scanner.jpg", "type": "image/jpeg", "url": "/files/att-2" }
```


#### `DELETE /api/patients/{patientId}/notes/{noteId}/attachments/{attachmentId}` 🔴
Remove a note attachment  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:658-667`

Response: 204 No Content

> Audit: *“Fichier supprimé — {fileName}”*.


#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### `GET /api/certificates`
List certificates (monthly register, per patient)  
**Auth:** medecin · **Source:** `certificats.tsx:74 (monthly register), historique.$id.tsx:76, PatientDrawer.tsx:107`

Request: Query: ?patientId=&month=2025-01

Response:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```


#### `POST /api/certificates` 🔴
Issue a certificate  
**Auth:** medecin · **Source:** `certificats.tsx:159-179 (create)`

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```

Response: 201 Created — documentDate/endDate/createdAt computed server-side (endDate = startDate + days)

> Audit: *“Certificat créé — {type}, {patientName}”*.


#### `POST /api/certificates/{id}/duplicate` 🔴
Duplicate an existing certificate  
**Auth:** medecin · **Source:** `certificats.tsx:181-191 (duplicate)`

Request:
```json
{ }
```

Response: 201 Created — same patientId/type/text, documentDate/createdAt reset to now

> Audit: *“Certificat dupliqué — {type}, {patientName}”*.


#### `GET /api/certificates/{id}/pdf` _(planned)_
Download a server-rendered PDF  
**Auth:** medecin · **Source:** `planned — HOPE-CERT-03 (prototype prints via the browser instead)`

Response: 200 OK, Content-Type: application/pdf


#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### `GET /api/referrals`
List referral letters  
**Auth:** medecin · **Source:** `orientations.tsx list`

Request: Query: ?patientId=

Response:
```json
{
  "content": [
    { "id": "ref-1", "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "documentDate": "2025-01-15", "text": "...", "createdAt": "2025-01-15T00:00:00Z" }
  ]
}
```


#### `POST /api/referrals` 🔴
Create a referral letter  
**Auth:** medecin · **Source:** `orientations.tsx:86-98 (save)`

Request:
```json
{ "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "text": "Cher confrère, ..." }
```

Response: 201 Created

> Audit: *“Courrier d'orientation créé — {patientName} → {specialty}”*.


#### `POST /api/referrals/{id}/email` _(planned)_
Email the referral letter (PDF) to the colleague  
**Auth:** medecin · **Source:** `planned — HOPE-ORI-03, not in prototype`

Request:
```json
{ } (uses contactId's email)
```

Response: 202 Accepted


#### Reference notes

> Confirmed: the prototype's timeline (PatientDrawer.tsx's `timeline` array) merges only appointments + notes + certificates into one chronological list — prescriptions and referrals are fetched and rendered in their OWN separate sections, never merged into the timeline; diagnostics are fetched but not shown in either. A true unified timeline across all 6 types (this ticket's scope) doesn't exist today even client-side.


---

### HOPE-DOS-05 — Link the History page /historique/$id (currently unreachable) with its filters

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 45 | 8 | todo | patient-record, frontend, react, bugfix, s4 |

Fixes B14.

- **Folder:** `src/`
- **Prototype reference:** /historique/$id — src/routes/historique.$id.tsx
- **Depends on:** `HOPE-DOS-04`

**Subtasks**

1. Add 'See full history' link in the record
2. Wire page to the timeline API

**Acceptance criteria**

- 'See full history' link from the record to /historique/$id
- Filters by type kept

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- From a record, open full history — filters by type work

*Hope V1 · Sprint 4 — Patient record & interview grid · P1 · 2 pts. Fixes prototype issue(s) B14 (specification §7). French version: DOS-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Note`** _(table)_ — Clinical note / consultation record — the most overloaded table  
📄 Source: `types.ts:76`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Free-text body |
| `attachments` | `NoteAttachment[]` | optional | Embedded 1:N, see §3.9 |
| `motif` | `string` | optional | Structured consultation: chief complaint |
| `exam` | `string` | optional | Structured consultation: physical exam |
| `diagnosis` | `string` | optional | Structured consultation: diagnosis |
| `plan` | `string` | optional | Structured consultation: plan |
| `icd` | `IcdCode[]` | optional | Embedded snapshot of picked ICD-10 codes (see §5.1) — copied by value, not by reference |
| `authorId` | `string` | optional | FK-like → Doctor.id |

> It stores **both free-text notes and structured consultation data** in the same row.

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

**`Certificate`** _(table)_ — Issued certificate (sick leave, sport fitness, etc.)  
📄 Source: `types.ts:146`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `type` | `string` | ✅ | One of BUILTIN_CERTIFICATE_TYPES (§5.4) or a custom CertificateTemplate.type |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from startDate + days |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/certificats.tsx` (monthly register, print/duplicate).

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Referral`** _(table)_ — Letter to a specialist  
📄 Source: `types.ts:159`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → Contact.id (recipient) |
| `reason` | `string` | ✅ |  |
| `documentDate` | `string` | ✅ |  |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/orientations.tsx`.

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Front-end only — reuses the GET endpoints already listed under HOPE-DOS-04 (Appointments, Notes, Diagnostics, Certificates, Prescriptions, Referrals).

> Confirmed the exact severity of this ticket's own premise: a repo-wide search finds ZERO links anywhere (routes or components) pointing to /historique/$id — the route exists and renders, but nothing in the running app can navigate a user to it. It is completely orphaned today, not just hard-to-find.


---

### HOPE-DOS-08 — Patient record screen wired to the API (drawer + sections + anchor navigation)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 51 | 20 | todo | patient-record, frontend, react, s4 |

Rework PatientDrawer.tsx (859 lines) by splitting it into one sub-component per section. Add Prescriptions and Referrals sections. Remove 'Import record' (simulated, V2).

- **Folder:** `src/`
- **Prototype reference:** Patient record drawer /patients?p=… — src/components/cabinet/PatientDrawer.tsx
- **Depends on:** `HOPE-DOS-01`, `HOPE-DOS-02`, `HOPE-DOS-03`, `HOPE-DOS-04`

**Subtasks**

1. Split PatientDrawer into one component per section
2. Wire each section to its hooks
3. Add Prescriptions and Referrals sections
4. Remove simulated import

**Acceptance criteria**

- Parity with the prototype, minus the removed simulated features
- 'Edit identity' and 'New referral' buttons
- Component split (< 250 lines per file)

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Open record as doctor — every section loads
- Anchor navigation highlights the right tab while scrolling

*Hope V1 · Sprint 4 — Patient record & interview grid · P0 · 5 pts. French version: DOS-08 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

**`Note`** _(table)_ — Clinical note / consultation record — the most overloaded table  
📄 Source: `types.ts:76`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Free-text body |
| `attachments` | `NoteAttachment[]` | optional | Embedded 1:N, see §3.9 |
| `motif` | `string` | optional | Structured consultation: chief complaint |
| `exam` | `string` | optional | Structured consultation: physical exam |
| `diagnosis` | `string` | optional | Structured consultation: diagnosis |
| `plan` | `string` | optional | Structured consultation: plan |
| `icd` | `IcdCode[]` | optional | Embedded snapshot of picked ICD-10 codes (see §5.1) — copied by value, not by reference |
| `authorId` | `string` | optional | FK-like → Doctor.id |

> It stores **both free-text notes and structured consultation data** in the same row.

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

**`Certificate`** _(table)_ — Issued certificate (sick leave, sport fitness, etc.)  
📄 Source: `types.ts:146`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `type` | `string` | ✅ | One of BUILTIN_CERTIFICATE_TYPES (§5.4) or a custom CertificateTemplate.type |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from startDate + days |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/certificats.tsx` (monthly register, print/duplicate).

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Referral`** _(table)_ — Letter to a specialist  
📄 Source: `types.ts:159`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → Contact.id (recipient) |
| `reason` | `string` | ✅ |  |
| `documentDate` | `string` | ✅ |  |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/orientations.tsx`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### `GET /api/patients/{patientId}/notes`
List a patient's clinical notes / consultations  
**Auth:** medecin (secretary → 403, clinical data) · **Source:** `PatientDrawer.tsx:102, historique.$id.tsx:66, patients.tsx:66`

Response:
```json
{
  "content": [
    {
      "id": "note-1", "patientId": "pat-salma", "date": "2025-01-10",
      "text": "RAS, patiente rassurée.",
      "motif": "Douleur épigastrique", "exam": "Souple, indolore", "diagnosis": "RGO",
      "plan": "IPP 4 semaines", "icd": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ],
      "authorId": "doc-amine",
      "attachments": [ { "id": "att-1", "name": "compte-rendu.pdf", "type": "application/pdf", "url": "/files/att-1" } ]
    }
  ]
}
```

> `attachments[].url` replaces the prototype's inline `dataUrl` (DATA-MODEL.md §7.5).


#### `POST /api/patients/{patientId}/notes` 🔴
Create a note / structured consultation  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:53-77 (structured consultation), free-text note creation in PatientDrawer.tsx`

Request:
```json
{
  "date": "2025-01-20",
  "text": "",
  "motif": "Douleur abdominale",
  "exam": "Sensibilité en FID",
  "diagnosis": "Suspicion d'appendicite",
  "plan": "Échographie en urgence",
  "icd": [ { "code": "K37", "label": "Appendicite, sans précision" } ]
}
```

Response: 201 Created — the new note

> Audit: *“Consultation enregistrée — {patientName}”*.


#### `PATCH /api/patients/{patientId}/notes/{noteId}` 🔴
Edit an existing note / consultation  
**Auth:** medecin (author or admin) · **Source:** `editing an existing note/consultation`

Request:
```json
{ "plan": "IPP 8 semaines", "version": 2 }
```

Response: Updated note.

> Audit: *“Consultation modifiée — {patientName}”*.


#### `POST /api/patients/{patientId}/notes/{noteId}/attachments`
Upload a file attachment to a note  
**Auth:** medecin · **Source:** `PatientDrawer.tsx attachment upload (drag/drop or file picker, currently base64)`

Request: multipart/form-data, field: file

Response:
```json
{ "id": "att-2", "name": "scanner.jpg", "type": "image/jpeg", "url": "/files/att-2" }
```


#### `DELETE /api/patients/{patientId}/notes/{noteId}/attachments/{attachmentId}` 🔴
Remove a note attachment  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:658-667`

Response: 204 No Content

> Audit: *“Fichier supprimé — {fileName}”*.


#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### `GET /api/certificates`
List certificates (monthly register, per patient)  
**Auth:** medecin · **Source:** `certificats.tsx:74 (monthly register), historique.$id.tsx:76, PatientDrawer.tsx:107`

Request: Query: ?patientId=&month=2025-01

Response:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```


#### `POST /api/certificates` 🔴
Issue a certificate  
**Auth:** medecin · **Source:** `certificats.tsx:159-179 (create)`

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```

Response: 201 Created — documentDate/endDate/createdAt computed server-side (endDate = startDate + days)

> Audit: *“Certificat créé — {type}, {patientName}”*.


#### `POST /api/certificates/{id}/duplicate` 🔴
Duplicate an existing certificate  
**Auth:** medecin · **Source:** `certificats.tsx:181-191 (duplicate)`

Request:
```json
{ }
```

Response: 201 Created — same patientId/type/text, documentDate/createdAt reset to now

> Audit: *“Certificat dupliqué — {type}, {patientName}”*.


#### `GET /api/certificates/{id}/pdf` _(planned)_
Download a server-rendered PDF  
**Auth:** medecin · **Source:** `planned — HOPE-CERT-03 (prototype prints via the browser instead)`

Response: 200 OK, Content-Type: application/pdf


#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### `GET /api/referrals`
List referral letters  
**Auth:** medecin · **Source:** `orientations.tsx list`

Request: Query: ?patientId=

Response:
```json
{
  "content": [
    { "id": "ref-1", "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "documentDate": "2025-01-15", "text": "...", "createdAt": "2025-01-15T00:00:00Z" }
  ]
}
```


#### `POST /api/referrals` 🔴
Create a referral letter  
**Auth:** medecin · **Source:** `orientations.tsx:86-98 (save)`

Request:
```json
{ "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "text": "Cher confrère, ..." }
```

Response: 201 Created

> Audit: *“Courrier d'orientation créé — {patientName} → {specialty}”*.


#### `POST /api/referrals/{id}/email` _(planned)_
Email the referral letter (PDF) to the colleague  
**Auth:** medecin · **Source:** `planned — HOPE-ORI-03, not in prototype`

Request:
```json
{ } (uses contactId's email)
```

Response: 202 Accepted



---

### HOPE-CONS-01 — Versioned interview-grid reference data in the database (initial GI grid)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 48 | 20 | todo | consultation, gi-interview, backend, frontend, s4 |

Move gi-interview.ts (red flags, 9 groups, pain/bowel sub-fields, medical history, habits) into symptom_grid.definition JSONB, with a version.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Consultation — DiagnosticModal.tsx + GiInterviewForm.tsx
- **Depends on:** `HOPE-FND-03`

**Subtasks**

1. symptom_grid table + HGE grid migration
2. GET /symptom-grids/HGE
3. Render GiInterviewForm from JSON

**Acceptance criteria**

- GET /symptom-grids/HGE returns the current grid
- The front end renders the grid from JSON, with no hard-coded lists
- Test: the rendered grid is identical to the prototype

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Grid content still hard-coded in gi-interview.ts

**Test scenarios**

- Rendered grid lists the same groups and items as the prototype

*Hope V1 · Sprint 4 — Patient record & interview grid · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CONS-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### `GET /api/reference/icd10`
Search the ICD-10 subset  
**Auth:** session · **Source:** `icd10.ts:62 (searchIcd)`

Request: Query: ?q=reflux&limit=8

Response:
```json
{ "content": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ] }
```


#### `GET /api/reference/gi-interview`
Get the structured GI interview grid  
**Auth:** medecin · **Source:** `gi-interview.ts (RED_FLAGS, SYMPTOM_GROUPS, EXTENDABLE_GROUPS, LOCALISATIONS, CARACTERISTIQUES, IRRADIATIONS, RELATIONS_REPAS, FACTEURS_AGGRAVANTS, FACTEURS_SOULAGEANTS, DEBUTS, EVOLUTIONS, BRISTOL, ATCD_*, PARENTES)`

Response:
```json
{
  "redFlags": [ { "id": "Dysphagie / odynophagie", "label": "Dysphagie / odynophagie" } ],
  "symptomGroups": [ { "id": "douleur", "title": "Douleur abdominale", "items": [ { "id": "Épigastralgie", "label": "Épigastralgie" } ] } ],
  "extendableGroups": [ { "id": "flags", "title": "Red flags" } ],
  "localisations": ["Épigastre", "HCD", "..."],
  "caracteristiques": ["Brûlure", "..."],
  "bristol": ["1", "2", "3", "4", "5", "6", "7"],
  "atcdMed": [ { "id": "HTA", "label": "HTA" } ]
}
```

> Merged server-side with the current doctor's customSymptomGroups. HOPE-CONS-01/HOPE-V2-10 note this should become versioned, specialty-selectable, database-backed content rather than a single hardcoded response.


#### `GET /api/reference/drug-classes`
List therapeutic drug classes  
**Auth:** medecin · **Source:** `types.ts:242 (DRUG_CLASSES)`

Response:
```json
{ "content": ["Antalgique", "AINS", "Antibiotique", "..."] }
```


#### `GET /api/reference/certificate-types`
List built-in certificate types  
**Auth:** medecin · **Source:** `types.ts:132 (BUILTIN_CERTIFICATE_TYPES)`

Response:
```json
{ "content": ["Arrêt de travail", "Aptitude sportive", "Certificat scolaire", "..."] }
```

> Merges with Settings.certificateTemplates (§13) for the full picker list.


#### `GET /api/reference/contact-kinds`
List built-in contact kinds  
**Auth:** session · **Source:** `types.ts:194 (CONTACT_KINDS)`

Response:
```json
{ "content": ["Confrère", "Laboratoire", "Fournisseur", "Autre"] }
```



---

### HOPE-DOC-01 — File storage service (MinIO/S3): upload, signed URL, delete

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 49 | 12 | todo | documents, pdf, backend, spring, s4 |

File storage service on MinIO/S3 used for attachments, photos and generated PDFs, with private buckets and short-lived signed URLs.

- **Folder:** `hope-api/`
- **Prototype reference:** Print templates in ordonnances / certificats / PatientDrawer / personnel
- **Depends on:** `HOPE-FND-05`

**Subtasks**

1. Upload endpoint with MIME sniffing and size limit
2. Signed URL generation
3. Delete + SHA-256 fingerprint

**Acceptance criteria**

- Private bucket
- Signed URL valid for 5 min
- Real MIME type and size checked
- SHA-256 fingerprint stored

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Public bucket or permanent file URLs

**Test scenarios**

- Signed URL stops working after 5 minutes

*Hope V1 · Sprint 4 — Patient record & interview grid · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOC-01 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> ⚠️ OUT OF SCOPE: documents/object-storage are explicitly excluded from both the Data Model and API Endpoints appendices in this document (see their scope notes). This ticket is exactly what would bring CabinetDocument and its endpoints back into scope — re-derive both from src/lib/cabinet/types.ts (CabinetDocument) before starting.


---

### Consultation, PDF, prescriptions (`s5`)

<a id="consultation-pdf-prescriptions-s5"></a>

### HOPE-DOS-07 — Full patient record PDF export (generated server-side)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 57 | 12 | todo | patient-record, backend, frontend, s5 |

Replaces the prototype's window.open + document.write.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Patient record drawer /patients?p=… — src/components/cabinet/PatientDrawer.tsx
- **Depends on:** `HOPE-DOC-02`, `HOPE-DOS-04`

**Subtasks**

1. Record PDF template (port of exportPdf HTML)
2. GET /patients/{id}/record.pdf
3. Replace window.open/document.write

**Acceptance criteria**

- A4 PDF with practitioner header, identity, consultations, notes, lab results, certificates, prescriptions
- Export is audited

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Export a record — A4 PDF with all sections; audit entry created

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOS-07 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

#### `GET /api/certificates`
List certificates (monthly register, per patient)  
**Auth:** medecin · **Source:** `certificats.tsx:74 (monthly register), historique.$id.tsx:76, PatientDrawer.tsx:107`

Request: Query: ?patientId=&month=2025-01

Response:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```


#### `POST /api/certificates` 🔴
Issue a certificate  
**Auth:** medecin · **Source:** `certificats.tsx:159-179 (create)`

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```

Response: 201 Created — documentDate/endDate/createdAt computed server-side (endDate = startDate + days)

> Audit: *“Certificat créé — {type}, {patientName}”*.


#### `POST /api/certificates/{id}/duplicate` 🔴
Duplicate an existing certificate  
**Auth:** medecin · **Source:** `certificats.tsx:181-191 (duplicate)`

Request:
```json
{ }
```

Response: 201 Created — same patientId/type/text, documentDate/createdAt reset to now

> Audit: *“Certificat dupliqué — {type}, {patientName}”*.


#### `GET /api/certificates/{id}/pdf` _(planned)_
Download a server-rendered PDF  
**Auth:** medecin · **Source:** `planned — HOPE-CERT-03 (prototype prints via the browser instead)`

Response: 200 OK, Content-Type: application/pdf


#### Reference notes

> 'Full patient record PDF export' is not itself a documented endpoint below — only certificate PDF export is (GET /api/certificates/{id}/pdf, planned). This ticket also depends on HOPE-DOC-02 (PDF pipeline, partially out of scope — see DOC-02 below).


---

### HOPE-CONS-02 — Save structured answers (JSON) and restore the grid when reopening

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 51 | 20 | todo | consultation, gi-interview, backend, frontend, bugfix, s5 |

Fixes B8: the prototype only keeps the generated text and can only append to it.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Consultation — DiagnosticModal.tsx + GiInterviewForm.tsx
- **Depends on:** `HOPE-CONS-01`

**Subtasks**

1. answers JSONB in consultation_version
2. Serialize/restore form state
3. Keep ad-hoc options added during the interview

**Acceptance criteria**

- Reopening a draft restores every checkbox, pain score (VAS), Bristol scale, onset, course, habits
- Options added during the interview are kept

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Tick items, set VAS 7 and Bristol 4, save draft, reopen — everything restored

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 5 pts. Fixes prototype issue(s) B8 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CONS-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### Reference notes

> Confirmed: GiInterviewForm's props are only `{ onChange, customGroups }` — no initialValue/existing-content prop exists, so the checkbox/field grid always starts blank on reopen. DiagnosticModal.tsx re-editing an existing draft keeps `existing.content` as a frozen text block and simply appends any NEWLY picked structured text after it (`finalContent()` joins existing.content + structured + notes) — it doesn't parse prior answers back into checked boxes. 'Restore the grid when reopening' is genuinely new work: today reopening a draft means re-answering the grid from scratch and stacking the result onto the old text.


---

### HOPE-CONS-03 — Server-side report generation (port of buildText) + equality tests

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 53 | 12 | todo | consultation, gi-interview, backend, spring, s5 |

Generate the consultation report text on the server from the saved answers, reproducing the prototype's buildText() output exactly.

- **Folder:** `hope-api/`
- **Prototype reference:** Consultation — DiagnosticModal.tsx + GiInterviewForm.tsx
- **Depends on:** `HOPE-CONS-02`

**Subtasks**

1. Port buildText() to the server
2. 10 golden-file tests against prototype output

**Acceptance criteria**

- Red flags first, prefixed with 🚨
- Tests: for 10 answer sets, the text is identical to the prototype's
- Display through DiagnosticReportView kept

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Report text built in the browser and trusted by the server

**Test scenarios**

- Red flag ticked — report starts with the 🚨 line

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CONS-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### Reference notes

> Server-side port of parseReport()/report building — see the Data Model appendix §6 (Cross-cutting derived logic) for the exact function this replaces.


---

### HOPE-CONS-04 — Draft → Finished lifecycle, versions after closing

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 53 | 12 | todo | consultation, gi-interview, backend, spring, s5 |

Consultations move from Draft to Finished. A finished consultation is locked; any later change creates a new version with author and date.

- **Folder:** `hope-api/`
- **Prototype reference:** Consultation — DiagnosticModal.tsx + GiInterviewForm.tsx
- **Depends on:** `HOPE-CONS-02`

**Subtasks**

1. Status transition endpoint
2. Version creation on edit after finish
3. Versions list endpoint

**Acceptance criteria**

- Finished = locked; 'Edit' creates version n+1
- Version list with author and date
- Audit on every status change

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Finish, then edit — version 2 created, version 1 unchanged

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CONS-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### Reference notes

> Confirmed: the prototype has NO versioning after closing today — Diagnostic has no versions field, and DiagnosticModal.tsx's persist() just overwrites content/status/updatedAt in place even after status is already "termine", with only a generic AuditEntry summary ("Consultation mise à jour") as a trail. This ticket builds version snapshots from scratch, not a fix to an existing (broken) mechanism.


---

### HOPE-CONS-06 — Consultation screen wired (DiagnosticModal + GiInterviewForm)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 54 | 20 | todo | consultation, gi-interview, frontend, react, s5 |

Split GiInterviewForm (586 lines): one component per section type.

- **Folder:** `src/`
- **Prototype reference:** Consultation — DiagnosticModal.tsx + GiInterviewForm.tsx
- **Depends on:** `HOPE-CONS-02`, `HOPE-CONS-03`, `HOPE-CONS-04`

**Subtasks**

1. Split GiInterviewForm per section type
2. Autosave every 30 s and on close
3. Unsaved-changes warning

**Acceptance criteria**

- Draft auto-saved every 30 s and on close
- Warning when closing with unsaved changes
- Header: identity, age, sex, allergies

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Close with unsaved changes — warning shown
- Wait 30 s — draft saved

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 5 pts. French version: CONS-06 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.



---

### HOPE-CONS-07 — Link a consultation to an appointment; finishing it offers to close the appointment

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 56 | 8 | todo | consultation, gi-interview, backend, frontend, s5 |

Attach a consultation to the appointment it comes from; finishing the consultation offers to mark that appointment as done.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Consultation — DiagnosticModal.tsx + GiInterviewForm.tsx
- **Depends on:** `HOPE-CONS-04`, `HOPE-SAL-02`

**Subtasks**

1. appointment_id on consultation
2. Prompt on finish

**Acceptance criteria**

- Consultation stores its appointment id
- Finishing prompts 'Mark appointment as done?'
- Accepting sets the appointment to DONE

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Start consultation from today's appointment, finish — appointment shows Done

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P2 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CONS-07 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> Confirmed: Diagnostic has no appointmentId (or any FK to Appointment at all) in the current type, and DiagnosticModal.tsx has no appointment-linking logic. This ticket adds the relation from scratch, including the 'offer to close the appointment' UX, which also doesn't exist today.


---

### HOPE-DOC-02 — PDF generation from HTML templates + immutable archiving

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 56 | 20 | todo | documents, pdf, backend, spring, s5 |

Port the prototype's templates (A4 prescription sheet with caduceus, certificate, letter, record, staff sheet). generated_document table.

- **Folder:** `hope-api/`
- **Prototype reference:** Print templates in ordonnances / certificats / PatientDrawer / personnel
- **Depends on:** `HOPE-DOC-01`

**Subtasks**

1. Port HTML templates (prescription, certificate, letter, record, staff sheet)
2. HTML → PDF engine
3. generated_document archive with hash

**Acceptance criteria**

- Output matches the prototype previews (visual review signed off by the doctor)
- PDF archived + SHA-256; reprinting returns the same file
- Generation < 3 s

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- PDF regenerated differently on reprint

**Test scenarios**

- Issue a prescription, reprint — byte-identical file

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOC-02 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

#### `GET /api/certificates`
List certificates (monthly register, per patient)  
**Auth:** medecin · **Source:** `certificats.tsx:74 (monthly register), historique.$id.tsx:76, PatientDrawer.tsx:107`

Request: Query: ?patientId=&month=2025-01

Response:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```


#### `POST /api/certificates` 🔴
Issue a certificate  
**Auth:** medecin · **Source:** `certificats.tsx:159-179 (create)`

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```

Response: 201 Created — documentDate/endDate/createdAt computed server-side (endDate = startDate + days)

> Audit: *“Certificat créé — {type}, {patientName}”*.


#### `POST /api/certificates/{id}/duplicate` 🔴
Duplicate an existing certificate  
**Auth:** medecin · **Source:** `certificats.tsx:181-191 (duplicate)`

Request:
```json
{ }
```

Response: 201 Created — same patientId/type/text, documentDate/createdAt reset to now

> Audit: *“Certificat dupliqué — {type}, {patientName}”*.


#### `GET /api/certificates/{id}/pdf` _(planned)_
Download a server-rendered PDF  
**Auth:** medecin · **Source:** `planned — HOPE-CERT-03 (prototype prints via the browser instead)`

Response: 200 OK, Content-Type: application/pdf


#### Reference notes

> ⚠️ PARTIALLY OUT OF SCOPE: the general PDF-generation pipeline (beyond certificates) is not documented in the API Endpoints appendix. Only GET /api/certificates/{id}/pdf (planned) exists there today — this ticket is what generalizes PDF rendering to every document type.

> Confirmed: 'immutable archiving' is entirely new. All three print flows today (certificats.tsx, ordonnances.tsx, orientations.tsx) just call window.print() against live current data (window.setTimeout(() => window.print(), ~350-400ms) after rendering) — nothing is snapshotted or stored. If Settings or the underlying record later changes, there is no frozen copy of what was actually printed/handed to the patient.


---

### HOPE-ORD-01 — Prescriptions API: issue with structured lines, renewal, patient history

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 58 | 20 | todo | prescriptions, backend, spring, s5 |

Prescriptions API storing each line as structured data (drug, form, dosage, duration, route), issuing an immutable prescription and supporting renewal from a previous one.

- **Folder:** `hope-api/`
- **Prototype reference:** /ordonnances — src/routes/ordonnances.tsx
- **Depends on:** `HOPE-DOS-01`

**Subtasks**

1. prescription + prescription_line tables
2. Issue endpoint (locks the prescription)
3. Renewal link and patient history

**Acceptance criteria**

- Issued prescription is immutable
- renewed_from set on renewal
- Audited

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- Editing an issued prescription in place

**Test scenarios**

- Renew a prescription — new one references the old one

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: ORD-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Favorite`** _(embedded)_ — Quick-add prescription line — embedded in Settings.favorites[]  
📄 Source: `types.ts:263`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `label` | `string` | ✅ | Drug name + dosage, e.g. "Paracétamol 1 g" |
| `form` | `string` | optional | Comprimé, gélule, sachet, sirop, inhalateur… |
| `posology` | `string` | ✅ | e.g. "1 cp x 3/j" |
| `duration` | `string` | optional | e.g. "5 jours" |
| `route` | `string` | optional | Orale, cutanée, inhalée… |
| `note` | `string` | optional | e.g. "au milieu du repas" |
| `drugClass` | `string` | optional | One of DRUG_CLASSES (§5.3) or free text |
| `uses` | `number` | optional | Usage counter, powers "most used" sort |

> `renderFavorite()` (`prescriptions.ts:25`) turns a Favorite into one prescription text line: `label (form) - posology, duration - note`. `parseLegacyFavorite()` handles the reverse for migrating old plain-string favorites.

**`Protocol`** _(embedded)_ — Prescription template — embedded in Settings.protocols[]  
📄 Source: `types.ts:276`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `name` | `string` | ✅ | e.g. "Angine bactérienne (adulte)" |
| `category` | `string` | optional |  |
| `note` | `string` | optional |  |
| `lines` | `string[]` | ✅ | Ready-to-insert prescription lines for a common situation |

#### API endpoints used by this ticket

#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.



---

### HOPE-ORD-02 — Conflict checks: allergies (including cross-allergies) and duplicates with chronic treatments

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 59 | 12 | todo | prescriptions, backend, spring, s5 |

Port lineConflicts() and the cross-allergy table (penicillins, sulfonamides, aspirin, iodine) to the server. POST /prescriptions/check called while typing.

- **Folder:** `hope-api/`
- **Prototype reference:** /ordonnances — src/routes/ordonnances.tsx
- **Depends on:** `HOPE-ORD-01`, `HOPE-DOS-02`

**Subtasks**

1. Port lineConflicts() and cross-allergy table
2. POST /prescriptions/check
3. Logged override on allergy conflict

**Acceptance criteria**

- Same alerts as the prototype (tests reuse its cases)
- Issuing despite an allergy conflict requires explicit, logged confirmation

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Patient allergic to penicillin + 'Amoxicilline 1 g' → allergy alert

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: ORD-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```



---

### HOPE-ORD-04 — Prescriptions screen wired, server PDF, default city = practice city

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 60 | 12 | todo | prescriptions, frontend, react, bugfix, s5 |

Fixes B5 (hard-coded 'Sousse'). Replace window.print() with the archived PDF.

- **Folder:** `src/`
- **Prototype reference:** /ordonnances — src/routes/ordonnances.tsx
- **Depends on:** `HOPE-ORD-01`, `HOPE-ORD-02`, `HOPE-DOC-02`

**Subtasks**

1. Wire editor to ORD-01/02
2. Issue and print via DOC-02
3. Default city from practice profile

**Acceptance criteria**

- A4 preview kept
- 'Issue and print' button produces the PDF
- 'Current treatments — renew' section kept

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Issue a prescription — PDF opens and is archived in the record

*Hope V1 · Sprint 5 — Consultation, PDF, prescriptions · P0 · 3 pts. Fixes prototype issue(s) B5 (specification §7). French version: ORD-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

#### API endpoints used by this ticket

#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### Reference notes

> Confirmed: ordonnances.tsx:36 hardcodes `useState("Sousse")` for the printed city — it happens to match the seeded Settings.address ("Avenue Habib Bourguiba, Sousse") by coincidence, but is never actually derived from Settings.address, so it would print the wrong city for any other practice. This is exactly what 'default city = practice city' in this ticket's name must fix.


---

### Certificates, referrals, directory, lab results (`s6`)

<a id="certificates-referrals-directory-lab-results-s6"></a>

### HOPE-DOS-06 — Lab results: display panels and trend chart per marker

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 61 | 20 | todo | patient-record, backend, frontend, s6 |

Replaces the simulated OCR reading (hard-coded values) with real stored results. Chart for any marker, not only blood glucose. No manual panel entry (removed in the prototype, commit eed2963).

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Patient record drawer /patients?p=… — src/components/cabinet/PatientDrawer.tsx
- **Depends on:** `HOPE-DOS-01`

**Subtasks**

1. Lab result + values API
2. Marker picker and chart with reference lines
3. Remove simulated OCR drop zone

**Acceptance criteria**

- Results shown per panel: date, marker, value, unit, min/max reference
- Marker picker, reference line, out-of-range points in red
- The simulated 'drop a file' area is removed
- No manual lab-entry form

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Hard-coded marker values or fake extraction

**Test scenarios**

- Record with two stored panels — chart shows both points, out-of-range in red

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P1 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOS-06 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> ⚠️ OUT OF SCOPE: lab results / Analysis are explicitly excluded from both appendices (see their scope notes). Re-derive the Analysis/AnalysisValue entities and any lab-result endpoints from src/lib/cabinet/types.ts and tracking.ts before starting this ticket.


---

### HOPE-CONS-05 — Custom symptom groups per doctor (new group, extend a built-in group)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 62 | 12 | todo | consultation, gi-interview, backend, frontend, s6 |

Port the 'Structured interview — my groups' card from Settings.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Consultation — DiagnosticModal.tsx + GiInterviewForm.tsx
- **Depends on:** `HOPE-CONS-01`

**Subtasks**

1. Custom group API per doctor
2. Settings card wired
3. Merge custom items into the grid

**Acceptance criteria**

- Visible only to the owning doctor
- Extending a built-in group creates no duplicates

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Doctor A adds a group — doctor B does not see it

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CONS-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `GET /api/patients/{patientId}/diagnostics`
List a patient's free-form interviews  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:23-24`

Response:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```


#### `POST /api/patients/{patientId}/diagnostics` 🔴
Create an interview (draft)  
**Auth:** medecin · **Source:** `DiagnosticModal.tsx:72-90 (save, status “brouillon” on first save)`

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```

Response: 201 Created

> Audit: *“Entretien créé — {patientName}”*.


#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
Update / finalize an interview  
**Auth:** medecin (author) · **Source:** `DiagnosticModal.tsx re-save while editing / finalizing`

Request:
```json
{ "content": "...", "status": "termine", "version": 2 }
```

Response: Updated diagnostic; updatedAt bumped server-side.

> Audit: *“Entretien terminé — {patientName}”* when status → termine, else *“Entretien modifié — {patientName}”*.


#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### Reference notes

> Custom symptom groups are Doctor.customSymptomGroups (embedded) — see POST/DELETE /api/staff/me/symptom-groups below.


---

### HOPE-ORD-03 — Favourite drugs and prescription templates per doctor (CRUD + usage counter)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 63 | 12 | todo | prescriptions, backend, frontend, s6 |

Each doctor keeps favourite drugs and prescription templates, inserts them in one click and sees the most used first.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /ordonnances — src/routes/ordonnances.tsx
- **Depends on:** `HOPE-ORD-01`

**Subtasks**

1. Favourites and templates API per doctor
2. Usage counter
3. Wire chips in the editor and Settings

**Acceptance criteria**

- Favourites grouped by drug class, sorted by usage
- 'Add last line to favourites'
- Insert a prescription template in one click

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Use a favourite 3 times — it moves to the top of its class

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: ORD-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Favorite`** _(embedded)_ — Quick-add prescription line — embedded in Settings.favorites[]  
📄 Source: `types.ts:263`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `label` | `string` | ✅ | Drug name + dosage, e.g. "Paracétamol 1 g" |
| `form` | `string` | optional | Comprimé, gélule, sachet, sirop, inhalateur… |
| `posology` | `string` | ✅ | e.g. "1 cp x 3/j" |
| `duration` | `string` | optional | e.g. "5 jours" |
| `route` | `string` | optional | Orale, cutanée, inhalée… |
| `note` | `string` | optional | e.g. "au milieu du repas" |
| `drugClass` | `string` | optional | One of DRUG_CLASSES (§5.3) or free text |
| `uses` | `number` | optional | Usage counter, powers "most used" sort |

> `renderFavorite()` (`prescriptions.ts:25`) turns a Favorite into one prescription text line: `label (form) - posology, duration - note`. `parseLegacyFavorite()` handles the reverse for migrating old plain-string favorites.

**`Protocol`** _(embedded)_ — Prescription template — embedded in Settings.protocols[]  
📄 Source: `types.ts:276`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `name` | `string` | ✅ | e.g. "Angine bactérienne (adulte)" |
| `category` | `string` | optional |  |
| `note` | `string` | optional |  |
| `lines` | `string[]` | ✅ | Ready-to-insert prescription lines for a common situation |

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.



---

### HOPE-CERT-01 — Certificates API + templates (built-in and custom) with variables

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 64 | 20 | todo | certificates, backend, spring, s6 |

Variables {{patient.nom}}, {{patient.naissance}}, {{medecin.nom}}, {{date}}, {{debut}}, {{fin}}, {{jours}}.

- **Folder:** `hope-api/`
- **Prototype reference:** /certificats — src/routes/certificats.tsx
- **Depends on:** `HOPE-DOS-01`

**Subtasks**

1. Templates table with 5 built-ins
2. Variable substitution
3. Preview endpoint

**Acceptance criteria**

- 5 built-in templates loaded by migration
- Custom templates: create, edit, delete
- Server preview via POST /certificates/preview

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Template with {{patient.nom}} → preview shows the patient's name

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P0 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CERT-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Certificate`** _(table)_ — Issued certificate (sick leave, sport fitness, etc.)  
📄 Source: `types.ts:146`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `type` | `string` | ✅ | One of BUILTIN_CERTIFICATE_TYPES (§5.4) or a custom CertificateTemplate.type |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from startDate + days |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/certificats.tsx` (monthly register, print/duplicate).

**`CertificateTemplate`** _(embedded)_ — Embedded in Settings.certificateTemplates[]  
📄 Source: `types.ts:141`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `string` | ✅ |  |
| `text` | `string` | ✅ |  |

#### API endpoints used by this ticket

#### `GET /api/certificates`
List certificates (monthly register, per patient)  
**Auth:** medecin · **Source:** `certificats.tsx:74 (monthly register), historique.$id.tsx:76, PatientDrawer.tsx:107`

Request: Query: ?patientId=&month=2025-01

Response:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```


#### `POST /api/certificates` 🔴
Issue a certificate  
**Auth:** medecin · **Source:** `certificats.tsx:159-179 (create)`

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```

Response: 201 Created — documentDate/endDate/createdAt computed server-side (endDate = startDate + days)

> Audit: *“Certificat créé — {type}, {patientName}”*.


#### `POST /api/certificates/{id}/duplicate` 🔴
Duplicate an existing certificate  
**Auth:** medecin · **Source:** `certificats.tsx:181-191 (duplicate)`

Request:
```json
{ }
```

Response: 201 Created — same patientId/type/text, documentDate/createdAt reset to now

> Audit: *“Certificat dupliqué — {type}, {patientName}”*.


#### `GET /api/certificates/{id}/pdf` _(planned)_
Download a server-rendered PDF  
**Auth:** medecin · **Source:** `planned — HOPE-CERT-03 (prototype prints via the browser instead)`

Response: 200 OK, Content-Type: application/pdf


#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.



---

### HOPE-CERT-02 — Sick leave: end-date calculation, serial number

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 65 | 8 | todo | certificates, backend, spring, s6 |

Sick-leave certificates compute the end date from start date and number of days, and every certificate gets a unique serial number.

- **Folder:** `hope-api/`
- **Prototype reference:** /certificats — src/routes/certificats.tsx
- **Depends on:** `HOPE-CERT-01`

**Subtasks**

1. End-date calculation
2. Serial number sequence per practice and year

**Acceptance criteria**

- end = start + days (tested across month and year boundaries)
- Serial number unique per practice and year

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Start 29/12, 5 days → end 03/01 next year

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P0 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: CERT-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Certificate`** _(table)_ — Issued certificate (sick leave, sport fitness, etc.)  
📄 Source: `types.ts:146`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `type` | `string` | ✅ | One of BUILTIN_CERTIFICATE_TYPES (§5.4) or a custom CertificateTemplate.type |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from startDate + days |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/certificats.tsx` (monthly register, print/duplicate).

#### API endpoints used by this ticket

#### `GET /api/certificates`
List certificates (monthly register, per patient)  
**Auth:** medecin · **Source:** `certificats.tsx:74 (monthly register), historique.$id.tsx:76, PatientDrawer.tsx:107`

Request: Query: ?patientId=&month=2025-01

Response:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```


#### `POST /api/certificates` 🔴
Issue a certificate  
**Auth:** medecin · **Source:** `certificats.tsx:159-179 (create)`

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```

Response: 201 Created — documentDate/endDate/createdAt computed server-side (endDate = startDate + days)

> Audit: *“Certificat créé — {type}, {patientName}”*.


#### `POST /api/certificates/{id}/duplicate` 🔴
Duplicate an existing certificate  
**Auth:** medecin · **Source:** `certificats.tsx:181-191 (duplicate)`

Request:
```json
{ }
```

Response: 201 Created — same patientId/type/text, documentDate/createdAt reset to now

> Audit: *“Certificat dupliqué — {type}, {patientName}”*.


#### `GET /api/certificates/{id}/pdf` _(planned)_
Download a server-rendered PDF  
**Auth:** medecin · **Source:** `planned — HOPE-CERT-03 (prototype prints via the browser instead)`

Response: 200 OK, Content-Type: application/pdf


#### Reference notes

> End-date calculation already works client-side (certificats.tsx:77, startDate + days) and Certificate.endDate already exists — that half is a straight port. The 'serial number' half is genuinely missing: the only per-document identifier printed today is the doctor's static licenseNumber ("N° d'ordre"), not a real per-certificate incrementing serial — there is no such field anywhere in the Certificate type.


---

### HOPE-CERT-03 — Certificates screen wired: monthly register, detail, duplicate, PDF

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 66 | 12 | todo | certificates, frontend, react, bugfix, s6 |

Fixes B12 (document date forced to today) and B5 (hard-coded 'Sousse').

- **Folder:** `src/`
- **Prototype reference:** /certificats — src/routes/certificats.tsx
- **Depends on:** `HOPE-CERT-01`, `HOPE-DOC-02`

**Subtasks**

1. Wire templates, register and detail
2. Respect chosen document date
3. PDF via DOC-02

**Acceptance criteria**

- The chosen document date is respected
- Place = practice city
- Archived PDF; 'Duplicate / Renew' kept

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Pick yesterday as document date — PDF and register show yesterday

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P0 · 3 pts. Fixes prototype issue(s) B5, B12 (specification §7). French version: CERT-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Certificate`** _(table)_ — Issued certificate (sick leave, sport fitness, etc.)  
📄 Source: `types.ts:146`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `type` | `string` | ✅ | One of BUILTIN_CERTIFICATE_TYPES (§5.4) or a custom CertificateTemplate.type |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from startDate + days |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/certificats.tsx` (monthly register, print/duplicate).

#### API endpoints used by this ticket

#### `GET /api/certificates`
List certificates (monthly register, per patient)  
**Auth:** medecin · **Source:** `certificats.tsx:74 (monthly register), historique.$id.tsx:76, PatientDrawer.tsx:107`

Request: Query: ?patientId=&month=2025-01

Response:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```


#### `POST /api/certificates` 🔴
Issue a certificate  
**Auth:** medecin · **Source:** `certificats.tsx:159-179 (create)`

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```

Response: 201 Created — documentDate/endDate/createdAt computed server-side (endDate = startDate + days)

> Audit: *“Certificat créé — {type}, {patientName}”*.


#### `POST /api/certificates/{id}/duplicate` 🔴
Duplicate an existing certificate  
**Auth:** medecin · **Source:** `certificats.tsx:181-191 (duplicate)`

Request:
```json
{ }
```

Response: 201 Created — same patientId/type/text, documentDate/createdAt reset to now

> Audit: *“Certificat dupliqué — {type}, {patientName}”*.


#### `GET /api/certificates/{id}/pdf` _(planned)_
Download a server-rendered PDF  
**Auth:** medecin · **Source:** `planned — HOPE-CERT-03 (prototype prints via the browser instead)`

Response: 200 OK, Content-Type: application/pdf


#### Reference notes

> Confirmed: the printed city is hardcoded to the literal string "Sousse" in THREE places in certificats.tsx (the print HTML template, the on-screen preview, and the detail modal) — none of them read data.settings.address, even though the very next line in the same template uses s.doctorName/s.address for other fields. Same class of bug as HOPE-ORD-04 (prescriptions) and HOPE-ORI-02 (referrals) below — all three need to derive the city from practice settings instead.


---

### HOPE-ORI-01 — Referrals API: preview, issue, editable text, link to contact

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 70 | 12 | todo | referrals, backend, spring, s6 |

Referral letters to a colleague: pre-filled text with history and allergies, editable before issuing, linked to a directory contact, archived as PDF.

- **Folder:** `hope-api/`
- **Prototype reference:** /orientations — src/routes/orientations.tsx
- **Depends on:** `HOPE-DOS-01`, `HOPE-ANN-01`

**Subtasks**

1. Referral entity + preview
2. Issue with PDF
3. Link to contact

**Acceptance criteria**

- Text pre-filled (history, allergies) and editable before issuing
- Archived PDF

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Preview includes the patient's allergies

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: ORI-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Referral`** _(table)_ — Letter to a specialist  
📄 Source: `types.ts:159`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → Contact.id (recipient) |
| `reason` | `string` | ✅ |  |
| `documentDate` | `string` | ✅ |  |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/orientations.tsx`.

**`Contact`** _(table)_ — Address book entry — colleague, lab, supplier  
📄 Source: `types.ts:197`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `string` | ✅ | One of CONTACT_KINDS (§5.5) or free text |
| `specialty` | `string` | optional |  |
| `phone` | `string` | optional |  |
| `email` | `string` | optional |  |
| `address` | `string` | optional |  |
| `notes` | `string` | optional |  |

Used in: `routes/annuaire.tsx`, referenced by Referral.contactId.

#### API endpoints used by this ticket

#### `GET /api/referrals`
List referral letters  
**Auth:** medecin · **Source:** `orientations.tsx list`

Request: Query: ?patientId=

Response:
```json
{
  "content": [
    { "id": "ref-1", "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "documentDate": "2025-01-15", "text": "...", "createdAt": "2025-01-15T00:00:00Z" }
  ]
}
```


#### `POST /api/referrals` 🔴
Create a referral letter  
**Auth:** medecin · **Source:** `orientations.tsx:86-98 (save)`

Request:
```json
{ "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "text": "Cher confrère, ..." }
```

Response: 201 Created

> Audit: *“Courrier d'orientation créé — {patientName} → {specialty}”*.


#### `POST /api/referrals/{id}/email` _(planned)_
Email the referral letter (PDF) to the colleague  
**Auth:** medecin · **Source:** `planned — HOPE-ORI-03, not in prototype`

Request:
```json
{ } (uses contactId's email)
```

Response: 202 Accepted


#### `GET /api/contacts`
List / search the address book  
**Auth:** session · **Source:** `annuaire.tsx:94,101, orientations.tsx:60-61,260 (picking a recipient)`

Request: Query: ?kind=&q=

Response:
```json
{
  "content": [
    { "id": "ctc-1", "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis", "notes": null }
  ]
}
```


#### `POST /api/contacts` 🔴
Add a contact  
**Auth:** session · **Source:** `annuaire.tsx:151`

Request:
```json
{ "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis" }
```

Response: 201 Created

> Audit: *“Contact ajouté — {name}”*.


#### `PATCH /api/contacts/{id}` 🔴
Edit a contact  
**Auth:** session · **Source:** `annuaire.tsx edit form`

Request:
```json
{ "phone": "+216 71 111 222" }
```

Response: Updated contact.

> Audit: *“Contact modifié — {name}”*.


#### `DELETE /api/contacts/{id}` 🔴
Remove a contact  
**Auth:** session · **Source:** `annuaire.tsx:347`

Response: 204 No Content

> Audit: *“Contact supprimé — {name}”*.



---

### HOPE-ORI-02 — Referrals screen wired + access from the record + list by document date

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 71 | 12 | todo | referrals, frontend, react, bugfix, s6 |

Fixes B13.

- **Folder:** `src/`
- **Prototype reference:** /orientations — src/routes/orientations.tsx
- **Depends on:** `HOPE-ORI-01`, `HOPE-DOC-02`

**Subtasks**

1. Wire form and list
2. Entry point from the record
3. Sort by document date

**Acceptance criteria**

- 'New referral' button in the record (patient pre-selected)
- List sorted and shown by document date
- 'Reuse' action kept

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- From a record, 'New referral' opens with the patient selected

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P1 · 3 pts. Fixes prototype issue(s) B13 (specification §7). French version: ORI-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Referral`** _(table)_ — Letter to a specialist  
📄 Source: `types.ts:159`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → Contact.id (recipient) |
| `reason` | `string` | ✅ |  |
| `documentDate` | `string` | ✅ |  |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/orientations.tsx`.

#### API endpoints used by this ticket

#### `GET /api/referrals`
List referral letters  
**Auth:** medecin · **Source:** `orientations.tsx list`

Request: Query: ?patientId=

Response:
```json
{
  "content": [
    { "id": "ref-1", "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "documentDate": "2025-01-15", "text": "...", "createdAt": "2025-01-15T00:00:00Z" }
  ]
}
```


#### `POST /api/referrals` 🔴
Create a referral letter  
**Auth:** medecin · **Source:** `orientations.tsx:86-98 (save)`

Request:
```json
{ "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "text": "Cher confrère, ..." }
```

Response: 201 Created

> Audit: *“Courrier d'orientation créé — {patientName} → {specialty}”*.


#### `POST /api/referrals/{id}/email` _(planned)_
Email the referral letter (PDF) to the colleague  
**Auth:** medecin · **Source:** `planned — HOPE-ORI-03, not in prototype`

Request:
```json
{ } (uses contactId's email)
```

Response: 202 Accepted


#### Reference notes

> Confirmed: orientations.tsx:203 hardcodes the printed city to the literal string "Sousse" (`Sousse, le {fmtDate(...)}`) rather than reading data.settings.address. Same class of bug as HOPE-ORD-04 (prescriptions) and HOPE-CERT-03 (certificates).


---

### HOPE-ORI-03 — Email the referral letter to the colleague (PDF attached)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 71 | 8 | todo | referrals, backend, frontend, s6 |

Send the referral letter PDF by email to the colleague from the directory, after confirmation.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /orientations — src/routes/orientations.tsx
- **Depends on:** `HOPE-ORI-01`, `HOPE-NOT-01`

**Subtasks**

1. Email endpoint with PDF attachment
2. Confirmation dialog

**Acceptance criteria**

- Confirmation before sending
- emailed_at recorded and audited

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Send — email with PDF appears in Mailpit, emailed_at set

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P2 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: ORI-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Referral`** _(table)_ — Letter to a specialist  
📄 Source: `types.ts:159`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → Contact.id (recipient) |
| `reason` | `string` | ✅ |  |
| `documentDate` | `string` | ✅ |  |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string (ISO)` | ✅ |  |

Used in: `routes/orientations.tsx`.

**`Contact`** _(table)_ — Address book entry — colleague, lab, supplier  
📄 Source: `types.ts:197`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `string` | ✅ | One of CONTACT_KINDS (§5.5) or free text |
| `specialty` | `string` | optional |  |
| `phone` | `string` | optional |  |
| `email` | `string` | optional |  |
| `address` | `string` | optional |  |
| `notes` | `string` | optional |  |

Used in: `routes/annuaire.tsx`, referenced by Referral.contactId.

#### API endpoints used by this ticket

#### `GET /api/referrals`
List referral letters  
**Auth:** medecin · **Source:** `orientations.tsx list`

Request: Query: ?patientId=

Response:
```json
{
  "content": [
    { "id": "ref-1", "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "documentDate": "2025-01-15", "text": "...", "createdAt": "2025-01-15T00:00:00Z" }
  ]
}
```


#### `POST /api/referrals` 🔴
Create a referral letter  
**Auth:** medecin · **Source:** `orientations.tsx:86-98 (save)`

Request:
```json
{ "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "text": "Cher confrère, ..." }
```

Response: 201 Created

> Audit: *“Courrier d'orientation créé — {patientName} → {specialty}”*.


#### `POST /api/referrals/{id}/email` _(planned)_
Email the referral letter (PDF) to the colleague  
**Auth:** medecin · **Source:** `planned — HOPE-ORI-03, not in prototype`

Request:
```json
{ } (uses contactId's email)
```

Response: 202 Accepted



---

### HOPE-ANN-01 — Directory API: contacts CRUD, free-form types, search

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 69 | 8 | todo | directory, backend, spring, s6 |

Directory API for external contacts (colleagues, labs, suppliers, custom types) with search.

- **Folder:** `hope-api/`
- **Prototype reference:** /annuaire — src/routes/annuaire.tsx
- **Depends on:** `HOPE-FND-04`

**Subtasks**

1. Contact entity + CRUD
2. Search query

**Acceptance criteria**

- Contacts CRUD
- Custom contact types allowed
- Search by name, specialty, phone, email

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Create a contact with type 'Kinésithérapeute' — appears under that group

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P1 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: ANN-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Contact`** _(table)_ — Address book entry — colleague, lab, supplier  
📄 Source: `types.ts:197`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `string` | ✅ | One of CONTACT_KINDS (§5.5) or free text |
| `specialty` | `string` | optional |  |
| `phone` | `string` | optional |  |
| `email` | `string` | optional |  |
| `address` | `string` | optional |  |
| `notes` | `string` | optional |  |

Used in: `routes/annuaire.tsx`, referenced by Referral.contactId.

#### API endpoints used by this ticket

#### `GET /api/contacts`
List / search the address book  
**Auth:** session · **Source:** `annuaire.tsx:94,101, orientations.tsx:60-61,260 (picking a recipient)`

Request: Query: ?kind=&q=

Response:
```json
{
  "content": [
    { "id": "ctc-1", "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis", "notes": null }
  ]
}
```


#### `POST /api/contacts` 🔴
Add a contact  
**Auth:** session · **Source:** `annuaire.tsx:151`

Request:
```json
{ "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis" }
```

Response: 201 Created

> Audit: *“Contact ajouté — {name}”*.


#### `PATCH /api/contacts/{id}` 🔴
Edit a contact  
**Auth:** session · **Source:** `annuaire.tsx edit form`

Request:
```json
{ "phone": "+216 71 111 222" }
```

Response: Updated contact.

> Audit: *“Contact modifié — {name}”*.


#### `DELETE /api/contacts/{id}` 🔴
Remove a contact  
**Auth:** session · **Source:** `annuaire.tsx:347`

Response: 204 No Content

> Audit: *“Contact supprimé — {name}”*.



---

### HOPE-ANN-02 — Directory screen wired

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 70 | 8 | todo | directory, frontend, react, s6 |

Wire the Directory screen to the API with the prototype's grouping, filters and quick actions.

- **Folder:** `src/`
- **Prototype reference:** /annuaire — src/routes/annuaire.tsx
- **Depends on:** `HOPE-ANN-01`

**Subtasks**

1. useContacts hook
2. Wire create/edit/delete

**Acceptance criteria**

- Parity with the prototype (groups, filters, call, email, map)

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Filter by 'Laboratoire' — only labs listed

*Hope V1 · Sprint 6 — Certificates, referrals, directory, lab results · P1 · 2 pts. French version: ANN-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Contact`** _(table)_ — Address book entry — colleague, lab, supplier  
📄 Source: `types.ts:197`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `string` | ✅ | One of CONTACT_KINDS (§5.5) or free text |
| `specialty` | `string` | optional |  |
| `phone` | `string` | optional |  |
| `email` | `string` | optional |  |
| `address` | `string` | optional |  |
| `notes` | `string` | optional |  |

Used in: `routes/annuaire.tsx`, referenced by Referral.contactId.

#### API endpoints used by this ticket

#### `GET /api/contacts`
List / search the address book  
**Auth:** session · **Source:** `annuaire.tsx:94,101, orientations.tsx:60-61,260 (picking a recipient)`

Request: Query: ?kind=&q=

Response:
```json
{
  "content": [
    { "id": "ctc-1", "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis", "notes": null }
  ]
}
```


#### `POST /api/contacts` 🔴
Add a contact  
**Auth:** session · **Source:** `annuaire.tsx:151`

Request:
```json
{ "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis" }
```

Response: 201 Created

> Audit: *“Contact ajouté — {name}”*.


#### `PATCH /api/contacts/{id}` 🔴
Edit a contact  
**Auth:** session · **Source:** `annuaire.tsx edit form`

Request:
```json
{ "phone": "+216 71 111 222" }
```

Response: Updated contact.

> Audit: *“Contact modifié — {name}”*.


#### `DELETE /api/contacts/{id}` 🔴
Remove a contact  
**Auth:** session · **Source:** `annuaire.tsx:347`

Response: 204 No Content

> Audit: *“Contact supprimé — {name}”*.



---

### Settings, reminders, audit log, staff, statistics, search (`s7`)

<a id="settings-reminders-audit-log-staff-statistics-search-s7"></a>

### HOPE-USR-03 — Admin statistics: tiles, 14-day activity, split by specialty

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 71 | 12 | todo | admin, accounts, backend, frontend, s7 |

Administrator statistics without patient data: active doctors, patient/appointment/prescription/certificate counts, 14-day activity chart and split by specialty.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /admin — src/routes/admin.tsx
- **Depends on:** `HOPE-USR-01`

**Subtasks**

1. Aggregation endpoints /stats/*
2. Wire tiles and Recharts charts in admin.tsx

**Acceptance criteria**

- GET /stats/* aggregated server-side
- No identifiable patient data exposed to the admin

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Admin can drill down to patient names

**Test scenarios**

- Counts match the database on staging demo data

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: USR-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> Admin statistics (tiles, 14-day activity) are a new aggregate, not a documented endpoint below — likely GET /api/staff/stats or similar, computed over Doctor + Appointment rows.


---

### HOPE-RAP-01 — Reminders API computed server-side, with configurable thresholds

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 71 | 20 | todo | reminders, backend, spring, s7 |

4 sections: appointments to confirm (48 h), no-shows (21 days), overdue chronic follow-ups (> 90 days, based on the last finished consultation or appointment), renewals (> 25 days).

- **Folder:** `hope-api/`
- **Prototype reference:** /rappels — src/routes/rappels.tsx
- **Depends on:** `HOPE-AGD-01`, `HOPE-ORD-01`, `HOPE-CONS-04`

**Subtasks**

1. One query per reminder rule
2. Thresholds in settings
3. Role filtering

**Acceptance criteria**

- Thresholds editable in Settings
- Secretary: no renewals section
- Unit tests for each rule

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event

**Test scenarios**

- Chronic patient with last consultation 100 days ago → listed in follow-ups

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: RAP-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Checkup`** _(unused)_ — Manual clinical follow-up point — typed, seeded, not wired to any screen  
📄 Source: `types.ts:117`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `state` | `"mieux"\|"stable"\|"moins_bien"` | ✅ | Doctor's subjective assessment |
| `weight` | `number (kg)` | optional |  |
| `systolic` | `number (mmHg)` | optional |  |
| `diastolic` | `number (mmHg)` | optional |  |
| `heartRate` | `number (bpm)` | optional |  |
| `temperature` | `number (°C)` | optional |  |
| `pain` | `number (0–10)` | optional |  |
| `comment` | `string` | optional |  |

> `stateMeta` (`tracking.ts:3`) maps each state to a label, CSS class, color dot, and a numeric score (100/65/25). Per repo scan, this table is currently **not surfaced in any route** — defined in the type system and seeded, but no UI reads/writes it yet (flagged in the tickets file as "Not in UI").

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### Reference notes

> Reminders are not their own entity/table below — the prototype (rappels.tsx) computes 4 categories client-side: upcoming appointments to confirm (Appointment, status=upcoming within 48h), no-shows to recontact (Appointment, status=absent within 21 days), overdue chronic follow-ups (Checkup, gap ≥90 days, filtered by Patient.chronic), and prescriptions due for renewal (Prescription, gap ≥25 days, filtered by Patient.chronic). See also HOPE-V2-02 (SMS/WhatsApp) for the delivery side, out of scope here.


---

### HOPE-RAP-02 — 'Confirm' (confirms the appointment) and 'Done' (persisted, shared) actions

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 73 | 8 | todo | reminders, backend, frontend, bugfix, s7 |

Fixes B11.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /rappels — src/routes/rappels.tsx
- **Depends on:** `HOPE-RAP-01`

**Subtasks**

1. Confirm action → CONFIRMED status
2. reminder_state persistence

**Acceptance criteria**

- Confirm sets status CONFIRMED and the reminder disappears
- Done saves reminder_state, visible on every computer

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Mark done on computer A — gone on computer B

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 2 pts. Fixes prototype issue(s) B11 (specification §7). Backend path assumes a separate hope-api repository; confirm in FND-01. French version: RAP-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> 'Confirm' reuses the appointment-edit flow (AppointmentModal); 'Done'/dismiss in the prototype (rappels.tsx) is a plain client-only `useState<Set>` — never persisted to CabinetData or localStorage, so dismissals are lost on reload. The real app needs a persisted per-user dismissal record (e.g. a reminder_dismissal table keyed by user + reminder key) rather than reproducing this ephemeral behavior.


---

### HOPE-RAP-03 — Reminders screen wired

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 73 | 8 | todo | reminders, frontend, react, s7 |

Wire the Reminders screen (four sections) to the reminders API and actions.

- **Folder:** `src/`
- **Prototype reference:** /rappels — src/routes/rappels.tsx
- **Depends on:** `HOPE-RAP-01`, `HOPE-RAP-02`

**Subtasks**

1. useReminders hook
2. Wire Confirm / Done / Renew buttons

**Acceptance criteria**

- Four sections load from the API
- Confirm and Done actions work
- Secretary does not see the renewals section

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Confirm an appointment — it leaves the list

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 2 pts. French version: RAP-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Checkup`** _(unused)_ — Manual clinical follow-up point — typed, seeded, not wired to any screen  
📄 Source: `types.ts:117`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `state` | `"mieux"\|"stable"\|"moins_bien"` | ✅ | Doctor's subjective assessment |
| `weight` | `number (kg)` | optional |  |
| `systolic` | `number (mmHg)` | optional |  |
| `diastolic` | `number (mmHg)` | optional |  |
| `heartRate` | `number (bpm)` | optional |  |
| `temperature` | `number (°C)` | optional |  |
| `pain` | `number (0–10)` | optional |  |
| `comment` | `string` | optional |  |

> `stateMeta` (`tracking.ts:3`) maps each state to a label, CSS class, color dot, and a numeric score (100/65/25). Per repo scan, this table is currently **not surfaced in any route** — defined in the type system and seeded, but no UI reads/writes it yet (flagged in the tickets file as "Not in UI").

**`Prescription`** _(table)_ — Rendered prescription body, with renewal chaining  
📄 Source: `types.ts:91`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from Favorite lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → Prescription.id of the original prescription being renewed |

> Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks each line's drug name against Patient.allergies and Patient.chronic, including a small hardcoded cross-allergy table (penicillins, sulfonamides, aspirin, iodine). This logic needs to move server-side and ideally use a real drug database instead of substring matching.

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.



---

### HOPE-DOC-03 — Practitioner document profile: header, city, stamp, scanned signature

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 77 | 12 | todo | documents, pdf, backend, frontend, s7 |

Each doctor sets the document header used on PDFs: city, stamp image and scanned signature.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Print templates in ordonnances / certificats / PatientDrawer / personnel
- **Depends on:** `HOPE-DOC-02`, `HOPE-PARAM-01`

**Subtasks**

1. Profile fields + image upload
2. Templates read the profile

**Acceptance criteria**

- Upload stamp and signature images
- Header and city appear on every new PDF
- Previous PDFs unchanged

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Change city — next prescription shows the new city

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: DOC-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.


#### Reference notes

> Stamp/scanned-signature fields don't exist on Settings below yet, and storing them needs the object-storage service from HOPE-DOC-01 (out of scope — see DOC-01 above).

> This ticket's own scope ('header, city, stamp') is exactly what's missing: the printed city is hardcoded to the literal "Sousse" in FOUR places across the app — certificats.tsx (×3: print template, preview, detail modal), orientations.tsx (×1) — and ordonnances.tsx has an editable-but-still-hardcoded-default city field (useState("Sousse")). None of the four derive from data.settings.address. Fixing this ticket properly means adding city to the practice document profile and updating all four call sites, not just one.


---

### HOPE-PERS-01 — Staff API: HR records, encrypted national ID (CIN) and bank details (RIB), photo in object storage

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 74 | 20 | todo | staff, hr, backend, spring, s7 |

Staff records API (HR file for non-medical staff) with national ID (CIN) and bank details (RIB) encrypted at rest and the photo in object storage.

- **Folder:** `hope-api/`
- **Prototype reference:** /personnel — src/routes/personnel.tsx
- **Depends on:** `HOPE-USR-01`, `HOPE-DOC-01`

**Subtasks**

1. staff_profile with encrypted fields
2. RIB validation
3. Photo upload via DOC-01

**Acceptance criteria**

- CIN and RIB encrypted in the database (AES-GCM, key outside the DB)
- RIB validation (20 digits + check key)
- Doctor access only

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Write operation that does not produce an audit event
- CIN or RIB stored or logged in clear text

**Test scenarios**

- Invalid RIB → 400
- DB dump shows CIN as ciphertext

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PERS-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### Reference notes

> /personnel (this ticket's screen) only ever operates on role==="secretaire" rows — it's the doctor's staff-management tool, not a general HR API. Its own creation form hardcodes role: "secretaire" (personnel.tsx:142); there is no way for a medecin to create, edit, deactivate, reset, or delete another medecin from here, and secretaire sessions are refused entry outright ("Accès réservé au médecin").

> This ticket's own name ('encrypted national ID and bank details') is exactly the HR data that belongs in a SEPARATE staff_profile table (Data Model appendix §8), not mixed into the same row as a doctor's licenseNumber/customSymptomGroups — build this API against that split table, related to app_user by a 1:1 user_id FK, rather than one wide Doctor row.


---

### HOPE-PERS-02 — Staff screen wired: record, masked sensitive fields, PDF sheet

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 76 | 12 | todo | staff, hr, frontend, react, s7 |

Wire the Staff screen: cards, HR record, masked sensitive fields and printable staff sheet.

- **Folder:** `src/`
- **Prototype reference:** /personnel — src/routes/personnel.tsx
- **Depends on:** `HOPE-PERS-01`, `HOPE-DOC-02`

**Subtasks**

1. Wire list, form, detail
2. Mask CIN/RIB with audited reveal
3. Staff sheet PDF

**Acceptance criteria**

- CIN and RIB masked by default; the 'show' button is audited
- No password shown or typed anymore: activation by link

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Reveal RIB — audit log records it

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 3 pts. French version: PERS-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `GET /api/staff`
List staff (filter by role/active/search)  
**Auth:** admin, medecin · **Source:** `admin.tsx list, personnel.tsx:59 filter`

Request: Query: ?role=medecin|secretaire&active=true|false&q=search

Response:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```

> Never includes `password`/`passwordHash`.


#### `GET /api/staff/{id}`
Get one staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `personnel.tsx detail panel (secretary records only)`

Response: Single staff object — same shape as the list item above.


#### `POST /api/staff` 🔴
Create a staff account  
**Auth:** admin (role: medecin or secretaire), medecin (role must be secretaire — server must reject a medecin creating another medecin) · **Source:** `admin.tsx:143-153 (create, role selectable), personnel.tsx:181-196 (create, role hardcoded to secretaire)`

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```

Response:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 409 Email déjà utilisé dans ce cabinet

> No `password` field in the request — server generates one and sends an activation email. The prototype currently shows the generated password inline in a toast (admin.tsx:151) — a security issue flagged in DATA-MODEL.md §7.1; the real endpoint must not return it. ⚠️ /admin has no role guard of its own in the prototype — isAdmin only shows/hides the Sidebar link and force-redirects an admin session back to /admin; it never blocks a medecin session from opening /admin directly. The real @PreAuthorize must enforce role:"medecin" in the body → admin-only, not rely on the route. Audit: *“Compte créé — {name}”*.


#### `PATCH /api/staff/{id}` 🔴
Edit a staff account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:138-142 (edit, any role), personnel.tsx:157-180 (edit, secretary records only — list pre-filtered to role===secretaire)`

Request:
```json
{
  "phone": "+216 20 999 999",
  "address": "Sousse",
  "version": 3
}
```

Response: Updated staff object (same shape as GET).

Errors: 409 Conflit de version (édition concurrente)

> Audit: *“Compte modifié — {name}”*.


#### `PATCH /api/staff/{id}/activation` 🔴
Activate or deactivate an account  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:158-164 (toggleActive, any role), personnel.tsx:196-206 (toggleActive, secretary records only)`

Request:
```json
{ "active": false }
```

Response:
```json
{ "id": "doc-fatma", "active": false }
```

> Audit: *“Compte {name} désactivé”* / *“réactivé”*.


#### `POST /api/staff/{id}/password-reset` 🔴
Reset a staff member's password  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:166-185 (confirmReset, any role), personnel.tsx:207-223 (confirmReset, secretary records only)`

Request:
```json
{ } — server generates the password (prototype instead lets the admin type it and shows it in a toast; real endpoint should generate + email only, never return it)
```

Response: 204 No Content

> Side effect in the prototype: if this account's name equals Settings.doctorName, Settings.password is updated too (admin.tsx:178-180) — a consequence of the “three credential pairs” design smell (DATA-MODEL.md §3.19) the real schema should eliminate. Audit: *“Mot de passe réinitialisé — {name}”*.


#### `POST /api/staff/{id}/send-credentials`
Email new credentials to a staff member  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `SendCredentialsModal.tsx + credentials.ts:17 (buildCredentialsEmail) — currently simulated, nothing is actually sent`

Request:
```json
{ }
```

Response: 202 Accepted

> The real implementation replaces this whole pattern with an activation-link flow (HOPE-NOT-01 / HOPE-USR-01) — passwords should never traverse the network at all.


#### `DELETE /api/staff/{id}` 🔴
Delete a staff account (prototype behavior — hard delete)  
**Auth:** admin (any target), medecin (secretaire targets only) · **Source:** `admin.tsx:483 (any role), personnel.tsx:651 (secretary records only)`

Response: 204 No Content

> ⚠️ Corrected: an earlier pass of this document listed auth as admin-only — personnel.tsx gives medecin the same hard-delete power over secretary accounts. Prototype hard-deletes the row. Real API should reject this and require `PATCH .../activation` instead (HOPE-USR-01: “Delete = deactivate, history stays linked”). If ever allowed, audit: *“Compte supprimé — {name}”*.


#### `POST /api/staff/me/symptom-groups` 🔴
Add a custom symptom group to the structured interview  
**Auth:** medecin · **Source:** `parametres.tsx:151-156`

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```

Response: 201 Created — the new CustomSymptomGroup object

> Audit: *“Groupe de symptômes ajouté — {title}”*.


#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
Remove a custom symptom group  
**Auth:** medecin · **Source:** `parametres.tsx:163-169`

Response: 204 No Content

> Audit: *“Groupe de symptômes supprimé — {title}”*.


#### Reference notes

> Same secretary-only scope as HOPE-PERS-01 — this screen is never shown to a secretaire session (personnel.tsx:72-79 returns an explicit 'access reserved to the doctor' empty state instead) and never lists or edits medecin rows.


---

### HOPE-PARAM-01 — Practice and practitioner settings (document profile, city, hours)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 76 | 12 | todo | settings, backend, frontend, s7 |

Separate the practice profile (address, phone, city) from the practitioner profile (name, specialty, licence number) (D2).

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /parametres — src/routes/parametres.tsx
- **Depends on:** `HOPE-FND-04`

**Subtasks**

1. Practice profile API
2. Practitioner profile API
3. Wire profile cards in Settings

**Acceptance criteria**

- Changes are audited (fixes B15)
- Reflected on documents generated afterwards

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Change practice phone — next PDF footer shows it

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P0 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PARAM-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.


#### Reference notes

> This ticket's own scope names the three gaps already confirmed elsewhere: 'city' has no dedicated Settings field and is hardcoded to "Sousse" in 4 places across the app (see HOPE-DOC-03, HOPE-ORD-04, HOPE-CERT-03, HOPE-ORI-02); 'hours' (opening hours per weekday) has no field at all (see HOPE-AGD-07); 'document profile' (stamp, scanned signature) also has no field (see HOPE-DOC-03). All three land on this one ticket's Settings additions.


---

### HOPE-PARAM-02 — Appointment categories, resources, consultation length, public holidays

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 77 | 8 | todo | settings, backend, frontend, s7 |

Manage appointment categories (label + colour), resources (rooms, equipment), consultation length and public holidays from Settings.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /parametres — src/routes/parametres.tsx
- **Depends on:** `HOPE-AGD-02`

**Subtasks**

1. Endpoints for categories and resources
2. Wire Settings cards

**Acceptance criteria**

- Categories, resources, holidays CRUD via API
- Consultation length changes the calendar grid
- Changes are audited

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Add category 'Endoscopie' in orange — usable in the appointment modal

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PARAM-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

**`AppointmentCategory`** _(embedded)_ — Calendar category / color — embedded in Settings.appointmentCategories[]  
📄 Source: `types.ts:58`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `label` | `string` | ✅ | e.g. "Consultation", "Contrôle" |
| `color` | `string (hex)` | ✅ | Calendar color coding |

**`Resource`** _(embedded)_ — Room / equipment / practitioner — embedded in Settings.resources[]  
📄 Source: `types.ts:52`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `"salle" \| "équipement" \| "praticien"` | ✅ |  |

**`Holiday`** _(table)_ — Practice-wide holiday, blocks the whole day  
📄 Source: `types.ts:46`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `label` | `string` | ✅ | e.g. "Aïd el-Fitr" |

Used in: Blocks the whole day automatically in `agenda.tsx` / `index.tsx`.

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.


#### `GET /api/agenda/blocks`
List agenda block-outs  
**Auth:** session · **Source:** `agenda.tsx:58 (data.blocks.find)`

Request: Query: ?from=&to=

Response:
```json
{ "content": [ { "id": "blk-1", "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" } ] }
```


#### `POST /api/agenda/blocks`
Block out a time slot  
**Auth:** medecin, secretaire · **Source:** `agenda.tsx:233`

Request:
```json
{ "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" }
```

Response: 201 Created — the new block


#### `DELETE /api/agenda/blocks/{id}`
Remove a block-out  
**Auth:** medecin, secretaire · **Source:** `implied by the block list UI (delete affordance next to each block)`

Response: 204 No Content


#### `GET /api/agenda/holidays`
List holidays  
**Auth:** session · **Source:** `agenda.tsx:59,272, parametres.tsx holiday list`

Response:
```json
{ "content": [ { "id": "hol-1", "date": "2025-04-10", "label": "Aïd el-Fitr" } ] }
```


#### `POST /api/agenda/holidays`
Add a holiday (blocks the whole day)  
**Auth:** admin, medecin · **Source:** `parametres.tsx:572`

Request:
```json
{ "date": "2025-04-10", "label": "Aïd el-Fitr" }
```

Response: 201 Created


#### `DELETE /api/agenda/holidays/{id}`
Remove a holiday  
**Auth:** admin, medecin · **Source:** `parametres.tsx:557`

Response: 204 No Content



---

### HOPE-PARAM-03 — User preferences: theme, lock delay

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 78 | 4 | todo | settings, backend, frontend, s7 |

Per-user preferences stored on the server: theme (light/dark/system) and auto-lock delay.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /parametres — src/routes/parametres.tsx
- **Depends on:** `HOPE-AUTH-04`

**Subtasks**

1. PATCH /me/preferences
2. Wire Appearance and Security cards

**Acceptance criteria**

- Theme and lock delay saved per user
- Applied on any computer after login

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Set dark theme on computer A — dark on computer B after login

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P2 · 1 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PARAM-03 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.


#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### Reference notes

> Confirmed: despite this ticket's name ('User preferences'), theme and lockDelay both live on the Settings singleton (types.ts:296-297) — practice-wide, not per-Doctor. Every signed-in user today shares the exact same theme and inactivity-lock delay; there is no per-user override anywhere. Making these genuinely per-user requires moving them onto app_user (or a new user_preference table), not just wiring the existing Settings fields to a screen.


---

### HOPE-PARAM-04 — Practice data export (JSON + PDF); remove 'Restore' and 'Reset demo' in production

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 78 | 12 | todo | settings, backend, frontend, s7 |

Export all practice data (JSON + PDFs) as an asynchronous job, and remove the prototype's fake 'Restore' and demo reset buttons from production.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /parametres — src/routes/parametres.tsx
- **Depends on:** `HOPE-DOC-02`

**Subtasks**

1. Async export job + email link
2. Remove Restore / Reset demo in production builds

**Acceptance criteria**

- Asynchronous export, download link sent by email
- Export is audited
- Demo buttons absent in production

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Request export — email with download link arrives

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 3 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: PARAM-04 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.


#### Reference notes

> A practice-wide JSON/PDF export endpoint is not documented below — this ticket is what adds it (e.g. GET /api/settings/export).

> Confirmed the exact two fake buttons this ticket's own name calls out: parametres.tsx:660 'Restaurer' just shows toast.success("Sauvegarde restaurée (simulation)") with no actual restore logic; parametres.tsx:695-702 ('Données de démonstration' / 'Reset demo') shows toast.success("Données de démonstration réinitialisées") and also does nothing real. Both must be removed in production, not just hidden.


---

### HOPE-PARAM-05 — Settings screen wired (split into tabs)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 79 | 12 | todo | settings, frontend, react, s7 |

parametres.tsx is 906 lines: split into Profile, Prescriptions, Interview, Calendar, Security and Data tabs.

- **Folder:** `src/`
- **Prototype reference:** /parametres — src/routes/parametres.tsx
- **Depends on:** `HOPE-PARAM-01`, `HOPE-PARAM-02`, `HOPE-ORD-03`, `HOPE-CONS-05`

**Subtasks**

1. Split parametres.tsx into tab components
2. Wire each tab

**Acceptance criteria**

- Settings split into Profile, Prescriptions, Interview, Calendar, Security, Data tabs
- Every card wired to its API
- No file over 250 lines

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Every tab loads and saves without console errors

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 3 pts. French version: PARAM-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Settings`** _(singleton)_ — Singleton practice configuration — one object at CabinetData.settings  
📄 Source: `types.ts:284`

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ |  |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ |  |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number (minutes)` | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from Doctor.password!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a Doctor row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number (minutes, 0=never)` | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"\|"dark"\|"system"` | ✅ |  |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used in: `routes/parametres.tsx` and almost every print/document view (header/footer branding).

> **Important design smell to resolve in the real app**: there are *three independent credential pairs* today — Doctor.email/Doctor.password per staff row, plus Settings.password (main doctor fallback) and Settings.adminEmail/adminPassword (a separate admin login not tied to any Doctor row). A real auth model should probably collapse these into one `app_user` table with a role.

**`Favorite`** _(embedded)_ — Quick-add prescription line — embedded in Settings.favorites[]  
📄 Source: `types.ts:263`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `label` | `string` | ✅ | Drug name + dosage, e.g. "Paracétamol 1 g" |
| `form` | `string` | optional | Comprimé, gélule, sachet, sirop, inhalateur… |
| `posology` | `string` | ✅ | e.g. "1 cp x 3/j" |
| `duration` | `string` | optional | e.g. "5 jours" |
| `route` | `string` | optional | Orale, cutanée, inhalée… |
| `note` | `string` | optional | e.g. "au milieu du repas" |
| `drugClass` | `string` | optional | One of DRUG_CLASSES (§5.3) or free text |
| `uses` | `number` | optional | Usage counter, powers "most used" sort |

> `renderFavorite()` (`prescriptions.ts:25`) turns a Favorite into one prescription text line: `label (form) - posology, duration - note`. `parseLegacyFavorite()` handles the reverse for migrating old plain-string favorites.

**`Protocol`** _(embedded)_ — Prescription template — embedded in Settings.protocols[]  
📄 Source: `types.ts:276`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `name` | `string` | ✅ | e.g. "Angine bactérienne (adulte)" |
| `category` | `string` | optional |  |
| `note` | `string` | optional |  |
| `lines` | `string[]` | ✅ | Ready-to-insert prescription lines for a common situation |

**`AppointmentCategory`** _(embedded)_ — Calendar category / color — embedded in Settings.appointmentCategories[]  
📄 Source: `types.ts:58`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `label` | `string` | ✅ | e.g. "Consultation", "Contrôle" |
| `color` | `string (hex)` | ✅ | Calendar color coding |

**`Resource`** _(embedded)_ — Room / equipment / practitioner — embedded in Settings.resources[]  
📄 Source: `types.ts:52`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `"salle" \| "équipement" \| "praticien"` | ✅ |  |

**`CertificateTemplate`** _(embedded)_ — Embedded in Settings.certificateTemplates[]  
📄 Source: `types.ts:141`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `string` | ✅ |  |
| `text` | `string` | ✅ |  |

#### API endpoints used by this ticket

#### `GET /api/settings`
Get practice settings  
**Auth:** session (fields trimmed for secretaire) · **Source:** `parametres.tsx load, used practice-wide for document/print branding`

Response:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```

> `password`/`adminPassword` never returned.


#### `PATCH /api/settings` 🔴
Update practice settings  
**Auth:** admin, medecin · **Source:** `parametres.tsx:189-208 (doctorName/specialty/address/phone/licenseNumber), :428 (consultDuration), :632 (lockDelay), :672 (theme)`

Request:
```json
{ "consultDuration": 20, "lockDelay": 10, "theme": "dark" }
```

Response: Updated settings.

> Audit: *“Paramètres modifiés”*.


#### `GET /api/settings/favorites`
List quick-add prescription favorites  
**Auth:** medecin · **Source:** `ordonnances.tsx quick-add list, parametres.tsx:230-270`

Response:
```json
{ "content": [ { "id": "fav-1", "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique", "uses": 12 } ] }
```


#### `POST /api/settings/favorites` 🔴
Add a prescription favorite  
**Auth:** medecin · **Source:** `parametres.tsx favorite creation form`

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```

Response: 201 Created

> Audit: *“Favori ajouté — {label}”*.


#### `DELETE /api/settings/favorites/{id}` 🔴
Remove a favorite  
**Auth:** medecin · **Source:** `parametres.tsx:263`

Response: 204 No Content

> Audit: *“Favori supprimé — {label}”*.


#### `POST /api/settings/favorites/{id}/use`
Bump a favorite's usage counter  
**Auth:** medecin · **Source:** `implied by Favorite.uses (types.ts:272), incremented on insert into a prescription`

Request:
```json
{ }
```

Response:
```json
{ "id": "fav-1", "uses": 12 }
```


#### `GET /api/settings/protocols`
List prescription protocols  
**Auth:** medecin · **Source:** `ordonnances.tsx, parametres.tsx:280-313`

Response:
```json
{ "content": [ { "id": "pro-1", "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] } ] }
```


#### `POST /api/settings/protocols` 🔴
Add a prescription protocol  
**Auth:** medecin · **Source:** `parametres.tsx protocol creation form`

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```

Response: 201 Created

> Audit: *“Protocole ajouté — {name}”*.


#### `DELETE /api/settings/protocols/{id}` 🔴
Remove a protocol  
**Auth:** medecin · **Source:** `parametres.tsx:313`

Response: 204 No Content

> Audit: *“Protocole supprimé — {name}”*.


#### `GET /api/settings/appointment-categories`
List calendar categories  
**Auth:** session · **Source:** `agenda.tsx color legend, AppointmentModal.tsx category picker, parametres.tsx:440-475`

Response:
```json
{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }
```


#### `POST /api/settings/appointment-categories` 🔴
Add a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:453-465`

Request:
```json
{ "label": "Contrôle", "color": "#2E9E6B" }
```

Response: 201 Created

> Audit: *“Catégorie ajoutée — {label}”*.


#### `DELETE /api/settings/appointment-categories/{id}` 🔴
Remove a calendar category  
**Auth:** admin, medecin · **Source:** `parametres.tsx:475`

Response: 204 No Content

> Audit: *“Catégorie supprimée — {label}”*.


#### `GET /api/settings/resources`
List rooms / equipment / practitioners  
**Auth:** session · **Source:** `agenda.tsx/AppointmentModal.tsx resource picker, parametres.tsx:480-515`

Response:
```json
{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }
```


#### `POST /api/settings/resources` 🔴
Add a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:535`

Request:
```json
{ "name": "Échographe", "kind": "équipement" }
```

Response: 201 Created

> Audit: *“Ressource ajoutée — {name}”*.


#### `DELETE /api/settings/resources/{id}` 🔴
Remove a resource  
**Auth:** admin, medecin · **Source:** `parametres.tsx:515`

Response: 204 No Content

> Audit: *“Ressource supprimée — {name}”*.


#### `GET /api/settings/certificate-templates`
List custom certificate templates  
**Auth:** medecin · **Source:** `certificats.tsx model list, parametres.tsx template management`

Response:
```json
{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }
```


#### `POST /api/settings/certificate-templates` 🔴
Add a certificate template  
**Auth:** medecin · **Source:** `parametres.tsx template creation form`

Request:
```json
{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }
```

Response: 201 Created

> Audit: *“Modèle de certificat ajouté — {type}”*.


#### `DELETE /api/settings/certificate-templates/{type}` 🔴
Remove a certificate template  
**Auth:** medecin · **Source:** `template removal in parametres.tsx`

Response: 204 No Content

> Audit: *“Modèle de certificat supprimé — {type}”*.



---

### HOPE-AUD-02 — Audit log screen wired: filters by actor, date, patient, type; CSV export

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 79 | 12 | todo | audit, frontend, react, s7 |

Wire the Activity log screen to the audit API with server pagination, filters and CSV export, and add it to the doctor's sidebar.

- **Folder:** `src/`
- **Prototype reference:** /journal — src/routes/journal.tsx
- **Depends on:** `HOPE-AUD-01`

**Subtasks**

1. useAudit hook with filters
2. CSV export
3. Sidebar link

**Acceptance criteria**

- Server-side pagination
- Audit log link in the doctor's sidebar

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Filter by patient — only that patient's events

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 3 pts. French version: AUD-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`AuditEntry`** _(table)_ — Activity log — append-only by convention, not by enforcement  
📄 Source: `types.ts:226`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `at` | `string (ISO)` | ✅ |  |
| `actor` | `string` | ✅ | **Name snapshot**, not an FK — resolved once at write time from the current user (`store.tsx:151-152`) |
| `summary` | `string` | ✅ | Human-readable description of the action |

> Written centrally by the `update()` function in `store.tsx:146-159`, whenever a caller passes an `audit` message. **Capped at 400 entries** (`.slice(0, 400)`) — oldest entries silently dropped. This cap and the lack of structured action/entity/entityId/diff fields is exactly what the tickets file flags as needing a real append-only, ungapped audit table server-side.

#### API endpoints used by this ticket

#### `GET /api/audit`
List audit events  
**Auth:** admin, medecin · **Source:** `journal.tsx:28 (data.audit.map)`

Request: Query: ?from=&to=&actorId=&entity=&patientId=&page=&size=

Response:
```json
{
  "content": [
    { "id": "aud-1", "at": "2025-01-20T10:00:00Z", "actorId": "doc-amine", "actor": "Dr Amine Gastro", "action": "PATIENT_CREATED", "entity": "patient", "entityId": "pat-hedi", "patientId": "pat-hedi", "summary": "Patient créé — Hédi Ben Salah", "diff": null }
  ],
  "page": 0, "size": 50, "totalElements": 400, "totalPages": 8
}
```

> The `action`/`entity`/`entityId`/`diff` fields are additions over the prototype (which only stores `actor`+`summary` as free text) — required per DATA-MODEL.md §7.4/§8 (HOPE-AUD-01: structured, append-only, no row cap, no UPDATE/DELETE grant).



---

### HOPE-SRCH-01 — Server-side global search (patients + sections allowed for the role)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 80 | 8 | todo | search, backend, frontend, s7 |

Global search in the header queries the server for patients and only shows the sections the current role may open.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** GlobalSearch — src/components/cabinet/GlobalSearch.tsx
- **Depends on:** `HOPE-PAT-01`

**Subtasks**

1. GET /search
2. Wire GlobalSearch with '/' shortcut and keyboard navigation

**Acceptance criteria**

- '/' shortcut and keyboard navigation kept
- Sections filtered by role

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Secretary searches 'Ordonnances' — not offered

*Hope V1 · Sprint 7 — Settings, reminders, audit log, staff, statistics, search · P1 · 2 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: SRCH-01 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

**`Contact`** _(table)_ — Address book entry — colleague, lab, supplier  
📄 Source: `types.ts:197`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ |  |
| `kind` | `string` | ✅ | One of CONTACT_KINDS (§5.5) or free text |
| `specialty` | `string` | optional |  |
| `phone` | `string` | optional |  |
| `email` | `string` | optional |  |
| `address` | `string` | optional |  |
| `notes` | `string` | optional |  |

Used in: `routes/annuaire.tsx`, referenced by Referral.contactId.

#### API endpoints used by this ticket

#### `GET /api/search`
Search patients + static navigation pages  
**Auth:** session · **Source:** `GlobalSearch.tsx:49-57`

Request: Query: ?q=salma

Response:
```json
{
  "patients": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "phone": "+216 22 111 222" }
  ],
  "pages": [
    { "label": "Patients", "to": "/patients" }
  ]
}
```

> `patients` matches accent-insensitive substring on name, phone, or code (capped at 6 client-side). `pages` matches the static nav-label list (Patients, Aujourd'hui, Rappels, Agenda, Salle d'attente, Ordonnances, Certificats, Orientations, Annuaire, Personnel, Paramètres — capped at 4). The patient list is role-scoped like every other patient DTO. HOPE-SRCH-01 is what would widen this to appointments/contacts server-side — don't add those groups without that ticket.



---

### Security, tests, acceptance, go-live (`s8`)

<a id="security-tests-acceptance-go-live-s8"></a>

### HOPE-SEC-01 — Security headers, CSP, strict CORS, enforced HTTPS

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 81 | 8 | todo | security, compliance, infra, s8 |

Harden HTTP: security headers, strict Content Security Policy, CORS limited to the app's origins, HTTPS enforced everywhere.

- **Folder:** `infra/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-09`

**Subtasks**

1. Headers in reverse proxy / Spring Security
2. Property-driven CORS allowlist

**Acceptance criteria**

- CSP, HSTS, X-Content-Type-Options, Referrer-Policy set
- CORS allows only configured origins
- HTTP redirects to HTTPS

**Rejection criteria**

- Secrets committed to the repository
- Wildcard CORS in production

**Test scenarios**

- securityheaders.com grade A on staging
- Request from an unlisted origin → blocked

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P0 · 2 pts. French version: SEC-01 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Infra/security-headers hardening — no entity/endpoint mapping.


---

### HOPE-SEC-02 — Daily encrypted backups + tested restore procedure

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 81 | 12 | todo | security, compliance, infra, s8 |

Daily encrypted database and file backups with a documented, tested restore procedure.

- **Folder:** `infra/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-09`

**Subtasks**

1. Nightly pg_dump + object storage sync, encrypted
2. Retention policy
3. Restore runbook + drill

**Acceptance criteria**

- 30-day retention + monthly for 12 months
- Restore tested and documented (RTO ≤ 4 h)

**Rejection criteria**

- Secrets committed to the repository

**Test scenarios**

- Restore last night's backup into a fresh environment in < 4 h

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P0 · 3 pts. French version: SEC-02 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Backup/restore infra — no entity/endpoint mapping. Every table in the Data Model appendix §8 is what gets backed up.


---

### HOPE-SEC-03 — Monitoring: structured logs, Sentry front and back, uptime alerts

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 83 | 12 | todo | security, compliance, infra, s8 |

Structured logs, error tracking (Sentry) on front and back, and uptime alerts so problems are seen before the practice calls.

- **Folder:** `infra/`
- **Prototype reference:** —
- **Depends on:** `HOPE-FND-09`

**Subtasks**

1. Logback JSON config
2. Sentry SDKs
3. Uptime monitor

**Acceptance criteria**

- JSON logs with request id
- Sentry receives front and back errors
- Uptime alert on /health failure

**Rejection criteria**

- Secrets committed to the repository

**Test scenarios**

- Throw a test error — appears in Sentry
- Stop the API — alert fires

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P1 · 3 pts. French version: SEC-03 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Observability infra — no entity/endpoint mapping.


---

### HOPE-SEC-05 — Penetration test / security review before go-live

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 84 | 12 | todo | security, compliance, infra, s8 |

Independent security review / penetration test of staging before go-live, with every high finding fixed.

- **Folder:** `infra/`
- **Prototype reference:** —
- **Depends on:** `HOPE-SEC-01`

**Subtasks**

1. Scope and book the test
2. Fix findings
3. Re-test

**Acceptance criteria**

- Test performed on staging
- All high and critical findings fixed or accepted in writing
- Report stored in docs

**Rejection criteria**

- Secrets committed to the repository

**Test scenarios**

- Re-test confirms high findings closed

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P0 · 3 pts. French version: SEC-05 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Pen-test — exercises every endpoint in the API Endpoints appendix; no single entity/endpoint mapping.


---

### HOPE-QA-01 — End-to-end tests (Playwright) of critical journeys

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 85 | 20 | todo | qa, frontend, react, s8 |

Login, patient creation, booking, waiting room, consultation, prescription, certificate, secretary permissions.

- **Folder:** `src/`
- **Prototype reference:** All screens
- **Depends on:** `HOPE-DOS-08`, `HOPE-CONS-06`, `HOPE-ORD-04`

**Subtasks**

1. Playwright setup against staging
2. Scenarios per critical journey
3. CI job

**Acceptance criteria**

- Run in CI against staging
- Secretary journey: no clinical access possible

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Full suite green on staging before QA-02

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P0 · 5 pts. French version: QA-01 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> End-to-end tests exercise every screen/entity/endpoint in both appendices; no single mapping.


---

### HOPE-QA-02 — User acceptance testing with the doctor and the secretary (sign-off per module)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 87 | 12 | todo | qa, docs, s8 |

Acceptance sessions with the doctor and the secretary on staging; each module signed off in writing.

- **Folder:** `docs/`
- **Prototype reference:** All screens
- **Depends on:** `HOPE-QA-01`

**Subtasks**

1. Prepare test scripts per role
2. Run sessions
3. Collect sign-offs

**Acceptance criteria**

- Every V1 module tested by the real users
- Signed sign-off sheet per module
- Blocking issues fixed before go-live

**Rejection criteria**

- Sign-off given on the demo data only, without the real users
- Go-live with an open blocking issue

**Test scenarios**

- Sign-off sheet complete for all 17 modules

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P0 · 3 pts. French version: QA-02 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Sign-off process — no entity/endpoint mapping.


---

### HOPE-QA-03 — User guides per role + operations guide

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| high | 88 | 12 | todo | qa, docs, s8 |

Short user guides per role (doctor, secretary, admin) and an operations guide (deploy, backup, restore).

- **Folder:** `docs/`
- **Prototype reference:** All screens
- **Depends on:** —

**Subtasks**

1. Write role guides
2. Write operations guide

**Acceptance criteria**

- One guide per role with screenshots
- Operations guide covering deploy, backup, restore, incident contacts

**Rejection criteria**

- Guides describing prototype behaviour that V1 changed

**Test scenarios**

- A new secretary completes a booking using only the guide

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P1 · 3 pts. French version: QA-03 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Documentation — no entity/endpoint mapping.


---

### HOPE-QA-04 — Go-live + first-week support

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| critical | 89 | 12 | todo | qa, infra, s8 |

Production deployment and close support during the practice's first week of real use.

- **Folder:** `infra/`
- **Prototype reference:** All screens
- **Depends on:** `HOPE-QA-02`, `HOPE-SEC-02`, `HOPE-SEC-05`

**Subtasks**

1. Production deploy
2. Account setup
3. Week-1 support rota

**Acceptance criteria**

- Production live over HTTPS
- Accounts created and data imported if any
- Daily check-in with the practice during week 1

**Rejection criteria**

- Secrets committed to the repository

**Test scenarios**

- Practice runs a full day of appointments on Hope without blocking issue

*Hope V1 · Sprint 8 — Security, tests, acceptance, go-live · P0 · 3 pts. French version: QA-04 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Go-live/support — no entity/endpoint mapping.


---

### Post-v1 quick wins (v1.1) (`v1.1`)

<a id="post-v1-quick-wins-v1-1--v1.1"></a>

### HOPE-AUTH-10 — Two-factor authentication with TOTP (admin, doctor)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 91 | 20 | todo | auth, security, backend, frontend, v1.1 |

Optional second factor with an authenticator app (TOTP) for admin and doctor accounts.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** LockScreen (login) — src/components/cabinet/LockScreen.tsx
- **Depends on:** `HOPE-AUTH-01`

**Subtasks**

1. TOTP secret storage (encrypted)
2. Enrolment + verification screens
3. Recovery codes

**Acceptance criteria**

- Enrolment with QR code and recovery codes
- Login asks for the 6-digit code when enabled
- Admin can reset a user's 2FA

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Enable 2FA, log out, log in — code required
- Wrong code → refused

*Hope V1.1 · V1.1 — Right after go-live · P2 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: AUTH-10 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Doctor`** _(table)_ — Practice staff account — both médecin and secrétaire, doubling as an HR record  
📄 Source: `types.ts:313`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a medecin; also used as a **job title** for secretaire rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ |  |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string (ISO)` | ✅ |  |
| `lastPasswordResetAt` | `string (ISO)` | optional | Shown instead of the password in the admin UI |
| `role` | `"medecin" \| "secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string (dataURL)` | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"\|"CDD"\|"Stage"\|"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`, `components/cabinet/LockScreen.tsx` (login + quick-login), `components/cabinet/SendCredentialsModal.tsx`.

> **Role & account-creation model** — three roles, asymmetric creation rights: `admin` (`Settings.adminEmail`/`adminPassword`, a separate login not a Doctor row) is confined to `/admin` and can create **either** `medecin` or `secretaire` accounts (role selector at `admin.tsx:409-417`). `medecin` can create **only** `secretaire` accounts, via `/personnel` (role hardcoded there, `personnel.tsx:142`) — no UI path lets a doctor create another doctor. `secretaire` can create nobody and is explicitly refused entry to `/personnel` ("Accès réservé au médecin").

> ⚠️ **Confirmed gap**: `/admin` has no role guard of its own — `isAdmin` only toggles the Sidebar link and force-redirects an *admin* session back to `/admin`; it never blocks a `medecin` session from navigating there directly. A logged-in doctor who types `/admin` reaches the full account-management screen today, including the ability to create/deactivate other doctors.

> Session/runtime fields (not persisted — see `context.ts`): `currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"` (admin is a *separate* login, not a Doctor row — see §3.19 Settings).

> A `secretaire` session is further restricted client-side by `SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not modeled as data — see §7 Security note 8.

> **This one table holds three roles’ worth of unrelated fields** — medical (licenseNumber, customSymptomGroups) and HR (cin/rib/bank/hiredAt/contractType/emergencyContact/…) regardless of which role actually uses them. The suggested real schema (§8) splits this into a base `app_user` identity row plus a **separate `doctor_profile` table** and a **separate `staff_profile` table**, each related to `app_user` by a 1:1 `user_id` FK — not staff nested inside doctor, but siblings off the same base row. See §7 point 10.

#### API endpoints used by this ticket

#### `POST /api/auth/login`
Log in as staff or as the separate admin account  
**Auth:** public · **Source:** `LockScreen.tsx:17-45 (attemptLogin)`

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```

Errors: 401 Identifiants invalides (wrong password or unknown email — same message); 403 Compte désactivé; 423 Compte verrouillé (lockout window, HOPE-AUTH-07)

> Two login paths merge into one endpoint: a normal **Doctor** login, and the separate **admin** login (Settings.adminEmail/adminPassword, not a Doctor row) — server checks both and returns the resolved role. Sets the refresh-token cookie (HttpOnly, Secure, SameSite=Strict).


#### `POST /api/auth/refresh`
Silently refresh the access token  
**Auth:** public (refresh cookie) · **Source:** `implicit — prototype re-shows the lock screen on reload; real app must silently refresh (HOPE-AUTH-03)`

Request: — (reads the HttpOnly refresh cookie, no body)

Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": { "...": "same shape as login" }
}
```

Errors: 401 Refresh token invalide, expiré ou déjà utilisé (reuse revokes the whole token family)

> Rotates the refresh cookie on every call.


#### `POST /api/auth/logout`
End the session (real sign-out, distinct from the client-only lock)  
**Auth:** session · **Source:** `Sidebar.tsx “Verrouiller” / lock() in context.ts:20`

Request:
```json
{ }
```

Response: 204 No Content

> lock() in the prototype is purely client-side state — there's no server session to end. This endpoint is the real “sign out”, e.g. reachable from the sidebar.


#### `POST /api/auth/unlock`
Unlock the lock-screen overlay without ending the session  
**Auth:** session (still-valid access token) · **Source:** `LockScreen.tsx reused as overlay; unlock() in context.ts:21 — backs HOPE-AUTH-04`

Request:
```json
{ "password": "Doctor@2024" }
```

Response: 204 No Content

Errors: 401 Mot de passe incorrect — does NOT end the session, just keeps the overlay up

> Session continues; nothing new is issued on success.


#### `GET /api/auth/me`
Get the current logged-in user  
**Auth:** session · **Source:** `context.ts currentUser`

Response:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```


#### `POST /api/auth/password/change` 🔴
Change your own password  
**Auth:** session · **Source:** `parametres.tsx:582-622 (own-password change form)`

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 400 Politique de mot de passe non respectée (HOPE-AUTH-05: ≥10 car., maj., min., chiffre); 401 Mot de passe actuel incorrect

> Audit: *“Mot de passe modifié”*.


#### `POST /api/auth/password/forgot` _(planned)_
Request a password reset link by email  
**Auth:** public · **Source:** `planned — HOPE-AUTH-09, not in prototype`

Request:
```json
{ "email": "amine.gastro@cabinet.tn" }
```

Response: 202 Accepted (always — never reveals whether the email exists)

> Sends a single-use, 30-minute reset link by email.


#### `POST /api/auth/password/reset` _(planned)_
Set a new password from a reset link  
**Auth:** public (bears reset token) · **Source:** `planned — HOPE-AUTH-09`

Request:
```json
{ "token": "...", "newPassword": "NewPass1234" }
```

Response: 204 No Content

Errors: 410 Lien expiré ou déjà utilisé


#### Reference notes

> TOTP/2FA endpoints are not in the API Endpoints appendix yet (v1.1 scope) — this ticket adds them, e.g. POST /api/auth/2fa/enable, POST /api/auth/2fa/verify, alongside the existing Auth section below.


---

### HOPE-AGD-08 — Move an appointment by drag and drop

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 93 | 12 | todo | calendar, appointments, frontend, react, v1.1 |

Move an appointment to another slot by dragging it in the calendar.

- **Folder:** `src/`
- **Prototype reference:** /agenda — src/routes/agenda.tsx + AppointmentModal.tsx
- **Depends on:** `HOPE-AGD-04`

**Subtasks**

1. Drag-and-drop on the week/day grid
2. Conflict feedback on drop

**Acceptance criteria**

- Drag to a free slot updates the appointment
- Drop on a busy or blocked slot is refused
- Change is audited

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Drag to a free slot — persists after reload

*Hope V1.1 · V1.1 — Right after go-live · P2 · 3 pts. French version: AGD-08 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.



---

### HOPE-V2-01 — Fees and payments (cash, CNAM pending/paid), daily takings

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 94 | 32 | todo | later, backend, frontend, v1.1 |

Payment model exists in the prototype (30 days of demo data) but has no screen.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Not in UI — Payment type in src/lib/cabinet/types.ts
- **Depends on:** —

**Subtasks**

1. Scope workshop with the doctor
2. Payments API + screen

**Acceptance criteria**

- Record fees per consultation (cash, CNAM pending/paid)
- Daily takings report
- CNAM pending list

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Record 3 payments — daily total correct

*Hope V1.1 · V1.1 — Right after go-live · P2 · 8 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-01 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> ⚠️ OUT OF SCOPE: payments are explicitly excluded from both appendices (see their scope notes). Re-derive the Payment entity and its endpoints from src/lib/cabinet/types.ts before starting.


---

### HOPE-V2-02 — SMS / WhatsApp reminders to patients (appointment confirmation)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 98 | 20 | todo | later, backend, frontend, v1.1 |

Send appointment reminders and confirmations to patients by SMS or WhatsApp through a Tunisian provider.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** —
- **Depends on:** —

**Subtasks**

1. Choose provider
2. Scheduler + templates

**Acceptance criteria**

- Reminder sent 24 h before
- Patient reply updates confirmation
- Opt-out respected

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Appointment tomorrow — SMS sent today

*Hope V1.1 · V1.1 — Right after go-live · P2 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-02 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Appointment`** _(table)_ — Agenda / calendar entry  
📄 Source: `types.ts:24`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ |  |
| `time` | `string (HH:mm)` | ✅ |  |
| `reason` | `string` | ✅ | Free text |
| `status` | `"upcoming"\|"done"\|"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → Settings.appointmentCategories[].id |
| `resourceId` | `string` | optional | FK-like → Settings.resources[].id (room / equipment / practitioner) |
| `checkedInAt` | `string (ISO)` | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `"waiting"\|"in_consult"\|"done"` | optional | Waiting-room flow position, independent from status |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board), `routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`, `routes/patients.tsx` (patient's appointment history).

> Cancelling in this prototype is not a distinct status — there's no "cancelled" state; the real spec calls for one (never delete the row).

#### API endpoints used by this ticket

#### `GET /api/appointments`
List appointments by date range / practitioner / patient / status  
**Auth:** session · **Source:** `agenda.tsx:56,271, index.tsx:39-49, tracker.tsx (list), patients.tsx:60-65 (patient history)`

Request: Query: ?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15

Response:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```


#### `GET /api/appointments/{id}`
Get one appointment  
**Auth:** session · **Source:** `AppointmentModal.tsx:22 (load for edit)`

Response: Single appointment — same shape as above.


#### `POST /api/appointments` 🔴
Create an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx:37-98 (create; can also inline-create the patient first)`

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```

Response:
```json
{ "id": "apt-2", "status": "upcoming", "...": "rest of the fields above" }
```

Errors: 409 Créneau bloqué (Block/Holiday) ou double réservation sur la même ressource

> `status` defaults to `upcoming`. Audit: *“Rendez-vous créé — {patientName}, {date} {time}”*.


#### `PATCH /api/appointments/{id}` 🔴
Edit an appointment  
**Auth:** medecin, secretaire · **Source:** `AppointmentModal.tsx edit path (reuses the create form pre-filled)`

Request:
```json
{ "time": "11:00", "reason": "...", "version": 2 }
```

Response: Updated appointment.

> Audit: *“Rendez-vous modifié — {patientName}”*.


#### `POST /api/appointments/{id}/status` 🔴
Mark an appointment done / absent  
**Auth:** medecin, secretaire · **Source:** `index.tsx:131-134 (mark done), index.tsx:142-145 (mark absent)`

Request:
```json
{ "status": "done" }
```

Response:
```json
{ "id": "apt-1", "status": "done" }
```

Errors: 422 Transition invalide (ex. déjà « done »)

> Audit: *“Consultation marquée terminée — {patientName}”* / *“Patient marqué absent — {patientName}”*.


#### `POST /api/appointments/{id}/check-in` 🔴
Check a patient in on arrival  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:66-73 (checkIn)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```

> Audit: *“Arrivée enregistrée — {patientName}”*.


#### `PATCH /api/appointments/{id}/tracker` 🔴
Move a checked-in patient between waiting-room columns  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:52-60 (setTracker: waiting → in_consult → done)`

Request:
```json
{ "tracker": "in_consult" }
```

Response:
```json
{ "id": "apt-1", "tracker": "in_consult" }
```

> Audit: *“Flux patient — {patientName} : {label}”* (label = column name, e.g. « En consultation »).


#### `POST /api/appointments/{id}/tracker/reopen` 🔴
Send a checked-in patient back to “not arrived”  
**Auth:** secretaire, medecin · **Source:** `tracker.tsx:75-84 (reopen)`

Request:
```json
{ }
```

Response:
```json
{ "id": "apt-1", "checkedInAt": null, "tracker": null }
```

> Audit: *“Patient retiré du tableau — {patientName}”*.


#### `DELETE /api/appointments/{id}` 🔴
Delete / cancel an appointment (prototype behavior — hard delete)  
**Auth:** medecin, secretaire · **Source:** `index.tsx:183 (dashboard delete), AppointmentModal.tsx:99 (cancel from edit modal)`

Response: 204 No Content

> ⚠️ Prototype hard-deletes for both “delete” and “cancel”. Per HOPE-AGD-01's rejection criteria (“Cancelling by deleting the appointment row”), the real endpoint should be `POST /api/appointments/{id}/cancel` instead — see next entry.


#### `POST /api/appointments/{id}/cancel` 🔴
Recommended replacement for DELETE — cancel with reason, keep the row  
**Auth:** medecin, secretaire · **Source:** `recommended per HOPE-AGD-01 rejection criteria`

Request:
```json
{ "reason": "Patient a annulé par téléphone" }
```

Response:
```json
{ "id": "apt-1", "status": "cancelled" }
```

> Audit: *“Rendez-vous annulé — {patientName} ({reason})”*.


#### Reference notes

> SMS/WhatsApp delivery itself has no entity/endpoint in either appendix — it's a new integration layered on top of the Appointment/reminder data below.


---

### Future scope (v2) (`v2`)

<a id="future-scope-v2--v2"></a>

### HOPE-ORD-05 — Drug database (Tunisian formulary, INN) with autocomplete

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 101 | 32 | todo | prescriptions, backend, frontend, v2 |

Searchable drug database (Tunisian formulary, international non-proprietary names) with autocomplete in the prescription editor.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** /ordonnances — src/routes/ordonnances.tsx
- **Depends on:** `HOPE-ORD-01`

**Subtasks**

1. Find and license a data source
2. Import job
3. Autocomplete UI

**Acceptance criteria**

- Drug list imported from an official source
- Autocomplete by brand or INN
- Selected drug fills a structured line

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Type 'amox' — Amoxicilline products suggested

*Hope V2 · V2 · P2 · 8 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: ORD-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Favorite`** _(embedded)_ — Quick-add prescription line — embedded in Settings.favorites[]  
📄 Source: `types.ts:263`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ |  |
| `label` | `string` | ✅ | Drug name + dosage, e.g. "Paracétamol 1 g" |
| `form` | `string` | optional | Comprimé, gélule, sachet, sirop, inhalateur… |
| `posology` | `string` | ✅ | e.g. "1 cp x 3/j" |
| `duration` | `string` | optional | e.g. "5 jours" |
| `route` | `string` | optional | Orale, cutanée, inhalée… |
| `note` | `string` | optional | e.g. "au milieu du repas" |
| `drugClass` | `string` | optional | One of DRUG_CLASSES (§5.3) or free text |
| `uses` | `number` | optional | Usage counter, powers "most used" sort |

> `renderFavorite()` (`prescriptions.ts:25`) turns a Favorite into one prescription text line: `label (form) - posology, duration - note`. `parseLegacyFavorite()` handles the reverse for migrating old plain-string favorites.

#### API endpoints used by this ticket

#### `GET /api/prescriptions`
List prescriptions for a patient  
**Auth:** medecin · **Source:** `ordonnances.tsx list for a patient, patients.tsx patient history`

Request: Query: ?patientId=pat-salma

Response:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```


#### `POST /api/prescriptions` 🔴
Create a prescription (from favorites/protocols, or a renewal)  
**Auth:** medecin · **Source:** `ordonnances.tsx:81-90 (save — composes selected Favorite/Protocol lines)`

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```

Response:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```

> Server re-runs the allergy/chronic-drug conflict check and surfaces warnings in the response. Audit: *“Ordonnance créée — {patientName}”*.


#### `GET /api/prescriptions/{id}/conflicts-preview`
Live allergy / chronic-drug conflict check while typing a line  
**Auth:** medecin · **Source:** `prescriptions.ts:64 (lineConflicts), called live before saving`

Request:
```json
{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }
```

Response:
```json
{ "allergy": ["Pénicilline"], "chronic": [] }
```


#### Reference notes

> The Tunisian drug formulary itself is not a documented entity — it would be a new reference table (like ICD-10 in the Data Model appendix §5.1), feeding autocomplete into Favorite/Prescription lines.


---

### HOPE-V2-03 — Vaccination register

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 102 | 20 | todo | later, backend, frontend, v2 |

Vaccination type exists in the prototype, with no screen.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Not in UI — Vaccination type in src/lib/cabinet/types.ts
- **Depends on:** —

**Subtasks**

1. Scope
2. API + screen

**Acceptance criteria**

- Vaccination register per patient
- Next-dose reminders

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Add vaccine with next dose — reminder appears

*Hope V2 · V2 · P2 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-03 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> ⚠️ OUT OF SCOPE: vaccinations are explicitly excluded from both appendices (see their scope notes). Re-derive the Vaccination entity and its endpoints from src/lib/cabinet/types.ts before starting.


---

### HOPE-V2-04 — Document management (filed documents, not linked to a patient)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 103 | 20 | todo | later, backend, frontend, v2 |

CabinetDocument type exists in the prototype.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Not in UI — CabinetDocument type in src/lib/cabinet/types.ts
- **Depends on:** —

**Subtasks**

1. Scope
2. API + screen

**Acceptance criteria**

- Upload and classify documents
- Attach later to a patient

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Upload an unlinked document, link it to a patient

*Hope V2 · V2 · P2 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-04 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> ⚠️ OUT OF SCOPE: documents are explicitly excluded from both appendices (see their scope notes) — see also HOPE-DOC-01 above.


---

### HOPE-V2-05 — Clinical follow-up (vital signs, how the patient feels, health score, trends)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 103 | 32 | todo | later, backend, frontend, v2 |

Checkup + tracking.ts (unused) in the prototype.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Not in UI — Checkup type + src/lib/cabinet/tracking.ts (unused)
- **Depends on:** —

**Subtasks**

1. Scope
2. API + screen

**Acceptance criteria**

- Record vital signs and how the patient feels
- Trend charts and health score

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Two check-ups — trend shown

*Hope V2 · V2 · P2 · 8 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-05 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Checkup`** _(unused)_ — Manual clinical follow-up point — typed, seeded, not wired to any screen  
📄 Source: `types.ts:117`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string` | ✅ |  |
| `state` | `"mieux"\|"stable"\|"moins_bien"` | ✅ | Doctor's subjective assessment |
| `weight` | `number (kg)` | optional |  |
| `systolic` | `number (mmHg)` | optional |  |
| `diastolic` | `number (mmHg)` | optional |  |
| `heartRate` | `number (bpm)` | optional |  |
| `temperature` | `number (°C)` | optional |  |
| `pain` | `number (0–10)` | optional |  |
| `comment` | `string` | optional |  |

> `stateMeta` (`tracking.ts:3`) maps each state to a label, CSS class, color dot, and a numeric score (100/65/25). Per repo scan, this table is currently **not surfaced in any route** — defined in the type system and seeded, but no UI reads/writes it yet (flagged in the tickets file as "Not in UI").

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> Checkup is typed and seeded but flagged 'Unused' in the Data Model appendix (§3.12) — no endpoint exists for it yet. This ticket is exactly what would wire it up; design CRUD endpoints for it following the same pattern as Certificates/Referrals below.


---

### HOPE-V2-06 — OCR reading of lab reports

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 105 | 32 | todo | later, backend, frontend, v2 |

Simulated in the prototype.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Simulated drop zone in PatientDrawer Analyses section
- **Depends on:** —

**Subtasks**

1. Choose OCR provider
2. Review screen

**Acceptance criteria**

- Upload a lab report photo/PDF
- Extracted values proposed for review before saving

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Sample report — values extracted correctly

*Hope V2 · V2 · P2 · 8 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-06 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> ⚠️ OUT OF SCOPE: lab-result analyses/OCR are explicitly excluded from both appendices (see their scope notes) — see also HOPE-DOS-06 above.


---

### HOPE-V2-07 — Import a record from another software (CSV/PDF)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 106 | 32 | todo | later, backend, frontend, v2 |

Simulated in the prototype.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** Simulated 'Import de dossier' modal in PatientDrawer
- **Depends on:** —

**Subtasks**

1. Define import formats
2. Import job + preview

**Acceptance criteria**

- Import CSV/PDF from another software
- Preview and confirm before saving

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Import sample CSV — records created

*Hope V2 · V2 · P2 · 8 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-07 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Patient`** _(table)_ — Core patient record  
📄 Source: `types.ts:6`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ |  |
| `phone` | `string` | ✅ |  |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme" \| "femme"` | optional |  |
| `country` | `string` | optional |  |
| `coverage` | `"cnam"\|"assurance"\|"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if coverage="assurance" |
| `cnam` | `string` | ✅ | (always present, can be empty) — CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string (ISO)` | ✅ |  |
| `profession` | `string` | optional |  |
| `address` | `string` | optional |  |

Used in: `routes/patients.tsx` (list/search/create), `components/cabinet/PatientDrawer.tsx` (record view), `components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

> Patient ID generation (`makePatientCode`): initials from first+last name word, deterministic hash of the name → 6 digits, retried up to 1000 times against the `taken` list to avoid collisions. **This needs to become a server-side, transaction-safe sequence/constraint** — see ticket `HOPE-PAT-02`.

#### API endpoints used by this ticket

#### `GET /api/patients`
List / search patients  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:73 (filtered/sorted list), PatientPicker.tsx:32`

Request: Query: ?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true

Response:
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```

> `q` is accent-insensitive substring/trigram search on name, phone, patient code (server-side `unaccent`+`pg_trgm`, HOPE-PAT-01). `recent=true` = the “Récents” tab (10 most recently active). Response DTO differs by role: **secretaire** gets an administrative DTO (no clinical fields); **medecin**/**admin** get the full DTO.


#### `GET /api/patients/{id}`
Get one patient record  
**Auth:** session (role-scoped DTO) · **Source:** `patients.tsx:67,100,139, PatientDrawer.tsx:96`

Response: Single patient DTO — same shape as the list item above.


#### `POST /api/patients` 🔴
Create a patient (also used for quick-create while booking)  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:97-133 (create); AppointmentModal.tsx:53-70 (quick-create for a new patient)`

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```

Response:
```json
{ "id": "pat-hedi", "code": "HB-113987", "name": "Hédi Ben Salah", "...": "rest of the fields above", "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```

Errors: 400 Validation (format téléphone tunisien, date de naissance future, numéro CNAM requis si coverage=cnam)

> `code` is **not** sent by the client — generated server-side, unique per practice, retried on collision under concurrency (HOPE-PAT-02). Audit: *“Patient créé — {name}”*.


#### `POST /api/patients/duplicates-check`
Check for a likely-duplicate patient before creating one  
**Auth:** medecin, secretaire · **Source:** `patients.tsx:99-103 (Levenshtein ≤2 against existing names before create); also used by the quick-create-from-appointment flow`

Request:
```json
{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }
```

Response:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```

> `matchReason` ∈ name (Levenshtein ≤2 / trigram ≥0.6), phone (exact), birthDate (exact). Empty array = proceed straight to `POST /api/patients`.


#### `PATCH /api/patients/{id}` 🔴
Edit a patient's identity / allergies  
**Auth:** medecin, secretaire (identity fields only) · **Source:** `PatientDrawer.tsx:225-232 (save, general identity edit), PatientDrawer.tsx:803-812 (allergies-only edit)`

Request:
```json
{ "phone": "+216 22 999 888", "allergies": ["Pénicilline", "Iode"], "version": 4 }
```

Response: Updated patient DTO.

Errors: 409 Conflit — { "type": "https://hope.example/problems/conflict", "title": "Version conflict", "status": 409, "detail": "Patient was modified by another user.", "current": { "...": "latest server copy" } }

> Diff recorded in the audit event (HOPE-PAT-04). Audit: *“Patient modifié — {name}”*.


#### `POST /api/patients/{id}/archive` _(planned)_
Archive (soft-delete) a patient  
**Auth:** medecin, admin · **Source:** `planned — HOPE-PAT-05, not in prototype`

Request:
```json
{ }
```

Response: 204 No Content

> Sets `archivedAt`; patient disappears from default list/search but is retrievable with `?archived=true`.


#### `POST /api/patients/{id}/import-demo-history`
Prototype-only demo affordance — seeds fake history  
**Auth:** medecin · **Source:** `PatientDrawer.tsx:143-158 — “Import de dossier” button`

Request:
```json
{ }
```

Response: 201 Created — 4 synthetic past appointments

> ⚠️ Explicitly a prototype placeholder (per the app's own labeling) — should not exist in the real API. Listed here only for traceability, not as a real design.


#### Reference notes

> Import-from-other-software has no dedicated entity/endpoint below — it would map external records onto Patient (and its related tables) via the existing POST /api/patients / duplicates-check flow.


---

### HOPE-V2-08 — Offline mode (PWA + sync)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 107 | 52 | todo | later, backend, frontend, v2 |

Simulated in the prototype ('Simulate a network outage' checkbox).

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** 'Simuler une coupure réseau' toggle in Sidebar
- **Depends on:** —

**Subtasks**

1. PWA + local queue
2. Conflict strategy

**Acceptance criteria**

- App keeps working during short outages
- Changes sync without conflicts when back online

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Cut network, book appointment, reconnect — synced

*Hope V2 · V2 · P2 · 13 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-08 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> No endpoints documented — see the Data Model appendix §4 (Session/runtime state: offline, pending, syncing) which explicitly flags this as simulated in the prototype and out of v1 scope. This ticket is what designs the real write-queue + conflict-resolution-on-reconnect logic.


---

### HOPE-V2-09 — Arabic interface (RTL)

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 109 | 20 | todo | later, frontend, react, v2 |

Arabic translation of the interface with right-to-left layout.

- **Folder:** `src/`
- **Prototype reference:** —
- **Depends on:** —

**Subtasks**

1. i18n extraction
2. Arabic translation
3. RTL CSS review

**Acceptance criteria**

- All screens translated
- RTL layout correct
- Language switch per user

**Rejection criteria**

- Screen still reading or writing the localStorage store (useCabinet().data / update)
- Raw fetch calls outside the src/api client layer

**Test scenarios**

- Switch to Arabic — layout mirrors correctly

*Hope V2 · V2 · P2 · 5 pts. French version: V2-09 in docs/03-tickets.md.*

#### Data model used by this ticket

_No entity directly documented for this ticket — see reference notes below._

#### API endpoints used by this ticket

_No endpoint directly documented for this ticket — see reference notes below._

#### Reference notes

> i18n/RTL — no entity/endpoint mapping.


---

### HOPE-V2-10 — Interview grids for other specialties

| Priority | Day | Hours | Status | Tags |
|---|---|---|---|---|
| medium | 110 | 20 | todo | later, backend, frontend, v2 |

Additional interview grids (e.g. general medicine, cardiology) using the versioned grid engine from CONS-01.

- **Folder:** `src/ + hope-api/`
- **Prototype reference:** —
- **Depends on:** `HOPE-CONS-01`

**Subtasks**

1. Collect grid content with specialists
2. Load as new symptom_grid

**Acceptance criteria**

- New grid selectable per doctor
- Report generation works for the new grid

**Rejection criteria**

- Endpoint reachable without the role check from the access matrix (spec §3.2)
- Screen still reading or writing the localStorage store (useCabinet().data / update)

**Test scenarios**

- Doctor switches to the GP grid — consultation uses it

*Hope V2 · V2 · P2 · 5 pts. Backend path assumes a separate hope-api repository; confirm in FND-01. French version: V2-10 in docs/03-tickets.md.*

#### Data model used by this ticket

**`Diagnostic`** _(table)_ — Free-form patient interview / consultation — not a coded diagnosis  
📄 Source: `types.ts:213`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → Patient.id |
| `date` | `string (yyyy-MM-dd)` | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"\|"termine"` | ✅ | draft / finished |
| `authorId` | `string` | optional | FK-like → Doctor.id |
| `createdAt` | `string (ISO)` | ✅ |  |
| `updatedAt` | `string (ISO)` | ✅ |  |

> Legacy migration note (`store.tsx:82-100`): older data shape had a `answers: {question, answer}[]` array plus `freeNotes`; on load this is flattened into the single `content` string.

> The structured *symptom picker* (`GiInterviewForm`, backed by `gi-interview.ts`) is a **UI helper only** — it doesn't have its own table. It composes picked items into `Diagnostic.content` free text via `diagnostic-report.ts`'s report builder/parser. See §5.2.

> `CustomSymptomGroup` (`types.ts:304`, embedded in Doctor.customSymptomGroups[]): `id`, `title`, `items: string[]`, `extendsGroupId?` (if set, these items are appended to an existing built-in group instead of forming a new section).

> `ReportLine` (`diagnostic-report.ts:1`, not persisted — display-only parse of Diagnostic.content): `{ kind: "flag"|"section"|"sub"|"text", text }`.

#### API endpoints used by this ticket

#### `GET /api/reference/icd10`
Search the ICD-10 subset  
**Auth:** session · **Source:** `icd10.ts:62 (searchIcd)`

Request: Query: ?q=reflux&limit=8

Response:
```json
{ "content": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ] }
```


#### `GET /api/reference/gi-interview`
Get the structured GI interview grid  
**Auth:** medecin · **Source:** `gi-interview.ts (RED_FLAGS, SYMPTOM_GROUPS, EXTENDABLE_GROUPS, LOCALISATIONS, CARACTERISTIQUES, IRRADIATIONS, RELATIONS_REPAS, FACTEURS_AGGRAVANTS, FACTEURS_SOULAGEANTS, DEBUTS, EVOLUTIONS, BRISTOL, ATCD_*, PARENTES)`

Response:
```json
{
  "redFlags": [ { "id": "Dysphagie / odynophagie", "label": "Dysphagie / odynophagie" } ],
  "symptomGroups": [ { "id": "douleur", "title": "Douleur abdominale", "items": [ { "id": "Épigastralgie", "label": "Épigastralgie" } ] } ],
  "extendableGroups": [ { "id": "flags", "title": "Red flags" } ],
  "localisations": ["Épigastre", "HCD", "..."],
  "caracteristiques": ["Brûlure", "..."],
  "bristol": ["1", "2", "3", "4", "5", "6", "7"],
  "atcdMed": [ { "id": "HTA", "label": "HTA" } ]
}
```

> Merged server-side with the current doctor's customSymptomGroups. HOPE-CONS-01/HOPE-V2-10 note this should become versioned, specialty-selectable, database-backed content rather than a single hardcoded response.


#### `GET /api/reference/drug-classes`
List therapeutic drug classes  
**Auth:** medecin · **Source:** `types.ts:242 (DRUG_CLASSES)`

Response:
```json
{ "content": ["Antalgique", "AINS", "Antibiotique", "..."] }
```


#### `GET /api/reference/certificate-types`
List built-in certificate types  
**Auth:** medecin · **Source:** `types.ts:132 (BUILTIN_CERTIFICATE_TYPES)`

Response:
```json
{ "content": ["Arrêt de travail", "Aptitude sportive", "Certificat scolaire", "..."] }
```

> Merges with Settings.certificateTemplates (§13) for the full picker list.


#### `GET /api/reference/contact-kinds`
List built-in contact kinds  
**Auth:** session · **Source:** `types.ts:194 (CONTACT_KINDS)`

Response:
```json
{ "content": ["Confrère", "Laboratoire", "Fournisseur", "Autre"] }
```


#### Reference notes

> See Data Model appendix §5.2 — the GI interview grid needs to become data-driven/versioned/specialty-selectable rather than the hardcoded gi-interview.ts module. GET /api/reference/gi-interview below is the starting point.


---


## Part B — Full Data Model Reference (appendix)

> Verbatim copy of `docs/DATA-MODEL.md`, heading levels shifted down by one to nest under this document.

## Hope / Cabinet — Data Model Reference

> Extracted directly from the current prototype's TypeScript source
> (`src/lib/cabinet/types.ts`, `store.tsx`, `context.ts`, `seed.ts`,
> `tracking.ts`, `gi-interview.ts`, `prescriptions.ts`, `utils.ts`,
> `icd10.ts`, `credentials.ts`, `diagnostic-report.ts`) plus the routes
> and components that read/write each field. This is the authoritative
> field-by-field, table-by-table inventory to carry over into the real
> app (whether that ends up a Spring Boot/Postgres API + web front end,
> or a local `.exe` with an embedded database such as SQLite).
>
> Today the whole thing is **one JSON blob** in `localStorage` under the
> key `cabinet-data-v1`, typed as `CabinetData`. There is no server, no
> relational schema, and no foreign-key enforcement — relationships are
> just `string` id fields resolved with `Array.find()` at render time.
> This document turns that implicit shape into an explicit one.
>
> **Scope note:** `vaccinations`, `documents`, `payments` and `analyses`
> are intentionally excluded from this document (out of scope for now),
> even though the `CabinetData` type still declares those four
> collections (`Vaccination`, `CabinetDocument`, `Payment`, `Analysis` /
> `AnalysisValue`). If they come back in scope later, re-derive their
> sections from `src/lib/cabinet/types.ts` and `tracking.ts`.

---

### 1. High-level shape

`CabinetData` (`src/lib/cabinet/types.ts:339`) is the root object — the
"database". Of its 17 arrays + 1 embedded config object, the **13
in-scope collections** documented here are:

| # | Collection (array) | Row type | Primary key | Owned by | Row count in seed |
|---|---|---|---|---|---|
| 1 | `doctors` | `Doctor` | `id` | practice | 5 (3 médecin + 2 secrétaire) |
| 2 | `patients` | `Patient` | `id` | practice | 10 |
| 3 | `appointments` | `Appointment` | `id` | practice | many (generated) |
| 4 | `blocks` | `Block` | `id` | practice | few |
| 5 | `holidays` | `Holiday` | `id` | practice | few |
| 6 | `notes` | `Note` | `id` | patient | per patient |
| 7 | `prescriptions` | `Prescription` | `id` | patient | per patient |
| 8 | `certificates` | `Certificate` | `id` | patient | per patient |
| 9 | `referrals` | `Referral` | `id` | patient | few |
| 10 | `contacts` | `Contact` | `id` | practice | few |
| 11 | `diagnostics` | `Diagnostic` | `id` | patient | few |
| 12 | `audit` | `AuditEntry` | `id` | practice | capped at 400 |
| 13 | `checkups` | `Checkup` | `id` | patient | few |
| — | `settings` | `Settings` | *(singleton, no id)* | practice | 1 |

There is **no `cabinet_id` / tenant column anywhere** — the prototype is
single-practice by construction (everything lives in one browser's
`localStorage`). A real multi-tenant backend must add a practice/tenant
key to every row below (see §8).

---

### 2. Entity-relationship diagram

```
Doctor (practice staff, 1..N)
  │ id
  │
  ├──< Appointment.resourceId?  (only if resource kind = "praticien")
  ├──< Note.authorId
  ├──< Diagnostic.authorId
  ├──< AuditEntry.actor          (by name snapshot, not FK)
  └──< Doctor.customSymptomGroups (embedded, 1:N, owned by the doctor)

Patient (1)
  │ id
  ├──< Appointment.patientId        (1:N)
  ├──< Note.patientId               (1:N)   -- includes structured "consultation" fields
  ├──< Prescription.patientId       (1:N)   -- Prescription.renewedFrom -> Prescription.id (self-ref)
  ├──< Certificate.patientId        (1:N)
  ├──< Referral.patientId           (1:N)   -- Referral.contactId -> Contact.id
  ├──< Diagnostic.patientId         (1:N)
  └──< Checkup.patientId            (1:N)

Appointment
  ├── patientId -> Patient.id
  ├── category  -> Settings.appointmentCategories[].id (string, not enforced)
  └── resourceId -> Settings.resources[].id (string, not enforced)

Block / Holiday
  └── no FK — pure calendar rows (date range / single date) that block the agenda

Contact (address book: colleague / lab / supplier)
  └──< Referral.contactId (nullable, 1:N)

Settings (singleton, embedded sub-objects)
  ├── favorites: Favorite[]                (prescription "quick add" items)
  ├── protocols: Protocol[]                (bundles of favorite lines)
  ├── appointmentCategories: AppointmentCategory[]
  ├── resources: Resource[]                (room / equipment / practitioner)
  └── certificateTemplates: CertificateTemplate[]

Static reference data (not stored, shipped as constants — see §5)
  ICD10[]            <- Note.icd[] (embedded snapshot, code+label copied in)
  SYMPTOM_GROUPS[]    <- consumed by GiInterviewForm, answers flattened into Diagnostic.content (free text)
  DRUG_CLASSES[]      <- Favorite.drugClass (free string, validated against this list in the UI only)
  CONTACT_KINDS[]     <- Contact.kind (free string)
  BUILTIN_CERTIFICATE_TYPES[] <- Certificate.type / CertificateTemplate.type (free string)
```

Every "FK" above is a **plain string equality match**, resolved client-side
(`Array.find(x => x.patientId === id)`). Nothing prevents an orphan
`patientId` today; a real schema must add real foreign keys + cascade rules
(see §8).

---

### 3. Tables in full detail

Each table below lists every field, its TypeScript type, optionality,
meaning, and where it's read/written in the UI. French inline comments
from the source are translated/kept for context since the product is
French-language.

#### 3.1 `Doctor` — practice staff account (`types.ts:313`)

Despite the name, this table holds **both `medecin` and `secretaire`**
accounts — it's the full staff/user table, doubling as an HR record for
non-medical staff.

**Role & account-creation model** — three roles exist, and who can
create whom is asymmetric:

| Role | Login | Confined to | Can create |
|---|---|---|---|
| `admin` | `Settings.adminEmail`/`adminPassword` — a *separate* login, not a `Doctor` row | `/admin` only (`__root.tsx:149`: an admin session is force-redirected to `/admin` on every other path) | Both **`medecin`** and **`secretaire`** accounts — `/admin`'s account form has a `Rôle` select offering both (`admin.tsx:409-417`) |
| `medecin` | `Doctor` row, `role: "medecin"` | Every route except `/admin`'s intended audience (see gap below) | Only **`secretaire`** accounts, via `/personnel` — the creation form there hardcodes `role: "secretaire"` (`personnel.tsx:142`); there is no UI path for a `medecin` to create another `medecin` |
| `secretaire` | `Doctor` row, `role: "secretaire"` | The 6 routes in `SECRETAIRE_ALLOWED` (see below) | Nothing — `/personnel` explicitly refuses secretary sessions ("Accès réservé au médecin", `personnel.tsx:72-79`), and `/admin` is outside `SECRETAIRE_ALLOWED` |

⚠️ **Confirmed gap, not present in either appendix before this pass**:
`/admin` (`routes/admin.tsx`) has **no role guard of its own**. `isAdmin`
only (a) shows/hides the Sidebar link and (b) forces an *admin* session
to stay on `/admin` — it never checks that a `medecin` (or, absent the
`SECRETAIRE_ALLOWED` block, a `secretaire`) session is disallowed from
*entering* `/admin`. In the running prototype, a logged-in `medecin`
who types `/admin` in the URL reaches the full account-management
screen — including the role selector that lets them create/deactivate
*other doctors*, not just secretaries. This is exactly the kind of
"client-only role check without server enforcement" `HOPE-AUTH-06`'s
rejection criteria calls out; the real API's `@PreAuthorize` must
restrict every `/api/staff*` mutation with `role: "medecin"` in the
body to `admin` only, regardless of what the front-end route allows.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | Full name |
| `specialty` | `string` | ✅ | e.g. "Gastro-entérologie" for a `medecin`; also used as a **job title** for `secretaire` rows (seed: "Secrétariat médical", "Assistante médicale") — ⚠️ corrected, an earlier pass of this document wrongly said "secretaries: usually blank" |
| `email` | `string` | ✅ | **Login identifier**, must be unique per practice |
| `phone` | `string` | ✅ | |
| `licenseNumber` | `string` | ✅ | Medical license / ordre number |
| `password` | `string` | ✅ | **Plain text in prototype** — see §7 Security notes |
| `active` | `boolean` | ✅ | Deactivated accounts can't log in; used instead of delete |
| `createdAt` | `string` (ISO) | ✅ | |
| `lastPasswordResetAt` | `string` (ISO) | optional | Shown instead of the password in the admin UI |
| `role` | `UserRole` = `"medecin"` \| `"secretaire"` | ✅ | Drives route guards (`SECRETAIRE_ALLOWED` in `__root.tsx`) |
| `photo` | `string` (dataURL) | optional | Resized client-side to 400px via `resizeImage()` |
| `birthDate` | `string` | optional | HR field |
| `cin` | `string` | optional | National ID card number (Tunisia) |
| `address` | `string` | optional | HR field |
| `hiredAt` | `string` | optional | HR field |
| `contractType` | `"CDI"` \| `"CDD"` \| `"Stage"` \| `"Temps partiel"` | optional | HR field |
| `bank` | `string` | optional | HR field |
| `rib` | `string` | optional | Bank account (20-digit RIB), HR field |
| `emergencyContact` | `string` | optional | HR field |
| `notes` | `string` | optional | Free HR notes |
| `customSymptomGroups` | `CustomSymptomGroup[]` | optional | **Embedded 1:N** — per-doctor customization of the structured interview grid (see §3.17) |

Used in: `routes/admin.tsx`, `routes/personnel.tsx`,
`components/cabinet/LockScreen.tsx` (login + quick-login),
`components/cabinet/SendCredentialsModal.tsx`.

Session/runtime fields (not persisted — see `context.ts`):
`currentUser: Doctor | null`, `role: "medecin" | "secretaire" | "admin"`
(admin is a *separate* login, not a `Doctor` row — see §3.19 Settings).

A `secretaire` session is further restricted client-side by
`SECRETAIRE_ALLOWED` (`__root.tsx:133-140`) to exactly 6 routes: `/`,
`/rappels`, `/patients`, `/agenda`, `/tracker`, `/annuaire`. Not
modeled as data — see §7 point 8.

**This one table holds three roles' worth of unrelated fields** —
medical (`licenseNumber`, `customSymptomGroups`) and HR
(`cin`/`rib`/`bank`/`hiredAt`/`contractType`/`emergencyContact`/…),
regardless of which role actually uses them. §8 recommends splitting
this into a base `app_user` identity row plus a **separate
`doctor_profile` table** and a **separate `staff_profile` table**
(secretary's own extension table), each related to `app_user` by a
1:1 `user_id` FK — not the other way around (staff isn't "inside"
doctor, they're siblings off the same base row). See §7 point 10 and
§8 for the full table definitions.

---

#### 3.2 `Patient` (`types.ts:6`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `code` | `string` | ✅ | **Generated unique ID**, format `XX-000000` (2 initials + 6 digits), see `makePatientCode()` in `utils.ts:83` |
| `name` | `string` | ✅ | |
| `phone` | `string` | ✅ | |
| `birthDate` | `string` | ✅ | Age computed on the fly via `ageFrom()` (`utils.ts:101`), never stored |
| `sex` | `"homme"` \| `"femme"` | optional | |
| `country` | `string` | optional | |
| `coverage` | `"cnam"` \| `"assurance"` \| `"aucune"` | optional | Insurance status |
| `insurer` | `string` | optional | Private insurer name, relevant if `coverage="assurance"` |
| `cnam` | `string` | ✅ (always present, can be empty) | CNAM (Tunisian national health insurance) number |
| `allergies` | `string[]` | ✅ | Free-text list; checked against prescriptions via `lineConflicts()` |
| `chronic` | `string[]` | ✅ | Chronic conditions / chronic treatments; also checked against prescriptions |
| `createdAt` | `string` (ISO) | ✅ | |
| `profession` | `string` | optional | |
| `address` | `string` | optional | |

Used in: `routes/patients.tsx` (list/search/create),
`components/cabinet/PatientDrawer.tsx` (record view),
`components/cabinet/PatientPicker.tsx`, `GlobalSearch.tsx`.

Patient ID generation (`makePatientCode`): initials from first+last
name word, deterministic hash of the name → 6 digits, retried up to
1000 times against the `taken` list to avoid collisions. **This needs
to become a server-side, transaction-safe sequence/constraint** — see
ticket `HOPE-PAT-02` in the tickets file.

---

#### 3.3 `Appointment` (`types.ts:24`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → `Patient.id` |
| `date` | `string` (`yyyy-MM-dd`) | ✅ | |
| `time` | `string` (`HH:mm`) | ✅ | |
| `reason` | `string` | ✅ | Free text |
| `status` | `AppointmentStatus` = `"upcoming"` \| `"done"` \| `"absent"` | ✅ | Simple 3-state status (⚠️ the ticket file describes a richer unified status machine — confirm/check-in/call/finish/no-show/cancel — for the real API; this prototype only has 3 states) |
| `category` | `string` | optional | FK-like → `Settings.appointmentCategories[].id` |
| `resourceId` | `string` | optional | FK-like → `Settings.resources[].id` (room / equipment / practitioner) |
| `checkedInAt` | `string` (ISO) | optional | Arrival timestamp, drives the waiting-room tracker |
| `tracker` | `TrackerStatus` = `"waiting"` \| `"in_consult"` \| `"done"` | optional | Waiting-room flow position, independent from `status` |

Used in: `routes/agenda.tsx`, `routes/tracker.tsx` (waiting room board),
`routes/index.tsx` (today's dashboard), `AppointmentModal.tsx`,
`routes/patients.tsx` (patient's appointment history).

Note: cancelling in this prototype is not a distinct status — there's
no `"cancelled"` state; the real spec calls for one (never delete the
row).

---

#### 3.4 `Block` (`types.ts:37`) — agenda block-out

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string` | ✅ | |
| `start` | `string` (`HH:mm`) | ✅ | |
| `end` | `string` (`HH:mm`) | ✅ | |
| `reason` | `string` | ✅ | e.g. "Congé", "Formation" |

Used in `routes/agenda.tsx` to grey out slots.

#### 3.5 `Holiday` (`types.ts:46`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string` (`yyyy-MM-dd`) | ✅ | |
| `label` | `string` | ✅ | e.g. "Aïd el-Fitr" |

Blocks the whole day automatically in `agenda.tsx` / `index.tsx`.

#### 3.6 `Resource` (`types.ts:52`) — *embedded in `Settings.resources[]`, not a top-level table*

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | |
| `kind` | `"salle"` \| `"équipement"` \| `"praticien"` | ✅ | |

#### 3.7 `AppointmentCategory` (`types.ts:58`) — *embedded in `Settings.appointmentCategories[]`*

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `label` | `string` | ✅ | e.g. "Consultation", "Contrôle" |
| `color` | `string` (hex) | ✅ | Calendar color coding |

---

#### 3.8 `Note` (`types.ts:76`) — clinical note / consultation record

The most overloaded table: it stores **both free-text notes and
structured consultation data** in the same row.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → `Patient.id` |
| `date` | `string` | ✅ | |
| `text` | `string` | ✅ | Free-text body |
| `attachments` | `NoteAttachment[]` | optional | Embedded 1:N, see §3.9 |
| `motif` | `string` | optional | Structured consultation: chief complaint |
| `exam` | `string` | optional | Structured consultation: physical exam |
| `diagnosis` | `string` | optional | Structured consultation: diagnosis |
| `plan` | `string` | optional | Structured consultation: plan |
| `icd` | `IcdCode[]` | optional | Embedded snapshot of picked ICD-10 codes (see §5.1) — copied by value, not by reference |
| `authorId` | `string` | optional | FK-like → `Doctor.id` |

#### 3.9 `NoteAttachment` (`types.ts:64`) — embedded in `Note.attachments[]`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `name` | `string` | ✅ | File name |
| `type` | `string` | ✅ | MIME type |
| `dataUrl` | `string` | ✅ | Base64 inline — **must become a real file store / object storage in the real app** |

#### 3.10 `IcdCode` (`types.ts:71`) — embedded value object

| Field | Type | Required |
|---|---|---|
| `code` | `string` | ✅ |
| `label` | `string` | ✅ |

---

#### 3.11 `Prescription` (`types.ts:91`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → `Patient.id` |
| `date` | `string` | ✅ | |
| `text` | `string` | ✅ | Full rendered prescription body (multi-line, built from `Favorite` lines via `renderFavorite()`) |
| `renewedFrom` | `string` | optional | **Self-referencing FK** → `Prescription.id` of the original prescription being renewed |

Conflict checking: `lineConflicts()` (`prescriptions.ts:64`) cross-checks
each line's drug name against `Patient.allergies` and `Patient.chronic`,
including a small hardcoded cross-allergy table (penicillins,
sulfonamides, aspirin, iodine). This logic needs to move server-side
and ideally use a real drug database instead of substring matching.

---

#### 3.12 `Checkup` (`types.ts:117`) — manual clinical follow-up point

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → `Patient.id` |
| `date` | `string` | ✅ | |
| `state` | `PatientState` = `"mieux"` \| `"stable"` \| `"moins_bien"` | ✅ | Doctor's subjective assessment |
| `weight` | `number` (kg) | optional | |
| `systolic` | `number` (mmHg) | optional | |
| `diastolic` | `number` (mmHg) | optional | |
| `heartRate` | `number` (bpm) | optional | |
| `temperature` | `number` (°C) | optional | |
| `pain` | `number` (0–10) | optional | |
| `comment` | `string` | optional | |

`stateMeta` (`tracking.ts:3`) maps each state to a label, CSS class,
color dot, and a numeric `score` (100/65/25). Per repo scan, this table
is currently **not surfaced in any route** — defined in the type system
and seeded, but no UI reads/writes it yet (dead/unused feature in the
prototype, flagged in the tickets file as "Not in UI").

---

#### 3.13 `Certificate` (`types.ts:146`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → `Patient.id` |
| `type` | `string` | ✅ | One of `BUILTIN_CERTIFICATE_TYPES` (§5.4) or a custom `CertificateTemplate.type` |
| `documentDate` | `string` | ✅ | Date printed on the document |
| `startDate` | `string` | optional | For sick-leave certificates |
| `days` | `number` | optional | Sick-leave duration |
| `endDate` | `string` | optional | Computed from `startDate + days` |
| `text` | `string` | ✅ | Rendered certificate body |
| `createdAt` | `string` (ISO) | ✅ | |

Used in `routes/certificats.tsx` (monthly register, print/duplicate).

#### 3.14 `CertificateTemplate` (`types.ts:141`) — *embedded in `Settings.certificateTemplates[]`*

| Field | Type | Required |
|---|---|---|
| `type` | `string` | ✅ |
| `text` | `string` | ✅ |

---

#### 3.15 `Referral` (`types.ts:159`) — letter to a specialist

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → `Patient.id` |
| `specialty` | `string` | ✅ | Target specialty |
| `contactId` | `string` | optional | FK → `Contact.id` (recipient) |
| `reason` | `string` | ✅ | |
| `documentDate` | `string` | ✅ | |
| `text` | `string` | ✅ | Rendered letter body |
| `createdAt` | `string` (ISO) | ✅ | |

Used in `routes/orientations.tsx`.

#### 3.16 `Contact` (`types.ts:197`) — address book entry

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | |
| `kind` | `string` | ✅ | One of `CONTACT_KINDS` (§5.5) or free text |
| `specialty` | `string` | optional | |
| `phone` | `string` | optional | |
| `email` | `string` | optional | |
| `address` | `string` | optional | |
| `notes` | `string` | optional | |

Used in `routes/annuaire.tsx`, referenced by `Referral.contactId`.

---

#### 3.17 `Diagnostic` (`types.ts:213`) — free-form patient interview / consultation

Despite the type name ("Diagnostic"), this is a **free-text interview
record**, not a coded diagnosis. The doctor questions the patient
verbally and types only the answers.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `patientId` | `string` | ✅ | FK → `Patient.id` |
| `date` | `string` (`yyyy-MM-dd`) | ✅ | Interview date |
| `reason` | `string` | optional | Main complaint |
| `content` | `string` | ✅ | Free text — patient's answers, typed by the doctor |
| `status` | `"brouillon"` \| `"termine"` (draft / finished) | ✅ | |
| `authorId` | `string` | optional | FK-like → `Doctor.id` |
| `createdAt` | `string` (ISO) | ✅ | |
| `updatedAt` | `string` (ISO) | ✅ | |

Legacy migration note (`store.tsx:82-100`): older data shape had a
`answers: {question, answer}[]` array plus `freeNotes`; on load this is
flattened into the single `content` string. Any new schema doesn't need
to preserve that legacy shape, just the final flattened text.

The structured *symptom picker* (`GiInterviewForm`, backed by
`gi-interview.ts`) is a **UI helper only** — it doesn't have its own
table. It offers checkbox groups (red flags, pain, reflux, stomach,
transit, bleeding, hepato-biliary-pancreatic, ano-rectal, general
signs, extra-digestive signs, past medical/surgical/family history) and
free-form fields (location, character, radiation, meal relation,
aggravating/relieving factors, onset, evolution, Bristol scale), and
composes the picked items into the `Diagnostic.content` free-text
string via `diagnostic-report.ts`'s report builder/parser. See §5.2 for
the full reference list.

`CustomSymptomGroup` (`types.ts:304`, embedded in
`Doctor.customSymptomGroups[]`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `title` | `string` | ✅ | |
| `items` | `string[]` | ✅ | |
| `extendsGroupId` | `string` | optional | If set, these items are appended to an existing built-in group instead of forming a new section |

`ReportLine` (`diagnostic-report.ts:1`, not persisted — a display-only
parse of `Diagnostic.content`): `{ kind: "flag"|"section"|"sub"|"text", text }`.

---

#### 3.18 `AuditEntry` (`types.ts:226`) — activity log

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `at` | `string` (ISO) | ✅ | |
| `actor` | `string` | ✅ | **Name snapshot**, not an FK — resolved once at write time from the current user (`store.tsx:151-152`) |
| `summary` | `string` | ✅ | Human-readable description of the action |

Written centrally by the `update()` function in `store.tsx:146-159`,
whenever a caller passes an `audit` message. **Capped at 400 entries**
(`.slice(0, 400)`, `store.tsx:154`) — oldest entries silently dropped.
This cap and the lack of structured `action`/`entity`/`entityId`/`diff`
fields is exactly what the tickets file flags as needing a real
append-only, ungapped audit table server-side (no UPDATE/DELETE grants,
structured columns, no row cap).

---

#### 3.19 `Settings` (`types.ts:284`) — singleton practice configuration

Not an array — one object at `CabinetData.settings`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorName` | `string` | ✅ | Printed on documents |
| `specialty` | `string` | ✅ | |
| `address` | `string` | ✅ | Practice address, printed on documents |
| `phone` | `string` | ✅ | |
| `licenseNumber` | `string` | ✅ | |
| `favorites` | `Favorite[]` | ✅ | Embedded 1:N — see §3.20 |
| `protocols` | `Protocol[]` | ✅ | Embedded 1:N — see §3.21 |
| `consultDuration` | `number` (minutes) | ✅ | Default appointment slot length |
| `password` | `string` | ✅ | **Fallback password for the main doctor account** (separate from `Doctor.password`!) |
| `adminEmail` | `string` | ✅ | Separate **admin** login, not a `Doctor` row |
| `adminPassword` | `string` | ✅ | Admin login password (plain text in prototype) |
| `lockDelay` | `number` (minutes, `0` = never) | ✅ | Auto-lock inactivity timer, per-practice today (should likely be per-user) |
| `theme` | `"light"` \| `"dark"` \| `"system"` | ✅ | |
| `appointmentCategories` | `AppointmentCategory[]` | ✅ | Embedded 1:N — see §3.7 |
| `resources` | `Resource[]` | ✅ | Embedded 1:N — see §3.6 |
| `certificateTemplates` | `CertificateTemplate[]` | ✅ | Embedded 1:N — see §3.14 |

Used across `routes/parametres.tsx` and almost every print/document
view (header/footer branding).

**Important design smell to resolve in the real app**: there are *three
independent credential pairs* today — `Doctor.email`/`Doctor.password`
per staff row, plus `Settings.password` (main doctor fallback) and
`Settings.adminEmail`/`Settings.adminPassword` (a *separate* admin
login not tied to any `Doctor` row). A real auth model should probably
collapse these into one `app_user` table with a role, as the tickets
file's `HOPE-AUTH-*` series assumes.

#### 3.20 `Favorite` (`types.ts:263`) — quick-add prescription line, *embedded in `Settings.favorites[]`*

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `label` | `string` | ✅ | Drug name + dosage, e.g. "Paracétamol 1 g" |
| `form` | `string` | optional | Comprimé, gélule, sachet, sirop, inhalateur… |
| `posology` | `string` | ✅ | e.g. "1 cp x 3/j" |
| `duration` | `string` | optional | e.g. "5 jours" |
| `route` | `string` | optional | Orale, cutanée, inhalée… |
| `note` | `string` | optional | e.g. "au milieu du repas" |
| `drugClass` | `string` | optional | One of `DRUG_CLASSES` (§5.3) or free text |
| `uses` | `number` | optional | Usage counter, powers "most used" sort |

`renderFavorite()` (`prescriptions.ts:25`) turns a `Favorite` into one
prescription text line: `label (form) - posology, duration - note`.
`parseLegacyFavorite()` handles the reverse for migrating old
plain-string favorites.

#### 3.21 `Protocol` (`types.ts:276`) — prescription template, *embedded in `Settings.protocols[]`*

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `name` | `string` | ✅ | e.g. "Angine bactérienne (adulte)" |
| `category` | `string` | optional | |
| `note` | `string` | optional | |
| `lines` | `string[]` | ✅ | Ready-to-insert prescription lines for a common situation |

---

### 4. Session / runtime state (not persisted)

Held in React state inside `CabinetProvider` (`store.tsx`), exposed via
`useCabinet()` (`context.ts`). These are **not part of `CabinetData`**
and vanish on reload — relevant for the real app's session/auth design:

| Field | Type | Purpose |
|---|---|---|
| `hydrated` | `boolean` | Whether localStorage has been read yet |
| `offline` | `boolean` | Simulated network-loss toggle (Sidebar "Simuler une coupure réseau") |
| `pending` | `number` | Count of unsynced writes while "offline" |
| `syncing` / `justSynced` | `boolean` | Simulated sync animation state |
| `locked` | `boolean` | Whether the lock screen is showing |
| `isAdmin` | `boolean` | True if logged in via the separate admin login |
| `currentUserId` / `currentUser` | `string \| null` / `Doctor \| null` | Logged-in staff member |
| `role` | `"medecin" \| "secretaire" \| "admin"` | Effective session role, drives route guards |

Real app equivalents: `offline`/`pending`/`syncing` map to a real
offline-sync/PWA design (`HOPE-V2-08`, explicitly out of v1 scope);
`locked`/`lockDelay` map to `HOPE-AUTH-04`; `currentUser`/`role`/`isAdmin`
map to a real JWT session (`HOPE-AUTH-01`, `HOPE-AUTH-06`).

---

### 5. Static reference data (shipped as constants, not stored rows)

#### 5.1 ICD-10 subset (`icd10.ts`)
`ICD10: IcdCode[]` — a short hand-picked subset of common general-medicine
codes (hypertension, diabetes, URTIs, GERD, etc.), each `{code, label}`.
`searchIcd(query, limit=8)` does a simple substring/prefix search. Picked
codes are **copied by value** into `Note.icd[]`, not referenced by code
alone — so the reference table can change without corrupting historical
notes. A real app likely wants the full CIM-10 (or ICD-11) reference table
server-side, searchable, with the same copy-on-select semantics preserved.

#### 5.2 Structured interview reference data (`gi-interview.ts`)
Specialty-specific (gastro-enterology) helper content for
`GiInterviewForm`, all shipped as constants — **not stored per row**,
only their picked/typed results end up in `Diagnostic.content`:

- `RED_FLAGS` — 14 alarm symptoms.
- `SYMPTOM_GROUPS` — 10 groups × items: douleur abdominale, reflux/œsophage,
  estomac/duodénum, transit intestinal, saignement digestif,
  hépato-bilio-pancréatique, symptômes anorectaux, signes généraux,
  signes extra-digestifs.
- `EXTENDABLE_GROUPS` — the above + a virtual "flags" target, used so a
  doctor's `CustomSymptomGroup.extendsGroupId` can append to any of them.
- Free-form option lists: `LOCALISATIONS`, `CARACTERISTIQUES`,
  `IRRADIATIONS`, `RELATIONS_REPAS`, `FACTEURS_AGGRAVANTS`,
  `FACTEURS_SOULAGEANTS`, `DEBUTS`, `EVOLUTIONS`, `BRISTOL` (1–7 scale).
- History checklists: `ATCD_MED` (17 items), `ATCD_DIG` (13),
  `ATCD_HEPATO` (18), `ATCD_CHIR` (12), `ATCD_FAM` (10).
- `PARENTES` — relation list for family history (Père, Mère,
  Frère/Sœur, Enfant, Autre).

This whole reference set is specialty-specific (HGE = gastroenterology).
The tickets file's `HOPE-V2-10` ("Interview grids for other
specialties") implies this needs to become data-driven/versioned in the
database rather than a hardcoded TS module, so other specialties can
get their own grid — see `HOPE-CONS-01` ("Versioned interview-grid
reference data in the database").

#### 5.3 `DRUG_CLASSES` (`types.ts:242`) — 17 therapeutic class labels
(Antalgique, AINS, Antibiotique, Antipyrétique, IPP/anti-acide,
Antihypertenseur, Antidiabétique, Hypolipémiant, Corticoïde,
Antihistaminique, Bronchodilatateur, Antitussif, Antispasmodique,
Anxiolytique/hypnotique, Vitamine/supplément, Dermatologie, Autre).

#### 5.4 `BUILTIN_CERTIFICATE_TYPES` (`types.ts:132`) — 5 built-in types
(Arrêt de travail, Aptitude sportive, Certificat scolaire, Certificat
de grossesse, Certificat de vaccination). Extensible via
`Settings.certificateTemplates`.

#### 5.5 `CONTACT_KINDS` (`types.ts:194`) — 4 built-in kinds
(Confrère, Laboratoire, Fournisseur, Autre). `Contact.kind` accepts any
string, these are just UI suggestions.

---

### 6. Cross-cutting derived/computed logic (not stored, computed at read time)

These are pure functions over the tables above — important to reproduce
server-side (or in shared logic) so the real app's numbers match:

| Function | File | Inputs | Output |
|---|---|---|---|
| `ageFrom(birthDate)` | `utils.ts:101` | `Patient.birthDate` | age in years, `null` if invalid/future/≥130 |
| `makePatientCode(name, taken)` | `utils.ts:83` | `Patient.name` + existing codes | unique `XX-000000` code |
| `levenshtein(a,b)` | `utils.ts:62` | two strings | edit distance (accent/case-insensitive) — used for duplicate-name detection |
| `matches(haystack,needle)` | `utils.ts:80` | two strings | accent/case-insensitive substring match — used for search |
| `renderFavorite(f)` | `prescriptions.ts:25` | `Favorite` | one prescription text line |
| `parseLegacyFavorite(raw)` | `prescriptions.ts:35` | legacy string | `Favorite` |
| `lineConflicts(line, allergies, chronic)` | `prescriptions.ts:64` | prescription line + `Patient.allergies`/`chronic` | `{allergy: string[], chronic: string[]}` matches, including a hardcoded cross-allergy table |
| `searchIcd(query, limit)` | `icd10.ts:62` | text | matching `IcdCode[]` |
| `parseReport(content)` | `diagnostic-report.ts:7` | `Diagnostic.content` | `ReportLine[]` for display (flag/section/sub/text) |
| `randomPassword(length)` | `credentials.ts:6` | — | generated password for new accounts |
| `buildCredentialsEmail(doc, password, cabinetName)` | `credentials.ts:17` | `Doctor` + password | `{to, subject, body}` (currently simulated, never actually sent — see `SendCredentialsModal.tsx`) |

> `tracking.ts`'s marker/trend/score helpers (`markerSeries`, `inRange`,
> `analysisScore`, `markerTrend`, `globalTrend`) operate on `Analysis[]`
> data and are out of scope per the exclusion above.

---

### 7. Security / data-hygiene issues visible directly in this schema

Carried over into the real app's design (matches the `HOPE-AUTH-*`
tickets):

1. **Plain-text passwords everywhere**: `Doctor.password`,
   `Settings.password`, `Settings.adminPassword` are all stored and
   handled as plain strings client-side — must become server-side
   Argon2id hashes, never returned in any response.
2. **No password ever leaves the client via a real channel** —
   `SendCredentialsModal` and `credentials.ts` *simulate* sending
   credentials by email; nothing is actually transmitted. A real
   activation/reset flow must use single-use links, not password
   delivery.
3. **No tenant isolation column** — single-practice by construction.
   Every table needs a `cabinet_id`/`practice_id` FK in a multi-tenant
   backend, enforced server-side (RLS or an equivalent filter), not
   just filtered in the UI.
4. **No server-side audit** — `AuditEntry` is written client-side only,
   capped at 400 rows, with a free-text `actor`/`summary` instead of
   structured `action`/`entity`/`entityId`/`diff` columns, and nothing
   stops a client from skipping the audit call entirely.
5. **Base64 files inline in JSON** (`NoteAttachment.dataUrl`,
   `Doctor.photo`) — must move to real object/blob storage with the
   table holding only a reference (URL/key), for both size and
   access-control reasons.
6. **No optimistic concurrency** — nothing like a `version` column
   exists on any row; concurrent edits silently overwrite each other
   (`localStorage` is single-writer today, but a real multi-user app
   needs it, matching `HOPE-PAT-04`'s `ConflictDialog` requirement).
7. **No soft-delete/archive flag** on `Patient` (or most other tables)
   — `active` exists only on `Doctor`. Everything else that shouldn't
   be hard-deleted (patients, appointments-as-cancel) needs an explicit
   status/flag instead of row removal.
8. **Route-level RBAC is a hardcoded array, not modeled data** —
   `SECRETAIRE_ALLOWED` (`src/routes/__root.tsx:133-140`) is a
   client-only whitelist of exactly six paths a `secretaire` session
   may open: `/`, `/rappels`, `/patients`, `/agenda`, `/tracker`,
   `/annuaire`. Every other route (`/ordonnances`, `/certificats`,
   `/orientations`, `/personnel`, `/parametres`, `/admin`, `/journal`,
   `/historique/$id`) is *meant* for medecin/admin — but see point 9,
   that boundary isn't actually enforced for `medecin` either. Nothing
   server-side enforces any of this today — it's exactly the gap
   `HOPE-AUTH-06`'s access matrix (spec §3.2) must close, and the real
   `@PreAuthorize`/role check per endpoint should reproduce this same
   six-route boundary for the secretary role, not just the
   client-side guard.
9. **`/admin` has no role guard of its own** — `isAdmin` only toggles
   the Sidebar link and force-redirects an *admin* session back to
   `/admin`; it never blocks a `medecin` session from navigating there
   directly (`routes/admin.tsx` has zero role check of its own). A
   logged-in doctor who types `/admin` in the URL reaches the full
   account-management screen today, including the role selector that
   creates/deactivates *other doctors*. The real API's
   `@PreAuthorize` must restrict every `/api/staff*` mutation with
   `role: "medecin"` in the body to `admin` only, regardless of what
   the front-end route allows.
10. **Medical fields and HR fields share one row regardless of role** —
    `Doctor.licenseNumber` is only ever meaningful for `medecin` (the
    prototype stores the placeholder `"—"` for every `secretaire`);
    `Doctor.cin`/`rib`/`bank`/`hiredAt`/`contractType`/
    `emergencyContact` are only ever set by `routes/personnel.tsx`,
    which exclusively operates on `secretaire` rows. See §8's
    `doctor_profile`/`staff_profile` split for the real-schema fix.

---

### 8. Suggested relational schema (normalized, for the real backend)

A straightforward mapping of §3 into SQL tables, adding what's missing
(tenant key, timestamps, versioning) without changing the product's
actual data shape. Types are indicative (Postgres-flavored); adapt for
SQLite if building a local `.exe` with an embedded DB instead.

```
cabinet(id, name, address, phone, license_number, specialty,
        lock_delay_minutes, theme, consult_duration_minutes,
        created_at)

-- The prototype's Doctor is ONE flat row for every role, mixing
-- auth/identity fields with medecin-only fields (license_number,
-- custom symptom groups) and secretaire-only HR fields (cin, rib,
-- bank, …) that no UI ever sets on a medecin row. Split into a base
-- identity table + two 1:1 role-profile tables instead — this is
-- the "separate table for secretary/staff, related to the doctor
-- table" the schema should have:

app_user(id, cabinet_id FK, name, specialty, email UNIQUE(cabinet_id,email),
         phone, password_hash, role ENUM(medecin,secretaire,admin),
         active, created_at, updated_at, last_password_reset_at, version)
         -- base identity/auth row, shared by all 3 roles.
         -- specialty doubles as job title for secretaire (e.g. "Secrétariat médical").

doctor_profile(user_id FK -> app_user PK, license_number)
         -- 1:1 extension, medecin only. Empty/absent for secretaire and admin rows.

staff_profile(user_id FK -> app_user PK, photo_ref, birth_date, cin,
              address, hired_at, contract_type, bank, rib,
              emergency_contact, notes)
         -- 1:1 extension, secretaire only (the HR record built by
         -- routes/personnel.tsx). Empty/absent for medecin and admin
         -- rows. NOT a "this secretary reports to that doctor" link —
         -- no such relation exists in the prototype; secretary
         -- accounts belong to the practice (cabinet_id via app_user),
         -- not to an individual doctor.

custom_symptom_group(id, doctor_id FK -> doctor_profile.user_id, title,
                      extends_group_id NULL, sort_order)
custom_symptom_item(id, group_id FK, label, sort_order)

patient(id, cabinet_id FK, code UNIQUE(cabinet_id,code), name, phone,
        birth_date, sex, country, coverage, insurer, cnam,
        profession, address, archived_at NULL,
        created_at, updated_at, version)
patient_allergy(id, patient_id FK, label)
patient_chronic_condition(id, patient_id FK, label)

appointment_category(id, cabinet_id FK, label, color)
resource(id, cabinet_id FK, name, kind ENUM(salle,equipement,praticien))

appointment(id, cabinet_id FK, patient_id FK, date, time, reason,
            status, category_id FK NULL, resource_id FK NULL,
            checked_in_at NULL, tracker_status NULL,
            created_at, updated_at, version)

agenda_block(id, cabinet_id FK, date, start_time, end_time, reason)
holiday(id, cabinet_id FK, date, label)

note(id, patient_id FK, author_id FK -> app_user NULL, date, text,
     motif, exam, diagnosis, plan, created_at, updated_at, version)
note_attachment(id, note_id FK, name, mime_type, storage_ref)
note_icd_code(id, note_id FK, code, label)          -- snapshot copy, not FK to a live icd_code table

icd_code(code PK, label, version)                    -- reference table, versioned

prescription(id, patient_id FK, date, text,
             renewed_from_id FK -> prescription NULL, created_at)

checkup(id, patient_id FK, date, state, weight, systolic, diastolic,
        heart_rate, temperature, pain, comment)

certificate_template(id, cabinet_id FK, type, text)
certificate(id, patient_id FK, type, document_date, start_date NULL,
            days NULL, end_date NULL, text, created_at)

contact(id, cabinet_id FK, name, kind, specialty, phone, email,
        address, notes)

referral(id, patient_id FK, specialty, contact_id FK NULL, reason,
         document_date, text, created_at)

diagnostic(id, patient_id FK, date, reason, content, status,
           author_id FK -> app_user NULL, created_at, updated_at)

favorite(id, cabinet_id FK, label, form, posology, duration, route,
         note, drug_class, uses)
protocol(id, cabinet_id FK, name, category, note)
protocol_line(id, protocol_id FK, text, sort_order)

audit_event(id, cabinet_id FK, at, actor_id FK -> app_user,
            action, entity, entity_id, patient_id NULL, ip,
            diff JSONB, summary)                       -- append-only, no UPDATE/DELETE grant
```

Notes on the mapping:
- Every embedded array in §3 (`Note.attachments`,
  `Doctor.customSymptomGroups`, `Settings.favorites/protocols/…`)
  becomes its own child table with a real FK, instead of JSON-nested
  data — this is what makes them queryable/indexable server-side.
- `cabinet_id` is added to every table that needs tenant isolation;
  child tables inherit it transitively through their parent FK, so it
  doesn't need to be duplicated unless query performance requires it.
- `version` columns added wherever the prototype currently has no
  concurrency control but the tickets file requires optimistic locking
  (`patient`, `appointment`, `note`, `app_user`).
- `icd_code` becomes a real versioned reference table; `note_icd_code`
  keeps the prototype's copy-by-value semantics (a note's coded
  diagnosis shouldn't retroactively change if the reference label is
  edited later).
- `app_user` is split into the base identity row plus **`doctor_profile`**
  and **`staff_profile`** (both 1:1 via `user_id`), instead of the
  prototype's single wide `Doctor` row that carries every field for
  every role. This is a genuine normalization, not a cosmetic rename:
  today `licenseNumber` is meaningless on a `secretaire` row (the
  prototype just stores `"—"`) and every HR field
  (`cin`/`rib`/`bank`/`hiredAt`/`contractType`/`emergencyContact`) is
  meaningless on a `medecin` row (no UI ever sets them there). The
  relation between the two profile tables is purely "1:1 extension of
  the same `app_user` row picked by `role`" — there is **no**
  "this secretary reports to that doctor" relation anywhere in the
  prototype; a `secretaire` belongs to the practice (`cabinet_id`),
  not to an individual `medecin`.

---

### 9. Field inventory — flat index (every field, one line each)

For quick lookup / spreadsheet import. Format: `Table.field : type`.

```
Doctor.id : string
Doctor.name : string
Doctor.specialty : string
Doctor.email : string
Doctor.phone : string
Doctor.licenseNumber : string
Doctor.password : string
Doctor.active : boolean
Doctor.createdAt : string(ISO)
Doctor.lastPasswordResetAt : string(ISO)?
Doctor.role : "medecin"|"secretaire"
Doctor.photo : string(dataUrl)?
Doctor.birthDate : string?
Doctor.cin : string?
Doctor.address : string?
Doctor.hiredAt : string?
Doctor.contractType : "CDI"|"CDD"|"Stage"|"Temps partiel"?
Doctor.bank : string?
Doctor.rib : string?
Doctor.emergencyContact : string?
Doctor.notes : string?
Doctor.customSymptomGroups : CustomSymptomGroup[]?

CustomSymptomGroup.id : string
CustomSymptomGroup.title : string
CustomSymptomGroup.items : string[]
CustomSymptomGroup.extendsGroupId : string?

Patient.id : string
Patient.code : string
Patient.name : string
Patient.phone : string
Patient.birthDate : string
Patient.sex : "homme"|"femme"?
Patient.country : string?
Patient.coverage : "cnam"|"assurance"|"aucune"?
Patient.insurer : string?
Patient.cnam : string
Patient.allergies : string[]
Patient.chronic : string[]
Patient.createdAt : string(ISO)
Patient.profession : string?
Patient.address : string?

Appointment.id : string
Appointment.patientId : string (FK Patient)
Appointment.date : string(yyyy-MM-dd)
Appointment.time : string(HH:mm)
Appointment.reason : string
Appointment.status : "upcoming"|"done"|"absent"
Appointment.category : string? (FK-like AppointmentCategory)
Appointment.resourceId : string? (FK-like Resource)
Appointment.checkedInAt : string(ISO)?
Appointment.tracker : "waiting"|"in_consult"|"done"?

Block.id : string
Block.date : string
Block.start : string(HH:mm)
Block.end : string(HH:mm)
Block.reason : string

Holiday.id : string
Holiday.date : string(yyyy-MM-dd)
Holiday.label : string

Resource.id : string
Resource.name : string
Resource.kind : "salle"|"équipement"|"praticien"

AppointmentCategory.id : string
AppointmentCategory.label : string
AppointmentCategory.color : string(hex)

NoteAttachment.id : string
NoteAttachment.name : string
NoteAttachment.type : string(mime)
NoteAttachment.dataUrl : string

IcdCode.code : string
IcdCode.label : string

Note.id : string
Note.patientId : string (FK Patient)
Note.date : string
Note.text : string
Note.attachments : NoteAttachment[]?
Note.motif : string?
Note.exam : string?
Note.diagnosis : string?
Note.plan : string?
Note.icd : IcdCode[]?
Note.authorId : string? (FK-like Doctor)

Prescription.id : string
Prescription.patientId : string (FK Patient)
Prescription.date : string
Prescription.text : string
Prescription.renewedFrom : string? (FK Prescription, self)

Checkup.id : string
Checkup.patientId : string (FK Patient)
Checkup.date : string
Checkup.state : "mieux"|"stable"|"moins_bien"
Checkup.weight : number?
Checkup.systolic : number?
Checkup.diastolic : number?
Checkup.heartRate : number?
Checkup.temperature : number?
Checkup.pain : number?
Checkup.comment : string?

CertificateTemplate.type : string
CertificateTemplate.text : string

Certificate.id : string
Certificate.patientId : string (FK Patient)
Certificate.type : string
Certificate.documentDate : string
Certificate.startDate : string?
Certificate.days : number?
Certificate.endDate : string?
Certificate.text : string
Certificate.createdAt : string(ISO)

Referral.id : string
Referral.patientId : string (FK Patient)
Referral.specialty : string
Referral.contactId : string? (FK Contact)
Referral.reason : string
Referral.documentDate : string
Referral.text : string
Referral.createdAt : string(ISO)

Contact.id : string
Contact.name : string
Contact.kind : string
Contact.specialty : string?
Contact.phone : string?
Contact.email : string?
Contact.address : string?
Contact.notes : string?

Diagnostic.id : string
Diagnostic.patientId : string (FK Patient)
Diagnostic.date : string(yyyy-MM-dd)
Diagnostic.reason : string?
Diagnostic.content : string
Diagnostic.status : "brouillon"|"termine"
Diagnostic.authorId : string? (FK-like Doctor)
Diagnostic.createdAt : string(ISO)
Diagnostic.updatedAt : string(ISO)

AuditEntry.id : string
AuditEntry.at : string(ISO)
AuditEntry.actor : string (name snapshot, not FK)
AuditEntry.summary : string

Favorite.id : string
Favorite.label : string
Favorite.form : string?
Favorite.posology : string
Favorite.duration : string?
Favorite.route : string?
Favorite.note : string?
Favorite.drugClass : string?
Favorite.uses : number?

Protocol.id : string
Protocol.name : string
Protocol.category : string?
Protocol.note : string?
Protocol.lines : string[]

Settings.doctorName : string
Settings.specialty : string
Settings.address : string
Settings.phone : string
Settings.licenseNumber : string
Settings.favorites : Favorite[]
Settings.protocols : Protocol[]
Settings.consultDuration : number
Settings.password : string
Settings.adminEmail : string
Settings.adminPassword : string
Settings.lockDelay : number
Settings.theme : "light"|"dark"|"system"
Settings.appointmentCategories : AppointmentCategory[]
Settings.resources : Resource[]
Settings.certificateTemplates : CertificateTemplate[]
```

---

### 10. File map (where all of this lives today)

| File | Role |
|---|---|
| `src/lib/cabinet/types.ts` | All table/row TypeScript interfaces + `CabinetData` root shape |
| `src/lib/cabinet/store.tsx` | localStorage persistence, migrations/back-compat, `CabinetProvider`, `update()`/audit-log writer |
| `src/lib/cabinet/context.ts` | `useCabinet()` hook + session-only state shape |
| `src/lib/cabinet/seed.ts` | Demo data generator (10 patients, appointments, staff, etc.) |
| `src/lib/cabinet/utils.ts` | Date formatting, `makePatientCode`, `levenshtein`, `matches`, `ageFrom`, `resizeImage` |
| `src/lib/cabinet/prescriptions.ts` | `Favorite` rendering/parsing, allergy/chronic conflict detection |
| `src/lib/cabinet/gi-interview.ts` | Static structured-interview reference data (gastro-enterology) |
| `src/lib/cabinet/icd10.ts` | Static ICD-10 subset + search |
| `src/lib/cabinet/credentials.ts` | Password generation + simulated credentials email body |
| `src/lib/cabinet/diagnostic-report.ts` | Parses `Diagnostic.content` into display lines |
| `src/routes/*.tsx` | One route per major table/feature (patients, agenda, tracker, journal, ordonnances, certificats, orientations, annuaire, personnel, admin, parametres, historique.$id) |
| `src/components/cabinet/*.tsx` | Shared widgets: `PatientDrawer`, `AppointmentModal`, `DiagnosticModal`, `GiInterviewForm`, `LockScreen`, `Sidebar`, `GlobalSearch`, `PatientPicker`, `SendCredentialsModal`, `IcdPicker`, `Combobox`, `Page`, `Modal` |

---

*Generated from a read-through of the full `src/lib/cabinet/*` module
and every route/component that touches `CabinetData`, cross-checked
against `hope-tickets.json` and recent commit history for known gaps.
`vaccinations`, `documents`, `payments` and `analyses` are excluded from
this pass by request — see the scope note at the top of the document.*


---

## Part C — Full API Endpoints Reference (appendix)

> Verbatim copy of `docs/API-ENDPOINTS.md`, heading levels shifted down by one to nest under this document.

## Hope / Cabinet — API Endpoint Reference

> **There is no real HTTP API in the prototype today.** Every "call" in
> `src/routes/*.tsx` and `src/components/cabinet/*.tsx` is a synchronous
> mutation of one in-memory/`localStorage` object (`CabinetData`), made
> through `update()` / `setSettings()` in
> [`src/lib/cabinet/store.tsx`](../src/lib/cabinet/store.tsx). This
> document reverse-engineers **every one of those actions** — everywhere
> the UI reads or writes data — and specifies the REST endpoint that
> should back it in the real app, with full request/response bodies,
> matching the conventions the project has already committed to in
> `hope-tickets.json` (Spring Boot 3, RFC 7807 problem+json errors, JWT
> access token + rotating refresh cookie, role-based access control,
> per-write audit events).
>
> **Scope note:** endpoints for `vaccinations`, `documents`, `payments`
> and `analyses` are excluded, matching the same exclusion made in
> [`DATA-MODEL.md`](DATA-MODEL.md). Everything else the UI can currently
> do has an endpoint below.
>
> Base URL: `/api` (adjust to taste). All authenticated requests carry
> `Authorization: Bearer <accessToken>`; the refresh token travels as an
> `HttpOnly Secure SameSite=Strict` cookie, never in the body.

---

### Conventions used throughout this document

- **Auth**: `public` (no token), `session` (any logged-in role), or a
  role list, e.g. `medecin`, `secretaire`, `admin`.
- **Errors**: every non-2xx response is `application/problem+json`
  (RFC 7807): `{ type, title, status, detail, instance, errors? }`.
  Not repeated per endpoint below — assume `400` (validation),
  `401` (missing/expired token), `403` (role not allowed), `404`
  (not found), `409` (conflict/optimistic-lock/duplicate) apply
  wherever the notes call them out.
- **Audit**: 🔴 marks an endpoint that must write an `AuditEntry`
  (§3.18 of the data model) on success — i.e. every endpoint the
  prototype currently passes an `audit` message into `update()` for.
- **Pagination**: list endpoints not already small/bounded use
  `?page=&size=&sort=` and return `{ content: [...], page, size,
  totalElements, totalPages }`. The prototype has no pagination (it
  holds everything in memory), so this is a real-backend addition.
- **`version`**: request/response bodies for mutable rows include an
  optimistic-locking `version` field per `DATA-MODEL.md` §7/§8, even
  though the prototype has none — required so concurrent edits 409
  instead of silently overwriting.
- Source column cites the exact prototype file/line that performs the
  equivalent local mutation, so the endpoint's behavior can be checked
  against real UI logic.

---

### Table of contents

1. [Auth & session](#1-auth--session)
2. [Staff / accounts (`Doctor`)](#2-staff--accounts-doctor)
3. [Patients](#3-patients)
4. [Appointments (agenda + waiting-room tracker + dashboard)](#4-appointments-agenda--waiting-room-tracker--dashboard)
5. [Agenda blocks & holidays](#5-agenda-blocks--holidays)
6. [Notes / consultations](#6-notes--consultations)
7. [Prescriptions](#7-prescriptions)
8. [Certificates](#8-certificates)
9. [Referrals](#9-referrals)
10. [Contacts (directory)](#10-contacts-directory)
11. [Diagnostics (structured interview)](#11-diagnostics-structured-interview)
12. [Audit log](#12-audit-log)
13. [Settings (practice configuration)](#13-settings-practice-configuration)
14. [Reference data](#14-reference-data)
15. [Global search](#15-global-search)
16. [Full endpoint index (flat list)](#16-full-endpoint-index-flat-list)

---

### 1. Auth & session

Backs `LockScreen.tsx` (login, quick-login, show/hide password),
`parametres.tsx` (change own password), and the session state in
`context.ts`/`store.tsx` (`locked`, `currentUser`, `role`, `isAdmin`).

#### `POST /api/auth/login`
**Auth:** public · **Source:** `LockScreen.tsx:17-45` (`attemptLogin`)

Two login paths merge into one endpoint: a normal `Doctor` login, and
the separate **admin** login (`Settings.adminEmail`/`adminPassword`,
not a `Doctor` row) — the server must check both and return the
resolved role.

Request:
```json
{
  "email": "amine.gastro@cabinet.tn",
  "password": "Doctor@2024"
}
```

Response `200`:
```json
{
  "accessToken": "eyJhbGciOi...",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": "doc-amine",
    "name": "Dr Amine Gastro",
    "email": "amine.gastro@cabinet.tn",
    "role": "medecin",
    "mustChangePassword": false
  }
}
```
(sets refresh-token cookie). Admin login returns the same shape with
`"role": "admin"` and a synthetic user object (no `Doctor` row backs
it, per the design smell noted in `DATA-MODEL.md` §3.19 — the real
app should ideally fold this into a normal `app_user` row with role
`admin` instead of keeping a second credential pair).

Errors: `401` generic "Identifiants invalides" for both wrong password
and unknown email (never reveal which); `403` if `Doctor.active=false`;
`423 Locked` if the account is in a lockout window (`HOPE-AUTH-07`,
not in the prototype today).

#### `POST /api/auth/refresh`
**Auth:** public (refresh cookie required) · **Source:** implicit —
prototype keeps the session in memory only and re-shows the lock
screen on reload; the real app must silently refresh on load
(`HOPE-AUTH-03`).

No body (reads the `HttpOnly` cookie). Response `200`: same shape as
login's `accessToken`/`user`. Rotates the refresh cookie. `401` if
the refresh token is invalid, expired, or reused (reuse revokes the
whole token family — `HOPE-AUTH-01`).

#### `POST /api/auth/logout`
**Auth:** session · **Source:** `Sidebar.tsx` "Verrouiller" / `lock()`
in `context.ts:20`.

No body. Revokes the refresh token, clears the cookie. Response `204`.
(In the prototype, `lock()` is purely client-side state — it doesn't
end a "session" since there isn't a server one. The real endpoint
should exist even if the UI still shows a local lock screen instead of
a full logout, per `HOPE-AUTH-04`'s "unlock without losing the current
screen" requirement — i.e. `lock()` stays client-only; this endpoint
backs a true "sign out" action, e.g. from Sidebar.)

#### `POST /api/auth/unlock`
**Auth:** session (still valid access token) · **Source:**
`LockScreen.tsx` reused as the lock overlay; `unlock()` in
`context.ts:21`. Backs `HOPE-AUTH-04`.

Request:
```json
{ "password": "Doctor@2024" }
```
Response `204` on success (session continues, nothing new issued).
`401` on wrong password — does **not** end the session, just keeps the
overlay up.

#### `GET /api/auth/me`
**Auth:** session · **Source:** `context.ts` `currentUser`.

Response `200`:
```json
{
  "id": "doc-amine",
  "name": "Dr Amine Gastro",
  "specialty": "Gastro-entérologie",
  "email": "amine.gastro@cabinet.tn",
  "role": "medecin",
  "active": true,
  "customSymptomGroups": [
    { "id": "grp-1", "title": "Post-opératoire", "items": ["Douleur de paroi"], "extendsGroupId": null }
  ]
}
```

#### `POST /api/auth/password/change` 🔴
**Auth:** session · **Source:** `parametres.tsx:582-622` (own-password
change form).

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```
Response `204`. `400` if the new password fails policy (`HOPE-AUTH-05`:
≥10 chars, upper, lower, digit). `401` if `currentPassword` is wrong.
Audit: `"Mot de passe modifié"`.

#### `POST /api/auth/password/forgot` *(planned — `HOPE-AUTH-09`, not in prototype)*
**Auth:** public

Request: `{ "email": "..." }`. Response `202` always (never reveals
whether the email exists). Sends a single-use, 30-minute reset link by
email.

#### `POST /api/auth/password/reset` *(planned — `HOPE-AUTH-09`)*
**Auth:** public (bears a reset token)

Request: `{ "token": "...", "newPassword": "..." }`. Response `204`;
`410 Gone` if the token is expired/used.

---

### 2. Staff / accounts (`Doctor`)

Backs `routes/admin.tsx` (all staff, both roles — `admin.tsx` reads
`data.doctors` unfiltered) and `routes/personnel.tsx` (secretary
accounts only — `personnel.tsx` filters to `role === "secretaire"`).
Both routes operate on the same `doctors` table.

**Role & account-creation model** (see `DATA-MODEL.md` §3.1 for the
full breakdown): `admin` creates **either** role via `/admin`'s role
selector; `medecin` creates **only** `secretaire` accounts via
`/personnel` (that screen hardcodes the role — there's no UI path for
a doctor to create another doctor); `secretaire` can create nobody and
is refused entry to `/personnel` outright. Every endpoint below that
accepts a `role` in its request body must enforce **`admin`-only** for
`role: "medecin"`, and **`admin` or `medecin`** for `role:
"secretaire"` — not a blanket "admin, medecin" as a stale first pass
of this document implied. `/admin` itself has no server-side guard in
the prototype today (see the ⚠️ gap noted in `DATA-MODEL.md` §3.1) —
the real API must not repeat that.

**Backing schema**: `DATA-MODEL.md` §8 recommends splitting the wide
`Doctor` row into a base `app_user` identity table plus two separate
1:1 extension tables — `doctor_profile` (medecin-only:
`licenseNumber`) and `staff_profile` (secretaire-only: the HR fields
`cin`/`rib`/`bank`/`hiredAt`/`contractType`/`emergencyContact`/etc.,
which today are only ever set by `personnel.tsx`). Every endpoint
below keeps the **flat DTO shape** shown (the API doesn't need to
expose the join) — the split only matters for how the server stores
and validates the row, e.g. rejecting `licenseNumber` on a
`secretaire` create/update, or the reverse for HR fields on a
`medecin`.

#### `GET /api/staff`
**Auth:** `admin`, `medecin` · **Source:** `admin.tsx` list,
`personnel.tsx:59` filter.

Query: `?role=medecin|secretaire&active=true|false&q=search`

Response `200`:
```json
{
  "content": [
    {
      "id": "doc-amine", "name": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
      "email": "amine.gastro@cabinet.tn", "phone": "+216 20 000 000",
      "licenseNumber": "TN-1234", "active": true, "role": "medecin",
      "createdAt": "2024-01-01T00:00:00Z", "lastPasswordResetAt": null,
      "photo": null, "birthDate": null, "cin": null, "address": null,
      "hiredAt": null, "contractType": null, "bank": null, "rib": null,
      "emergencyContact": null, "notes": null, "version": 1
    }
  ],
  "page": 0, "size": 20, "totalElements": 3, "totalPages": 1
}
```
Never includes `password`/`passwordHash` (see `DATA-MODEL.md` §7.1).

#### `GET /api/staff/{id}`
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) ·
**Source:** `personnel.tsx` detail panel (secretary records only —
`secretaire` has no self-view of this record; own-profile data comes
from `GET /api/auth/me` instead).

Response `200`: single staff object as above.

#### `POST /api/staff` 🔴
**Auth:** `admin` (`role` in body may be `medecin` or `secretaire`),
`medecin` (`role` in body must be `secretaire` — server must reject a
`medecin` caller creating another `medecin`; the front end never
offers that combination either) · **Source:** `admin.tsx:143-153`
(create, role selectable), `personnel.tsx:181-196` (create, role
hardcoded to `secretaire`).

Request:
```json
{
  "name": "Fatma Secrétaire",
  "specialty": "",
  "email": "fatma@cabinet.tn",
  "phone": "+216 20 111 111",
  "licenseNumber": "—",
  "role": "secretaire",
  "birthDate": "1990-05-01",
  "cin": "12345678",
  "address": "Tunis",
  "hiredAt": "2024-01-15",
  "contractType": "CDI",
  "bank": "BIAT",
  "rib": "08 000 0000000000000 00",
  "emergencyContact": "+216 20 222 222",
  "notes": "Temps plein"
}
```
No `password` field in the request — the server generates one
(`randomPassword()` equivalent, `credentials.ts:6`) and sends an
activation email; the prototype's UI currently shows the generated
password inline in a toast (`admin.tsx:151`, flagged as a security
issue in `DATA-MODEL.md` §7.1 — the real endpoint should **not**
return the password in the response body at all, only trigger the
email).

Response `201`:
```json
{ "id": "doc-fatma", "name": "Fatma Secrétaire", "email": "fatma@cabinet.tn", "role": "secretaire", "active": true, "createdAt": "2025-01-01T00:00:00Z", "version": 1 }
```
`409` if `email` already used in this practice. Audit: `"Compte créé — {name}"`.

#### `PATCH /api/staff/{id}` 🔴
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only,
via `/personnel`) · **Source:** `admin.tsx:138-142` (edit, any role),
`personnel.tsx:157-180` (edit, secretary records only — the list this
screen operates on is pre-filtered to `role === "secretaire"`).
`secretaire` self-edit of profile fields (name/phone/etc., beyond the
password change covered by `POST /api/auth/password/change`) has no
prototype screen to base a scope on — a reasonable real-app addition,
not something to imitate from existing behavior.

Request: partial body, any subset of the `POST` fields above, plus
`{ "version": 3 }` for optimistic concurrency.

Response `200`: updated staff object. `409` with a `ConflictDialog`-style
payload on version mismatch. Audit: `"Compte modifié — {name}"`.

#### `PATCH /api/staff/{id}/activation` 🔴
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) ·
**Source:** `admin.tsx:158-164` (`toggleActive`, any role),
`personnel.tsx:196-206` (`toggleActive`, secretary records only).

Request: `{ "active": false }`. Response `200`: `{ "id": "...", "active": false }`.
Audit: `"Compte {name} désactivé"` / `"réactivé"`.

#### `POST /api/staff/{id}/password-reset` 🔴
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) ·
**Source:** `admin.tsx:166-185` (`confirmReset`, any role),
`personnel.tsx:207-223` (`confirmReset`, secretary records only).

Request: `{}` (server generates the password) — the prototype instead
lets the admin type `newPassword` directly and shows it in a toast;
the real endpoint should **generate** it server-side and only email it
(never return it in the response), matching `HOPE-USR-01`'s "Reset =
sends a link, never a plain-text password."

Response `204`. Side effect noted in the prototype: if this account's
name equals `Settings.doctorName`, `Settings.password` is updated too
(`admin.tsx:178-180`) — a consequence of the "three credential pairs"
design smell in `DATA-MODEL.md` §3.19 that the real schema should
eliminate rather than replicate. Audit: `"Mot de passe réinitialisé — {name}"`.

#### `POST /api/staff/{id}/send-credentials`
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) · **Source:**
`components/cabinet/SendCredentialsModal.tsx` +
`lib/cabinet/credentials.ts:17` (`buildCredentialsEmail`) — currently
**simulated**, nothing is actually sent.

Request: `{}` (no body needed — server already knows the pending
credential). Response `202`. The real implementation replaces this
whole "send credentials by email" pattern with an activation-link flow
per `HOPE-NOT-01`/`HOPE-USR-01` — password values should never
traverse the network at all.

#### `DELETE /api/staff/{id}` 🔴
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) ·
**Source:** `admin.tsx:483` (hard delete, any role), `personnel.tsx:651`
(hard delete, secretary records only). ⚠️ Corrected: an earlier pass of
this document listed `admin` only — `personnel.tsx` gives `medecin`
the same hard-delete power over secretary accounts.

⚠️ The prototype **hard-deletes** the row. The real API should
**reject** a hard delete and require `PATCH .../activation` instead
(`HOPE-USR-01`: "Delete = deactivate (history stays linked)"). Document
both for completeness:
- Recommended real behavior: `410 Gone` / `405` directing callers to
  deactivate.
- If implemented as designed by the ticket file: this endpoint simply
  doesn't exist; `PATCH .../activation` is the only way to remove
  access.

Audit (if ever allowed): `"Compte supprimé — {name}"`.

#### Custom symptom groups (embedded in staff, doctor-only)

Backs `parametres.tsx:140-170` — a doctor customizing their own
structured-interview grid (§3.17 of the data model).

##### `POST /api/staff/me/symptom-groups` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:151-156`.

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```
Response `201`: the created `CustomSymptomGroup`. Audit: `"Groupe de symptômes ajouté — {title}"`.

##### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:163-169`.

Response `204`. Audit: `"Groupe de symptômes supprimé — {title}"`.

---

### 3. Patients

Backs `routes/patients.tsx`, `components/cabinet/PatientDrawer.tsx`,
`components/cabinet/PatientPicker.tsx`, `components/cabinet/GlobalSearch.tsx`.

#### `GET /api/patients`
**Auth:** session · **Source:** `patients.tsx:73` (filtered/sorted
list), `PatientPicker.tsx:32`.

Query: `?q=search&sort=name|age|lastVisit&dir=asc|desc&page=&size=&recent=true`

- `q` does accent-insensitive substring/trigram search on name, phone,
  patient code (`utils.ts:80` `matches()` today; server-side
  `unaccent`+`pg_trgm` per `HOPE-PAT-01`).
- `recent=true` returns the "10 most recently active" patients
  (`patients.tsx` "Récents" tab).
- Response DTO differs by role: `secretaire` gets an **administrative**
  DTO (no clinical fields); `medecin`/`admin` get the full DTO. This
  matches the access-matrix requirement in `HOPE-PAT-01`/`HOPE-AUTH-06`.

Response `200` (full/medecin DTO):
```json
{
  "content": [
    {
      "id": "pat-salma", "code": "ST-482915", "name": "Salma Trabelsi",
      "phone": "+216 22 111 222", "birthDate": "1985-03-12", "age": 40,
      "sex": "femme", "country": "Tunisie", "coverage": "cnam", "insurer": null,
      "cnam": "1234567", "allergies": ["Pénicilline"], "chronic": ["Metformine 1000mg"],
      "profession": "Enseignante", "address": "Tunis", "createdAt": "2023-06-01T00:00:00Z",
      "version": 4
    }
  ],
  "page": 0, "size": 20, "totalElements": 10, "totalPages": 1
}
```
Administrative DTO (secretary) drops `allergies`, `chronic`, and any
clinical fields — only identity/contact/billing-adjacent fields remain.

#### `GET /api/patients/{id}`
**Auth:** session (role-scoped DTO as above) · **Source:**
`patients.tsx:67,100,139`, `PatientDrawer.tsx:96`.

Response `200`: single patient DTO.

#### `POST /api/patients` 🔴
**Auth:** `medecin`, `secretaire` · **Source:** `patients.tsx:97-133`
(`create`), also invoked as **quick-create** from
`AppointmentModal.tsx:53-70` when booking for a new patient.

Request:
```json
{
  "name": "Hédi Ben Salah",
  "phone": "+216 98 000 000",
  "birthDate": "1978-09-20",
  "sex": "homme",
  "country": "Tunisie",
  "coverage": "cnam",
  "cnam": "7654321",
  "insurer": "",
  "allergies": ["Aspirine"],
  "profession": "Ingénieur",
  "address": "Sfax"
}
```
`code` is **not** sent by the client — generated server-side
(`makePatientCode()` logic, §6 of the data model), unique per practice,
retried on collision under concurrency (`HOPE-PAT-02`).

Response `201`: created patient DTO including the generated `code`.
`400` on validation failure (Tunisian phone format, birth date not in
the future, CNAM number required if `coverage=cnam`). Audit:
`"Patient créé — {name}"`.

#### `POST /api/patients/duplicates-check`
**Auth:** `medecin`, `secretaire` · **Source:** `patients.tsx:99-103`
(Levenshtein ≤2 against existing names before create), also used by
the quick-create-from-appointment flow.

Request: `{ "name": "Salma Trablsi", "phone": "22111222", "birthDate": "1985-03-12" }`

Response `200`:
```json
{
  "duplicates": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "matchReason": "name" }
  ]
}
```
`matchReason` ∈ `name` (Levenshtein ≤2 / trigram ≥0.6), `phone` (exact),
`birthDate` (exact). Empty array = no duplicate found, caller proceeds
straight to `POST /api/patients`.

#### `PATCH /api/patients/{id}` 🔴
**Auth:** `medecin`, `secretaire` (identity fields only, per access
matrix) · **Source:** `PatientDrawer.tsx:225-232` (`save`, general
identity edit), `PatientDrawer.tsx:803-812` (allergies-only edit).

Request: partial body (any subset of the `POST` fields) + `{ "version": 4 }`.

Response `200`: updated patient DTO with `diff` recorded in the audit
event. `409` with a `ConflictDialog` payload on concurrent edit
(`HOPE-PAT-04`):
```json
{
  "type": "https://hope.example/problems/conflict",
  "title": "Version conflict",
  "status": 409,
  "detail": "Patient was modified by another user.",
  "current": { "...": "latest server copy" }
}
```
Audit: `"Patient modifié — {name}"` with a diff of changed fields.

#### `POST /api/patients/{id}/archive` *(planned — `HOPE-PAT-05`, not in prototype)*
**Auth:** `medecin`, `admin`

Request: `{}`. Response `204`. Sets `archivedAt`; patient disappears
from default list/search but is retrievable with `?archived=true`.

#### `POST /api/patients/{id}/import-demo-history` *(prototype-only demo affordance)*
**Auth:** `medecin` · **Source:** `PatientDrawer.tsx:143-158` — the
"Import de dossier" button seeds 4 fake past appointments for demo
purposes. This is explicitly a prototype placeholder (per the app's
own labeling) and **should not exist** in the real API — listed here
only for completeness/traceability, not as a real design.

---

### 4. Appointments (agenda + waiting-room tracker + dashboard)

Backs `routes/agenda.tsx`, `routes/tracker.tsx`, `routes/index.tsx`
("Aujourd'hui" dashboard), `components/cabinet/AppointmentModal.tsx`.

#### `GET /api/appointments`
**Auth:** session · **Source:** `agenda.tsx:56,271`, `index.tsx:39-49`,
`tracker.tsx` (`list`), `patients.tsx:60-65` (a patient's history).

Query: `?from=2025-01-01&to=2025-01-31&practitionerId=&patientId=&status=&date=2025-01-15`

Response `200`:
```json
{
  "content": [
    {
      "id": "apt-1", "patientId": "pat-salma", "date": "2025-01-15", "time": "09:00",
      "reason": "Consultation de suivi", "status": "upcoming",
      "category": "cat-consultation", "resourceId": "res-salle-1",
      "checkedInAt": null, "tracker": null, "version": 1
    }
  ],
  "page": 0, "size": 50, "totalElements": 12, "totalPages": 1
}
```

#### `GET /api/appointments/{id}`
**Auth:** session · **Source:** `AppointmentModal.tsx:22` (load for edit).

Response `200`: single appointment.

#### `POST /api/appointments` 🔴
**Auth:** `medecin`, `secretaire` · **Source:**
`AppointmentModal.tsx:37-98` (create; can also inline-create the
patient first, see §3).

Request:
```json
{
  "patientId": "pat-salma",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Contrôle post-traitement",
  "category": "cat-consultation",
  "resourceId": "res-salle-1"
}
```
Response `201`: created appointment, `status` defaults to `"upcoming"`.
`409` if the slot is blocked (`Block`/`Holiday`) or double-booked on
the same resource. Audit: `"Rendez-vous créé — {patientName}, {date} {time}"`.

#### `PATCH /api/appointments/{id}` 🔴
**Auth:** `medecin`, `secretaire` · **Source:** `AppointmentModal.tsx`
edit path (reuses the create form pre-filled).

Request: partial body + `version`. Response `200`: updated appointment.
Audit: `"Rendez-vous modifié — {patientName}"`.

#### `POST /api/appointments/{id}/status` 🔴
**Auth:** `medecin`, `secretaire` · **Source:** `index.tsx:131-134`
(mark done), `index.tsx:142-145` (mark absent).

Request: `{ "status": "done" }` or `{ "status": "absent" }`.
Response `200`: `{ "id": "apt-1", "status": "done" }`. `422` on an
invalid transition (e.g. already `"done"`). Audit:
`"Consultation marquée terminée — {patientName}"` /
`"Patient marqué absent — {patientName}"`.

> The prototype's status enum is only `upcoming|done|absent` — no
> `"cancelled"` state. `HOPE-AGD-01` specifies a richer unified status
> machine (confirm/check-in/call/finish/no-show/cancel) for the real
> API; if adopted, this endpoint's accepted values expand accordingly
> and cancellation becomes `status: "cancelled"` + a `reason` field,
> never a row deletion (see `DELETE` below).

#### `POST /api/appointments/{id}/check-in` 🔴
**Auth:** `secretaire`, `medecin` · **Source:** `tracker.tsx:66-73`
(`checkIn`).

Request: `{}`. Response `200`:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```
Audit: `"Arrivée enregistrée — {patientName}"`.

#### `PATCH /api/appointments/{id}/tracker` 🔴
**Auth:** `secretaire`, `medecin` · **Source:** `tracker.tsx:52-60`
(`setTracker` — moves a checked-in patient between waiting-room
columns: `waiting` → `in_consult` → `done`).

Request: `{ "tracker": "in_consult" }`. Response `200`:
`{ "id": "apt-1", "tracker": "in_consult" }`. Audit:
`"Flux patient — {patientName} : {label}"` (label = column name, e.g.
"En consultation").

#### `POST /api/appointments/{id}/tracker/reopen` 🔴
**Auth:** `secretaire`, `medecin` · **Source:** `tracker.tsx:75-84`
(`reopen` — removes `checkedInAt`/`tracker`, sending the patient back
to "not arrived").

Request: `{}`. Response `200`: appointment with `checkedInAt: null`,
`tracker: null`. Audit: `"Patient retiré du tableau — {patientName}"`.

#### `DELETE /api/appointments/{id}` 🔴
**Auth:** `medecin`, `secretaire` · **Source:** `index.tsx:183`
(dashboard delete), `AppointmentModal.tsx:99` (cancel from the edit
modal).

⚠️ The prototype **hard-deletes** the row for both "delete" and
"cancel" actions. Per `HOPE-AGD-01`'s rejection criteria ("Cancelling
by deleting the appointment row"), the real endpoint should instead be
`POST /api/appointments/{id}/cancel` with a required `reason`, setting
`status: "cancelled"` and keeping the row. Documented as `DELETE` here
only because that's the prototype's actual behavior; recommend
implementing the `cancel` variant instead:

`POST /api/appointments/{id}/cancel` (recommended):
```json
{ "reason": "Patient a annulé par téléphone" }
```
Response `200`: `{ "id": "apt-1", "status": "cancelled" }`. Audit:
`"Rendez-vous annulé — {patientName} ({reason})"`.

---

### 5. Agenda blocks & holidays

Backs `routes/agenda.tsx` (blocks) and `routes/parametres.tsx:540-580`
(holidays).

#### `GET /api/agenda/blocks`
**Auth:** session · **Source:** `agenda.tsx:58` (`data.blocks.find`).

Query: `?from=&to=`. Response `200`: `{ "content": [ { "id": "blk-1", "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" } ] }`.

#### `POST /api/agenda/blocks`
**Auth:** `medecin`, `secretaire` · **Source:** `agenda.tsx:233`.

Request: `{ "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" }`.
Response `201`: created block.

#### `DELETE /api/agenda/blocks/{id}`
**Auth:** `medecin`, `secretaire` · **Source:** implied by the block
list UI (delete affordance next to each block).

Response `204`.

#### `GET /api/agenda/holidays`
**Auth:** session · **Source:** `agenda.tsx:59,272`, `parametres.tsx`
holiday list.

Response `200`: `{ "content": [ { "id": "hol-1", "date": "2025-04-10", "label": "Aïd el-Fitr" } ] }`.

#### `POST /api/agenda/holidays`
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:572`.

Request: `{ "date": "2025-04-10", "label": "Aïd el-Fitr" }`. Response `201`.

#### `DELETE /api/agenda/holidays/{id}`
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:557`.

Response `204`.

---

### 6. Notes / consultations

Backs `components/cabinet/PatientDrawer.tsx` (Notes tab, attachments),
`components/cabinet/DiagnosticModal.tsx` (structured consultation
fields + ICD picking), `routes/historique.$id.tsx` (read-only
timeline).

#### `GET /api/patients/{patientId}/notes`
**Auth:** `medecin` (secretary gets `403` — clinical data) ·
**Source:** `PatientDrawer.tsx:102`, `historique.$id.tsx:66`,
`patients.tsx:66`.

Response `200`:
```json
{
  "content": [
    {
      "id": "note-1", "patientId": "pat-salma", "date": "2025-01-10",
      "text": "RAS, patiente rassurée.",
      "motif": "Douleur épigastrique", "exam": "Souple, indolore", "diagnosis": "RGO",
      "plan": "IPP 4 semaines", "icd": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ],
      "authorId": "doc-amine",
      "attachments": [ { "id": "att-1", "name": "compte-rendu.pdf", "type": "application/pdf", "url": "/files/att-1" } ]
    }
  ]
}
```
(`attachments[].url` replaces the prototype's inline `dataUrl` — see
`DATA-MODEL.md` §7.5.)

#### `POST /api/patients/{patientId}/notes` 🔴
**Auth:** `medecin` · **Source:** `DiagnosticModal.tsx:53-77` (creates
a structured consultation note), free-text note creation in
`PatientDrawer.tsx`.

Request:
```json
{
  "date": "2025-01-20",
  "text": "",
  "motif": "Douleur abdominale",
  "exam": "Sensibilité en FID",
  "diagnosis": "Suspicion d'appendicite",
  "plan": "Échographie en urgence",
  "icd": [ { "code": "K37", "label": "Appendicite, sans précision" } ]
}
```
Response `201`: created note. Audit: `"Consultation enregistrée — {patientName}"`.

#### `PATCH /api/patients/{patientId}/notes/{noteId}` 🔴
**Auth:** `medecin` (author or admin) · **Source:** editing an
existing note/consultation.

Request: partial body + `version`. Response `200`. Audit:
`"Consultation modifiée — {patientName}"`.

#### `POST /api/patients/{patientId}/notes/{noteId}/attachments`
**Auth:** `medecin` · **Source:** `PatientDrawer.tsx` attachment
upload (drag/drop or file picker feeding `resizeImage()`/base64 today).

Request: `multipart/form-data`, field `file`. Response `201`:
`{ "id": "att-2", "name": "scanner.jpg", "type": "image/jpeg", "url": "/files/att-2" }`.

#### `DELETE /api/patients/{patientId}/notes/{noteId}/attachments/{attachmentId}` 🔴
**Auth:** `medecin` · **Source:** `PatientDrawer.tsx:658-667`.

Response `204`. Audit: `"Fichier supprimé — {fileName}"`.

---

### 7. Prescriptions

Backs `routes/ordonnances.tsx`.

#### `GET /api/prescriptions`
**Auth:** `medecin` · **Source:** `ordonnances.tsx` list for a patient,
`patients.tsx` patient history.

Query: `?patientId=pat-salma`. Response `200`:
```json
{
  "content": [
    { "id": "presc-1", "patientId": "pat-salma", "date": "2025-01-10", "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun", "renewedFrom": null }
  ]
}
```

#### `POST /api/prescriptions` 🔴
**Auth:** `medecin` · **Source:** `ordonnances.tsx:81-90` (`save`,
composes selected `Favorite`/`Protocol` lines into one text block; can
carry `renewedFrom` when renewing a prior prescription).

Request:
```json
{
  "patientId": "pat-salma",
  "text": "Oméprazole 20mg (gélule) - 1 cp x 1/j, 4 semaines - le matin à jeun",
  "renewedFrom": "presc-0"
}
```
Response `201`: created prescription. Server should re-run
`lineConflicts()`-equivalent checks (allergy/chronic-drug conflicts,
§6 of the data model) and surface warnings in the response, e.g.:
```json
{
  "id": "presc-1", "patientId": "pat-salma", "text": "...", "renewedFrom": "presc-0",
  "warnings": { "allergy": ["Pénicilline"], "chronic": [] }
}
```
Audit: `"Ordonnance créée — {patientName}"`.

#### `GET /api/prescriptions/{id}/conflicts-preview`
**Auth:** `medecin` · **Source:** `prescriptions.ts:64` (`lineConflicts`),
called live as the doctor types each line, before saving.

Request (query or body): `{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }`.
Response `200`: `{ "allergy": ["Pénicilline"], "chronic": [] }`.

---

### 8. Certificates

Backs `routes/certificats.tsx`.

#### `GET /api/certificates`
**Auth:** `medecin` · **Source:** `certificats.tsx:74` (monthly
register), `historique.$id.tsx:76`, `PatientDrawer.tsx:107`.

Query: `?patientId=&month=2025-01`. Response `200`:
```json
{
  "content": [
    { "id": "cert-1", "patientId": "pat-salma", "type": "Arrêt de travail", "documentDate": "2025-01-10", "startDate": "2025-01-10", "days": 3, "endDate": "2025-01-13", "text": "...", "createdAt": "2025-01-10T09:00:00Z" }
  ]
}
```

#### `POST /api/certificates` 🔴
**Auth:** `medecin` · **Source:** `certificats.tsx:159-179` (`create`).

Request:
```json
{
  "patientId": "pat-salma",
  "type": "Arrêt de travail",
  "startDate": "2025-01-10",
  "days": 3,
  "text": "Je soussigné..."
}
```
`documentDate`/`endDate`/`createdAt` computed server-side (`endDate =
startDate + days`). Response `201`. Audit: `"Certificat créé — {type}, {patientName}"`.

#### `POST /api/certificates/{id}/duplicate` 🔴
**Auth:** `medecin` · **Source:** `certificats.tsx:181-191`
(`duplicate` — copies an existing certificate with a fresh `id`/date).

Request: `{}`. Response `201`: new certificate, same `patientId`/`type`/`text`,
`documentDate`/`createdAt` reset to now. Audit: `"Certificat dupliqué — {type}, {patientName}"`.

#### `GET /api/certificates/{id}/pdf` *(planned — `HOPE-CERT-03`)*
**Auth:** `medecin`

Response `200`, `Content-Type: application/pdf` — server-rendered PDF
of the certificate (the prototype prints via the browser instead).

---

### 9. Referrals

Backs `routes/orientations.tsx`.

#### `GET /api/referrals`
**Auth:** `medecin` · **Source:** `orientations.tsx` list.

Query: `?patientId=`. Response `200`:
```json
{
  "content": [
    { "id": "ref-1", "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "documentDate": "2025-01-15", "text": "...", "createdAt": "2025-01-15T00:00:00Z" }
  ]
}
```

#### `POST /api/referrals` 🔴
**Auth:** `medecin` · **Source:** `orientations.tsx:86-98` (`save`).

Request:
```json
{ "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "text": "Cher confrère, ..." }
```
Response `201`. Audit: `"Courrier d'orientation créé — {patientName} → {specialty}"`.

#### `POST /api/referrals/{id}/email` *(planned — `HOPE-ORI-03`, not in prototype)*
**Auth:** `medecin`

Request: `{}` (uses `contactId`'s email). Response `202`. Emails the
referral letter as a PDF attachment to the colleague.

---

### 10. Contacts (directory)

Backs `routes/annuaire.tsx`.

#### `GET /api/contacts`
**Auth:** session · **Source:** `annuaire.tsx:94,101`,
`orientations.tsx:60-61,260` (picking a recipient).

Query: `?kind=&q=`. Response `200`:
```json
{
  "content": [
    { "id": "ctc-1", "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis", "notes": null }
  ]
}
```

#### `POST /api/contacts` 🔴
**Auth:** session · **Source:** `annuaire.tsx:151`.

Request: `{ "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis" }`.
Response `201`. Audit: `"Contact ajouté — {name}"`.

#### `PATCH /api/contacts/{id}` 🔴
**Auth:** session · **Source:** `annuaire.tsx` edit form.

Request: partial body. Response `200`. Audit: `"Contact modifié — {name}"`.

#### `DELETE /api/contacts/{id}` 🔴
**Auth:** session · **Source:** `annuaire.tsx:347`.

Response `204`. Audit: `"Contact supprimé — {name}"`.

---

### 11. Diagnostics (structured interview)

Backs `components/cabinet/DiagnosticModal.tsx` +
`components/cabinet/GiInterviewForm.tsx`, read-only in
`routes/historique.$id.tsx:86`.

#### `GET /api/patients/{patientId}/diagnostics`
**Auth:** `medecin` · **Source:** `DiagnosticModal.tsx:23-24`.

Response `200`:
```json
{
  "content": [
    {
      "id": "diag-1", "patientId": "pat-salma", "date": "2025-01-10",
      "reason": "Douleur épigastrique", "content": "Douleur épigastrique depuis 3 jours\n  - Post-prandiale immédiate\n🚨 Vomissements persistants",
      "status": "termine", "authorId": "doc-amine",
      "createdAt": "2025-01-10T09:00:00Z", "updatedAt": "2025-01-10T09:20:00Z"
    }
  ]
}
```

#### `POST /api/patients/{patientId}/diagnostics` 🔴
**Auth:** `medecin` · **Source:** `DiagnosticModal.tsx:72-90`
(`save`, status `"brouillon"` on first save).

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```
Response `201`. Audit: `"Entretien créé — {patientName}"`.

#### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
**Auth:** `medecin` (author) · **Source:** `DiagnosticModal.tsx`
re-save while editing / finalizing.

Request: `{ "content": "...", "status": "termine" }` + `version`.
Response `200`. `updatedAt` bumped server-side. Audit:
`"Entretien terminé — {patientName}"` when `status` transitions to
`"termine"`, else `"Entretien modifié — {patientName}"`.

#### `GET /api/reference/gi-interview` *(reference data, not a table — see §14)*

---

### 12. Audit log

Backs `routes/journal.tsx`.

#### `GET /api/audit`
**Auth:** `admin`, `medecin` · **Source:** `journal.tsx:28`
(`data.audit.map`).

Query: `?from=&to=&actorId=&entity=&patientId=&page=&size=`

Response `200`:
```json
{
  "content": [
    { "id": "aud-1", "at": "2025-01-20T10:00:00Z", "actorId": "doc-amine", "actor": "Dr Amine Gastro", "action": "PATIENT_CREATED", "entity": "patient", "entityId": "pat-hedi", "patientId": "pat-hedi", "summary": "Patient créé — Hédi Ben Salah", "diff": null }
  ],
  "page": 0, "size": 50, "totalElements": 400, "totalPages": 8
}
```
The `action`/`entity`/`entityId`/`diff` fields are **additions over the
prototype** (which only stores `actor`+`summary` as free text) —
required per `DATA-MODEL.md` §7.4/§8 (`HOPE-AUD-01`: structured,
append-only, no row cap, no UPDATE/DELETE grant). There is intentionally
**no `POST`/`PATCH`/`DELETE`** on this resource — every write above that
carries 🔴 triggers this table's insert as a side effect, never a
direct client call.

---

### 13. Settings (practice configuration)

Backs `routes/parametres.tsx`. `Settings` is a singleton, so most of
these are `GET`/`PATCH` on one resource, except the embedded
collections (favorites, protocols, categories, resources, certificate
templates) which get their own sub-collection endpoints since they're
independently added/removed.

#### `GET /api/settings`
**Auth:** session (read-only fields trimmed for `secretaire`) ·
**Source:** `parametres.tsx` load, used practice-wide for
document/print branding.

Response `200`:
```json
{
  "doctorName": "Dr Amine Gastro", "specialty": "Gastro-entérologie",
  "address": "12 avenue Habib Bourguiba, Tunis", "phone": "+216 71 000 000",
  "licenseNumber": "TN-1234", "consultDuration": 30, "lockDelay": 5,
  "theme": "system", "adminEmail": "admin@cabinet.tn"
}
```
(`password`/`adminPassword` never returned.)

#### `PATCH /api/settings` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:189-208`
(`setSettings` for `doctorName`/`specialty`/`address`/`phone`/
`licenseNumber`), `:428` (`consultDuration`), `:632` (`lockDelay`),
`:672` (`theme`).

Request: partial body, any subset of the `GET` response fields (except
credentials, which go through §1/§2 endpoints). Response `200`: updated
settings. Audit: `"Paramètres modifiés"`.

#### `GET /api/settings/favorites`
**Auth:** `medecin` · **Source:** `ordonnances.tsx` quick-add list,
`parametres.tsx:230-270`.

Response `200`: `{ "content": [ Favorite... ] }` (see `DATA-MODEL.md` §3.20).

#### `POST /api/settings/favorites` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx` favorite creation
form.

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```
Response `201`. Audit: `"Favori ajouté — {label}"`.

#### `DELETE /api/settings/favorites/{id}` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:263`.

Response `204`. Audit: `"Favori supprimé — {label}"`.

#### `POST /api/settings/favorites/{id}/use`
**Auth:** `medecin` · **Source:** implied by `Favorite.uses` counter
(`types.ts:272`), incremented whenever a favorite is inserted into a
prescription from `ordonnances.tsx`.

Request: `{}`. Response `200`: `{ "id": "fav-1", "uses": 12 }`.

#### `GET /api/settings/protocols`
**Auth:** `medecin` · **Source:** `ordonnances.tsx`, `parametres.tsx:280-313`.

Response `200`: `{ "content": [ Protocol... ] }`.

#### `POST /api/settings/protocols` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx` protocol creation
form.

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```
Response `201`. Audit: `"Protocole ajouté — {name}"`.

#### `DELETE /api/settings/protocols/{id}` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:313`.

Response `204`. Audit: `"Protocole supprimé — {name}"`.

#### `GET /api/settings/appointment-categories`
**Auth:** session · **Source:** `agenda.tsx` color legend,
`AppointmentModal.tsx` category picker, `parametres.tsx:440-475`.

Response `200`: `{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }`.

#### `POST /api/settings/appointment-categories` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:453-465`.

Request: `{ "label": "Contrôle", "color": "#2E9E6B" }`. Response `201`.
Audit: `"Catégorie ajoutée — {label}"`.

#### `DELETE /api/settings/appointment-categories/{id}` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:475`.

Response `204`. Audit: `"Catégorie supprimée — {label}"`.

#### `GET /api/settings/resources`
**Auth:** session · **Source:** `agenda.tsx`/`AppointmentModal.tsx`
resource picker, `parametres.tsx:480-515`.

Response `200`: `{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }`.

#### `POST /api/settings/resources` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:535`.

Request: `{ "name": "Échographe", "kind": "équipement" }`. Response `201`.
Audit: `"Ressource ajoutée — {name}"`.

#### `DELETE /api/settings/resources/{id}` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:515`.

Response `204`. Audit: `"Ressource supprimée — {name}"`.

#### `GET /api/settings/certificate-templates`
**Auth:** `medecin` · **Source:** `certificats.tsx` model list,
`parametres.tsx` template management.

Response `200`: `{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }`.

#### `POST /api/settings/certificate-templates` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx` template creation form.

Request: `{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }`.
Response `201`. Audit: `"Modèle de certificat ajouté — {type}"`.

#### `DELETE /api/settings/certificate-templates/{type}` 🔴
**Auth:** `medecin` · **Source:** template removal in `parametres.tsx`.

Response `204`. Audit: `"Modèle de certificat supprimé — {type}"`.

---

### 14. Reference data

Read-only, not tied to the practice — static/versioned content served
to every tenant. Backs `components/cabinet/IcdPicker.tsx` and
`components/cabinet/GiInterviewForm.tsx`.

#### `GET /api/reference/icd10`
**Auth:** session · **Source:** `icd10.ts:62` (`searchIcd`).

Query: `?q=reflux&limit=8`. Response `200`:
```json
{ "content": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ] }
```

#### `GET /api/reference/gi-interview`
**Auth:** `medecin` · **Source:** `gi-interview.ts` (all exported
constants — `RED_FLAGS`, `SYMPTOM_GROUPS`, `EXTENDABLE_GROUPS`,
`LOCALISATIONS`, `CARACTERISTIQUES`, `IRRADIATIONS`, `RELATIONS_REPAS`,
`FACTEURS_AGGRAVANTS`, `FACTEURS_SOULAGEANTS`, `DEBUTS`, `EVOLUTIONS`,
`BRISTOL`, `ATCD_MED`, `ATCD_DIG`, `ATCD_HEPATO`, `ATCD_CHIR`,
`ATCD_FAM`, `PARENTES`), merged server-side with the current doctor's
`customSymptomGroups`.

Response `200`: one JSON object mirroring those constants, e.g.:
```json
{
  "redFlags": [ { "id": "Dysphagie / odynophagie", "label": "Dysphagie / odynophagie" } ],
  "symptomGroups": [ { "id": "douleur", "title": "Douleur abdominale", "items": [ { "id": "Épigastralgie", "label": "Épigastralgie" } ] } ],
  "extendableGroups": [ { "id": "flags", "title": "Red flags" } ],
  "localisations": ["Épigastre", "HCD", "..."],
  "caracteristiques": ["Brûlure", "..."],
  "bristol": ["1", "2", "3", "4", "5", "6", "7"],
  "atcdMed": [ { "id": "HTA", "label": "HTA" } ]
}
```
`HOPE-CONS-01`/`HOPE-V2-10` note this should become **versioned,
specialty-selectable, database-backed** content rather than a single
hardcoded response — the shape above is a starting point for v1.

#### `GET /api/reference/drug-classes`
**Auth:** `medecin` · **Source:** `types.ts:242` (`DRUG_CLASSES`).

Response `200`: `{ "content": ["Antalgique", "AINS", "..."] }`.

#### `GET /api/reference/certificate-types`
**Auth:** `medecin` · **Source:** `types.ts:132`
(`BUILTIN_CERTIFICATE_TYPES`).

Response `200`: `{ "content": ["Arrêt de travail", "Aptitude sportive", "..."] }`.
(Merges with `Settings.certificateTemplates` — see §13 — for the full
picker list.)

#### `GET /api/reference/contact-kinds`
**Auth:** session · **Source:** `types.ts:194` (`CONTACT_KINDS`).

Response `200`: `{ "content": ["Confrère", "Laboratoire", "Fournisseur", "Autre"] }`.

---

### 15. Global search

Backs `components/cabinet/GlobalSearch.tsx` (the "/" omnibox). ⚠️ Corrected
from an earlier pass of this document, which had invented `appointments`
and `contacts` result groups: the prototype's actual search is narrower —
it matches **only `Patient`** (by name, phone, or code) plus a **static
list of navigation page labels** (Patients, Aujourd'hui, Rappels, Agenda,
Salle d'attente, Ordonnances, Certificats, Orientations, Annuaire,
Personnel, Paramètres — `GlobalSearch.tsx:7-19`). There is no
appointment search and no contact search anywhere in the running app
today.

#### `GET /api/search`
**Auth:** session · **Source:** `GlobalSearch.tsx:49-57`.

Query: `?q=salma`. Response `200`:
```json
{
  "patients": [
    { "id": "pat-salma", "name": "Salma Trabelsi", "code": "ST-482915", "phone": "+216 22 111 222" }
  ],
  "pages": [
    { "label": "Patients", "to": "/patients" }
  ]
}
```
`patients` matches accent-insensitive substring on name, phone, or code
(`matches()`, capped at 6 results client-side). `pages` matches the
static nav-label list above (capped at 4). The patient list is
role-scoped like every other patient DTO (secretary gets no clinical
fields — see §3 Patients).

`HOPE-SRCH-01` ("Server-side global search, patients + sections allowed
for the role") is what would extend this to appointments, contacts, and
other entities server-side — as designed today, this endpoint should
**not** be widened beyond `patients` + `pages` without that ticket.

---

### 16. Full endpoint index (flat list)

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/unlock
GET    /api/auth/me
POST   /api/auth/password/change
POST   /api/auth/password/forgot            (planned)
POST   /api/auth/password/reset             (planned)

GET    /api/staff
GET    /api/staff/{id}
POST   /api/staff
PATCH  /api/staff/{id}
PATCH  /api/staff/{id}/activation
POST   /api/staff/{id}/password-reset
POST   /api/staff/{id}/send-credentials
DELETE /api/staff/{id}                      (prototype behavior; recommend deactivate-only)
POST   /api/staff/me/symptom-groups
DELETE /api/staff/me/symptom-groups/{groupId}

GET    /api/patients
GET    /api/patients/{id}
POST   /api/patients
POST   /api/patients/duplicates-check
PATCH  /api/patients/{id}
POST   /api/patients/{id}/archive           (planned)

GET    /api/appointments
GET    /api/appointments/{id}
POST   /api/appointments
PATCH  /api/appointments/{id}
POST   /api/appointments/{id}/status
POST   /api/appointments/{id}/check-in
PATCH  /api/appointments/{id}/tracker
POST   /api/appointments/{id}/tracker/reopen
DELETE /api/appointments/{id}               (prototype behavior; recommend /cancel)
POST   /api/appointments/{id}/cancel        (recommended replacement)

GET    /api/agenda/blocks
POST   /api/agenda/blocks
DELETE /api/agenda/blocks/{id}
GET    /api/agenda/holidays
POST   /api/agenda/holidays
DELETE /api/agenda/holidays/{id}

GET    /api/patients/{patientId}/notes
POST   /api/patients/{patientId}/notes
PATCH  /api/patients/{patientId}/notes/{noteId}
POST   /api/patients/{patientId}/notes/{noteId}/attachments
DELETE /api/patients/{patientId}/notes/{noteId}/attachments/{attachmentId}

GET    /api/prescriptions
POST   /api/prescriptions
GET    /api/prescriptions/{id}/conflicts-preview

GET    /api/certificates
POST   /api/certificates
POST   /api/certificates/{id}/duplicate
GET    /api/certificates/{id}/pdf           (planned)

GET    /api/referrals
POST   /api/referrals
POST   /api/referrals/{id}/email            (planned)

GET    /api/contacts
POST   /api/contacts
PATCH  /api/contacts/{id}
DELETE /api/contacts/{id}

GET    /api/patients/{patientId}/diagnostics
POST   /api/patients/{patientId}/diagnostics
PATCH  /api/patients/{patientId}/diagnostics/{id}

GET    /api/audit

GET    /api/settings
PATCH  /api/settings
GET    /api/settings/favorites
POST   /api/settings/favorites
DELETE /api/settings/favorites/{id}
POST   /api/settings/favorites/{id}/use
GET    /api/settings/protocols
POST   /api/settings/protocols
DELETE /api/settings/protocols/{id}
GET    /api/settings/appointment-categories
POST   /api/settings/appointment-categories
DELETE /api/settings/appointment-categories/{id}
GET    /api/settings/resources
POST   /api/settings/resources
DELETE /api/settings/resources/{id}
GET    /api/settings/certificate-templates
POST   /api/settings/certificate-templates
DELETE /api/settings/certificate-templates/{type}

GET    /api/reference/icd10
GET    /api/reference/gi-interview
GET    /api/reference/drug-classes
GET    /api/reference/certificate-types
GET    /api/reference/contact-kinds

GET    /api/search
```

---

*Generated from a read-through of every `update()` / `setSettings()`
call site in `src/routes/*.tsx` and `src/components/cabinet/*.tsx`,
cross-referenced against `DATA-MODEL.md` and `hope-tickets.json`'s
described API conventions (Spring Boot, RFC 7807, JWT + rotating
refresh, RBAC, per-write audit events). Endpoints marked "planned" have
no equivalent client-side action in the running prototype today but
are required by tickets already scoped for v1/v2 — they're included so
the API surface doesn't have to be redesigned when those tickets land.
Endpoints marked "prototype behavior" describe what the UI currently
does even where it conflicts with the tickets' own rejection criteria
(hard delete instead of deactivate/cancel) — each such case names the
recommended real endpoint alongside it.*

