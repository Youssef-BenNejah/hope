# Hope / Cabinet — API Endpoint Reference

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

## Conventions used throughout this document

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

## Table of contents

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

## 1. Auth & session

Backs `LockScreen.tsx` (login, quick-login, show/hide password),
`parametres.tsx` (change own password), and the session state in
`context.ts`/`store.tsx` (`locked`, `currentUser`, `role`, `isAdmin`).

### `POST /api/auth/login`
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

### `POST /api/auth/refresh`
**Auth:** public (refresh cookie required) · **Source:** implicit —
prototype keeps the session in memory only and re-shows the lock
screen on reload; the real app must silently refresh on load
(`HOPE-AUTH-03`).

No body (reads the `HttpOnly` cookie). Response `200`: same shape as
login's `accessToken`/`user`. Rotates the refresh cookie. `401` if
the refresh token is invalid, expired, or reused (reuse revokes the
whole token family — `HOPE-AUTH-01`).

### `POST /api/auth/logout`
**Auth:** session · **Source:** `Sidebar.tsx` "Verrouiller" / `lock()`
in `context.ts:20`.

No body. Revokes the refresh token, clears the cookie. Response `204`.
(In the prototype, `lock()` is purely client-side state — it doesn't
end a "session" since there isn't a server one. The real endpoint
should exist even if the UI still shows a local lock screen instead of
a full logout, per `HOPE-AUTH-04`'s "unlock without losing the current
screen" requirement — i.e. `lock()` stays client-only; this endpoint
backs a true "sign out" action, e.g. from Sidebar.)

### `POST /api/auth/unlock`
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

### `GET /api/auth/me`
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

### `POST /api/auth/password/change` 🔴
**Auth:** session · **Source:** `parametres.tsx:582-622` (own-password
change form).

Request:
```json
{ "currentPassword": "old", "newPassword": "NewPass1234" }
```
Response `204`. `400` if the new password fails policy (`HOPE-AUTH-05`:
≥10 chars, upper, lower, digit). `401` if `currentPassword` is wrong.
Audit: `"Mot de passe modifié"`.

### `POST /api/auth/password/forgot` *(planned — `HOPE-AUTH-09`, not in prototype)*
**Auth:** public

Request: `{ "email": "..." }`. Response `202` always (never reveals
whether the email exists). Sends a single-use, 30-minute reset link by
email.

### `POST /api/auth/password/reset` *(planned — `HOPE-AUTH-09`)*
**Auth:** public (bears a reset token)

Request: `{ "token": "...", "newPassword": "..." }`. Response `204`;
`410 Gone` if the token is expired/used.

---

## 2. Staff / accounts (`Doctor`)

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

### `GET /api/staff`
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

### `GET /api/staff/{id}`
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) ·
**Source:** `personnel.tsx` detail panel (secretary records only —
`secretaire` has no self-view of this record; own-profile data comes
from `GET /api/auth/me` instead).

Response `200`: single staff object as above.

### `POST /api/staff` 🔴
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

### `PATCH /api/staff/{id}` 🔴
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

### `PATCH /api/staff/{id}/activation` 🔴
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) ·
**Source:** `admin.tsx:158-164` (`toggleActive`, any role),
`personnel.tsx:196-206` (`toggleActive`, secretary records only).

Request: `{ "active": false }`. Response `200`: `{ "id": "...", "active": false }`.
Audit: `"Compte {name} désactivé"` / `"réactivé"`.

### `POST /api/staff/{id}/password-reset` 🔴
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

### `POST /api/staff/{id}/send-credentials`
**Auth:** `admin` (any target), `medecin` (`secretaire` targets only) · **Source:**
`components/cabinet/SendCredentialsModal.tsx` +
`lib/cabinet/credentials.ts:17` (`buildCredentialsEmail`) — currently
**simulated**, nothing is actually sent.

Request: `{}` (no body needed — server already knows the pending
credential). Response `202`. The real implementation replaces this
whole "send credentials by email" pattern with an activation-link flow
per `HOPE-NOT-01`/`HOPE-USR-01` — password values should never
traverse the network at all.

### `DELETE /api/staff/{id}` 🔴
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

### Custom symptom groups (embedded in staff, doctor-only)

Backs `parametres.tsx:140-170` — a doctor customizing their own
structured-interview grid (§3.17 of the data model).

#### `POST /api/staff/me/symptom-groups` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:151-156`.

Request:
```json
{ "title": "Post-opératoire", "items": ["Douleur de paroi", "Écoulement"], "extendsGroupId": null }
```
Response `201`: the created `CustomSymptomGroup`. Audit: `"Groupe de symptômes ajouté — {title}"`.

#### `DELETE /api/staff/me/symptom-groups/{groupId}` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:163-169`.

Response `204`. Audit: `"Groupe de symptômes supprimé — {title}"`.

---

## 3. Patients

Backs `routes/patients.tsx`, `components/cabinet/PatientDrawer.tsx`,
`components/cabinet/PatientPicker.tsx`, `components/cabinet/GlobalSearch.tsx`.

### `GET /api/patients`
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

### `GET /api/patients/{id}`
**Auth:** session (role-scoped DTO as above) · **Source:**
`patients.tsx:67,100,139`, `PatientDrawer.tsx:96`.

Response `200`: single patient DTO.

### `POST /api/patients` 🔴
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

### `POST /api/patients/duplicates-check`
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

### `PATCH /api/patients/{id}` 🔴
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

### `POST /api/patients/{id}/archive` *(planned — `HOPE-PAT-05`, not in prototype)*
**Auth:** `medecin`, `admin`

Request: `{}`. Response `204`. Sets `archivedAt`; patient disappears
from default list/search but is retrievable with `?archived=true`.

### `POST /api/patients/{id}/import-demo-history` *(prototype-only demo affordance)*
**Auth:** `medecin` · **Source:** `PatientDrawer.tsx:143-158` — the
"Import de dossier" button seeds 4 fake past appointments for demo
purposes. This is explicitly a prototype placeholder (per the app's
own labeling) and **should not exist** in the real API — listed here
only for completeness/traceability, not as a real design.

---

## 4. Appointments (agenda + waiting-room tracker + dashboard)

Backs `routes/agenda.tsx`, `routes/tracker.tsx`, `routes/index.tsx`
("Aujourd'hui" dashboard), `components/cabinet/AppointmentModal.tsx`.

### `GET /api/appointments`
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

### `GET /api/appointments/{id}`
**Auth:** session · **Source:** `AppointmentModal.tsx:22` (load for edit).

Response `200`: single appointment.

### `POST /api/appointments` 🔴
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

### `PATCH /api/appointments/{id}` 🔴
**Auth:** `medecin`, `secretaire` · **Source:** `AppointmentModal.tsx`
edit path (reuses the create form pre-filled).

Request: partial body + `version`. Response `200`: updated appointment.
Audit: `"Rendez-vous modifié — {patientName}"`.

### `POST /api/appointments/{id}/status` 🔴
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

### `POST /api/appointments/{id}/check-in` 🔴
**Auth:** `secretaire`, `medecin` · **Source:** `tracker.tsx:66-73`
(`checkIn`).

Request: `{}`. Response `200`:
```json
{ "id": "apt-1", "checkedInAt": "2025-01-20T10:32:00Z", "tracker": "waiting" }
```
Audit: `"Arrivée enregistrée — {patientName}"`.

### `PATCH /api/appointments/{id}/tracker` 🔴
**Auth:** `secretaire`, `medecin` · **Source:** `tracker.tsx:52-60`
(`setTracker` — moves a checked-in patient between waiting-room
columns: `waiting` → `in_consult` → `done`).

Request: `{ "tracker": "in_consult" }`. Response `200`:
`{ "id": "apt-1", "tracker": "in_consult" }`. Audit:
`"Flux patient — {patientName} : {label}"` (label = column name, e.g.
"En consultation").

### `POST /api/appointments/{id}/tracker/reopen` 🔴
**Auth:** `secretaire`, `medecin` · **Source:** `tracker.tsx:75-84`
(`reopen` — removes `checkedInAt`/`tracker`, sending the patient back
to "not arrived").

Request: `{}`. Response `200`: appointment with `checkedInAt: null`,
`tracker: null`. Audit: `"Patient retiré du tableau — {patientName}"`.

### `DELETE /api/appointments/{id}` 🔴
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

## 5. Agenda blocks & holidays

Backs `routes/agenda.tsx` (blocks) and `routes/parametres.tsx:540-580`
(holidays).

### `GET /api/agenda/blocks`
**Auth:** session · **Source:** `agenda.tsx:58` (`data.blocks.find`).

Query: `?from=&to=`. Response `200`: `{ "content": [ { "id": "blk-1", "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" } ] }`.

### `POST /api/agenda/blocks`
**Auth:** `medecin`, `secretaire` · **Source:** `agenda.tsx:233`.

Request: `{ "date": "2025-01-22", "start": "12:00", "end": "14:00", "reason": "Formation" }`.
Response `201`: created block.

### `DELETE /api/agenda/blocks/{id}`
**Auth:** `medecin`, `secretaire` · **Source:** implied by the block
list UI (delete affordance next to each block).

Response `204`.

### `GET /api/agenda/holidays`
**Auth:** session · **Source:** `agenda.tsx:59,272`, `parametres.tsx`
holiday list.

Response `200`: `{ "content": [ { "id": "hol-1", "date": "2025-04-10", "label": "Aïd el-Fitr" } ] }`.

### `POST /api/agenda/holidays`
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:572`.

Request: `{ "date": "2025-04-10", "label": "Aïd el-Fitr" }`. Response `201`.

### `DELETE /api/agenda/holidays/{id}`
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:557`.

Response `204`.

---

## 6. Notes / consultations

Backs `components/cabinet/PatientDrawer.tsx` (Notes tab, attachments),
`components/cabinet/DiagnosticModal.tsx` (structured consultation
fields + ICD picking), `routes/historique.$id.tsx` (read-only
timeline).

### `GET /api/patients/{patientId}/notes`
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

### `POST /api/patients/{patientId}/notes` 🔴
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

### `PATCH /api/patients/{patientId}/notes/{noteId}` 🔴
**Auth:** `medecin` (author or admin) · **Source:** editing an
existing note/consultation.

Request: partial body + `version`. Response `200`. Audit:
`"Consultation modifiée — {patientName}"`.

### `POST /api/patients/{patientId}/notes/{noteId}/attachments`
**Auth:** `medecin` · **Source:** `PatientDrawer.tsx` attachment
upload (drag/drop or file picker feeding `resizeImage()`/base64 today).

Request: `multipart/form-data`, field `file`. Response `201`:
`{ "id": "att-2", "name": "scanner.jpg", "type": "image/jpeg", "url": "/files/att-2" }`.

### `DELETE /api/patients/{patientId}/notes/{noteId}/attachments/{attachmentId}` 🔴
**Auth:** `medecin` · **Source:** `PatientDrawer.tsx:658-667`.

Response `204`. Audit: `"Fichier supprimé — {fileName}"`.

---

## 7. Prescriptions

Backs `routes/ordonnances.tsx`.

### `GET /api/prescriptions`
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

### `POST /api/prescriptions` 🔴
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

### `GET /api/prescriptions/{id}/conflicts-preview`
**Auth:** `medecin` · **Source:** `prescriptions.ts:64` (`lineConflicts`),
called live as the doctor types each line, before saving.

Request (query or body): `{ "patientId": "pat-salma", "line": "Amoxicilline 1g" }`.
Response `200`: `{ "allergy": ["Pénicilline"], "chronic": [] }`.

---

## 8. Certificates

Backs `routes/certificats.tsx`.

### `GET /api/certificates`
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

### `POST /api/certificates` 🔴
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

### `POST /api/certificates/{id}/duplicate` 🔴
**Auth:** `medecin` · **Source:** `certificats.tsx:181-191`
(`duplicate` — copies an existing certificate with a fresh `id`/date).

Request: `{}`. Response `201`: new certificate, same `patientId`/`type`/`text`,
`documentDate`/`createdAt` reset to now. Audit: `"Certificat dupliqué — {type}, {patientName}"`.

### `GET /api/certificates/{id}/pdf` *(planned — `HOPE-CERT-03`)*
**Auth:** `medecin`

Response `200`, `Content-Type: application/pdf` — server-rendered PDF
of the certificate (the prototype prints via the browser instead).

---

## 9. Referrals

Backs `routes/orientations.tsx`.

### `GET /api/referrals`
**Auth:** `medecin` · **Source:** `orientations.tsx` list.

Query: `?patientId=`. Response `200`:
```json
{
  "content": [
    { "id": "ref-1", "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "documentDate": "2025-01-15", "text": "...", "createdAt": "2025-01-15T00:00:00Z" }
  ]
}
```

### `POST /api/referrals` 🔴
**Auth:** `medecin` · **Source:** `orientations.tsx:86-98` (`save`).

Request:
```json
{ "patientId": "pat-salma", "specialty": "Cardiologie", "contactId": "ctc-1", "reason": "Bilan pré-thérapeutique", "text": "Cher confrère, ..." }
```
Response `201`. Audit: `"Courrier d'orientation créé — {patientName} → {specialty}"`.

### `POST /api/referrals/{id}/email` *(planned — `HOPE-ORI-03`, not in prototype)*
**Auth:** `medecin`

Request: `{}` (uses `contactId`'s email). Response `202`. Emails the
referral letter as a PDF attachment to the colleague.

---

## 10. Contacts (directory)

Backs `routes/annuaire.tsx`.

### `GET /api/contacts`
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

### `POST /api/contacts` 🔴
**Auth:** session · **Source:** `annuaire.tsx:151`.

Request: `{ "name": "Dr Karim Cardio", "kind": "Confrère", "specialty": "Cardiologie", "phone": "+216 71 000 000", "email": "karim@cardio.tn", "address": "Tunis" }`.
Response `201`. Audit: `"Contact ajouté — {name}"`.

### `PATCH /api/contacts/{id}` 🔴
**Auth:** session · **Source:** `annuaire.tsx` edit form.

Request: partial body. Response `200`. Audit: `"Contact modifié — {name}"`.

### `DELETE /api/contacts/{id}` 🔴
**Auth:** session · **Source:** `annuaire.tsx:347`.

Response `204`. Audit: `"Contact supprimé — {name}"`.

---

## 11. Diagnostics (structured interview)

Backs `components/cabinet/DiagnosticModal.tsx` +
`components/cabinet/GiInterviewForm.tsx`, read-only in
`routes/historique.$id.tsx:86`.

### `GET /api/patients/{patientId}/diagnostics`
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

### `POST /api/patients/{patientId}/diagnostics` 🔴
**Auth:** `medecin` · **Source:** `DiagnosticModal.tsx:72-90`
(`save`, status `"brouillon"` on first save).

Request:
```json
{ "date": "2025-01-20", "reason": "Douleur épigastrique", "content": "...", "status": "brouillon" }
```
Response `201`. Audit: `"Entretien créé — {patientName}"`.

### `PATCH /api/patients/{patientId}/diagnostics/{id}` 🔴
**Auth:** `medecin` (author) · **Source:** `DiagnosticModal.tsx`
re-save while editing / finalizing.

Request: `{ "content": "...", "status": "termine" }` + `version`.
Response `200`. `updatedAt` bumped server-side. Audit:
`"Entretien terminé — {patientName}"` when `status` transitions to
`"termine"`, else `"Entretien modifié — {patientName}"`.

### `GET /api/reference/gi-interview` *(reference data, not a table — see §14)*

---

## 12. Audit log

Backs `routes/journal.tsx`.

### `GET /api/audit`
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

## 13. Settings (practice configuration)

Backs `routes/parametres.tsx`. `Settings` is a singleton, so most of
these are `GET`/`PATCH` on one resource, except the embedded
collections (favorites, protocols, categories, resources, certificate
templates) which get their own sub-collection endpoints since they're
independently added/removed.

### `GET /api/settings`
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

### `PATCH /api/settings` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:189-208`
(`setSettings` for `doctorName`/`specialty`/`address`/`phone`/
`licenseNumber`), `:428` (`consultDuration`), `:632` (`lockDelay`),
`:672` (`theme`).

Request: partial body, any subset of the `GET` response fields (except
credentials, which go through §1/§2 endpoints). Response `200`: updated
settings. Audit: `"Paramètres modifiés"`.

### `GET /api/settings/favorites`
**Auth:** `medecin` · **Source:** `ordonnances.tsx` quick-add list,
`parametres.tsx:230-270`.

Response `200`: `{ "content": [ Favorite... ] }` (see `DATA-MODEL.md` §3.20).

### `POST /api/settings/favorites` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx` favorite creation
form.

Request:
```json
{ "label": "Paracétamol 1 g", "form": "comprimé", "posology": "1 cp x 3/j", "duration": "5 jours", "route": "orale", "note": "au milieu du repas", "drugClass": "Antalgique" }
```
Response `201`. Audit: `"Favori ajouté — {label}"`.

### `DELETE /api/settings/favorites/{id}` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:263`.

Response `204`. Audit: `"Favori supprimé — {label}"`.

### `POST /api/settings/favorites/{id}/use`
**Auth:** `medecin` · **Source:** implied by `Favorite.uses` counter
(`types.ts:272`), incremented whenever a favorite is inserted into a
prescription from `ordonnances.tsx`.

Request: `{}`. Response `200`: `{ "id": "fav-1", "uses": 12 }`.

### `GET /api/settings/protocols`
**Auth:** `medecin` · **Source:** `ordonnances.tsx`, `parametres.tsx:280-313`.

Response `200`: `{ "content": [ Protocol... ] }`.

### `POST /api/settings/protocols` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx` protocol creation
form.

Request:
```json
{ "name": "Angine bactérienne (adulte)", "category": "ORL", "note": "10 jours", "lines": ["Amoxicilline 1g - 1 cp x 2/j, 10 jours"] }
```
Response `201`. Audit: `"Protocole ajouté — {name}"`.

### `DELETE /api/settings/protocols/{id}` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx:313`.

Response `204`. Audit: `"Protocole supprimé — {name}"`.

### `GET /api/settings/appointment-categories`
**Auth:** session · **Source:** `agenda.tsx` color legend,
`AppointmentModal.tsx` category picker, `parametres.tsx:440-475`.

Response `200`: `{ "content": [ { "id": "cat-consultation", "label": "Consultation", "color": "#0077B6" } ] }`.

### `POST /api/settings/appointment-categories` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:453-465`.

Request: `{ "label": "Contrôle", "color": "#2E9E6B" }`. Response `201`.
Audit: `"Catégorie ajoutée — {label}"`.

### `DELETE /api/settings/appointment-categories/{id}` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:475`.

Response `204`. Audit: `"Catégorie supprimée — {label}"`.

### `GET /api/settings/resources`
**Auth:** session · **Source:** `agenda.tsx`/`AppointmentModal.tsx`
resource picker, `parametres.tsx:480-515`.

Response `200`: `{ "content": [ { "id": "res-salle-1", "name": "Salle 1", "kind": "salle" } ] }`.

### `POST /api/settings/resources` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:535`.

Request: `{ "name": "Échographe", "kind": "équipement" }`. Response `201`.
Audit: `"Ressource ajoutée — {name}"`.

### `DELETE /api/settings/resources/{id}` 🔴
**Auth:** `admin`, `medecin` · **Source:** `parametres.tsx:515`.

Response `204`. Audit: `"Ressource supprimée — {name}"`.

### `GET /api/settings/certificate-templates`
**Auth:** `medecin` · **Source:** `certificats.tsx` model list,
`parametres.tsx` template management.

Response `200`: `{ "content": [ { "type": "Certificat de sport personnalisé", "text": "..." } ] }`.

### `POST /api/settings/certificate-templates` 🔴
**Auth:** `medecin` · **Source:** `parametres.tsx` template creation form.

Request: `{ "type": "Certificat de sport personnalisé", "text": "Je soussigné..." }`.
Response `201`. Audit: `"Modèle de certificat ajouté — {type}"`.

### `DELETE /api/settings/certificate-templates/{type}` 🔴
**Auth:** `medecin` · **Source:** template removal in `parametres.tsx`.

Response `204`. Audit: `"Modèle de certificat supprimé — {type}"`.

---

## 14. Reference data

Read-only, not tied to the practice — static/versioned content served
to every tenant. Backs `components/cabinet/IcdPicker.tsx` and
`components/cabinet/GiInterviewForm.tsx`.

### `GET /api/reference/icd10`
**Auth:** session · **Source:** `icd10.ts:62` (`searchIcd`).

Query: `?q=reflux&limit=8`. Response `200`:
```json
{ "content": [ { "code": "K21.9", "label": "Reflux gastro-œsophagien sans œsophagite" } ] }
```

### `GET /api/reference/gi-interview`
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

### `GET /api/reference/drug-classes`
**Auth:** `medecin` · **Source:** `types.ts:242` (`DRUG_CLASSES`).

Response `200`: `{ "content": ["Antalgique", "AINS", "..."] }`.

### `GET /api/reference/certificate-types`
**Auth:** `medecin` · **Source:** `types.ts:132`
(`BUILTIN_CERTIFICATE_TYPES`).

Response `200`: `{ "content": ["Arrêt de travail", "Aptitude sportive", "..."] }`.
(Merges with `Settings.certificateTemplates` — see §13 — for the full
picker list.)

### `GET /api/reference/contact-kinds`
**Auth:** session · **Source:** `types.ts:194` (`CONTACT_KINDS`).

Response `200`: `{ "content": ["Confrère", "Laboratoire", "Fournisseur", "Autre"] }`.

---

## 15. Global search

Backs `components/cabinet/GlobalSearch.tsx` (the "/" omnibox). ⚠️ Corrected
from an earlier pass of this document, which had invented `appointments`
and `contacts` result groups: the prototype's actual search is narrower —
it matches **only `Patient`** (by name, phone, or code) plus a **static
list of navigation page labels** (Patients, Aujourd'hui, Rappels, Agenda,
Salle d'attente, Ordonnances, Certificats, Orientations, Annuaire,
Personnel, Paramètres — `GlobalSearch.tsx:7-19`). There is no
appointment search and no contact search anywhere in the running app
today.

### `GET /api/search`
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

## 16. Full endpoint index (flat list)

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
