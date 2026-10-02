# Hope / Cabinet — Data Model Reference

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

## 1. High-level shape

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

## 2. Entity-relationship diagram

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

## 3. Tables in full detail

Each table below lists every field, its TypeScript type, optionality,
meaning, and where it's read/written in the UI. French inline comments
from the source are translated/kept for context since the product is
French-language.

### 3.1 `Doctor` — practice staff account (`types.ts:313`)

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

### 3.2 `Patient` (`types.ts:6`)

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

### 3.3 `Appointment` (`types.ts:24`)

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

### 3.4 `Block` (`types.ts:37`) — agenda block-out

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string` | ✅ | |
| `start` | `string` (`HH:mm`) | ✅ | |
| `end` | `string` (`HH:mm`) | ✅ | |
| `reason` | `string` | ✅ | e.g. "Congé", "Formation" |

Used in `routes/agenda.tsx` to grey out slots.

### 3.5 `Holiday` (`types.ts:46`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `date` | `string` (`yyyy-MM-dd`) | ✅ | |
| `label` | `string` | ✅ | e.g. "Aïd el-Fitr" |

Blocks the whole day automatically in `agenda.tsx` / `index.tsx`.

### 3.6 `Resource` (`types.ts:52`) — *embedded in `Settings.resources[]`, not a top-level table*

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `name` | `string` | ✅ | |
| `kind` | `"salle"` \| `"équipement"` \| `"praticien"` | ✅ | |

### 3.7 `AppointmentCategory` (`types.ts:58`) — *embedded in `Settings.appointmentCategories[]`*

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | PK |
| `label` | `string` | ✅ | e.g. "Consultation", "Contrôle" |
| `color` | `string` (hex) | ✅ | Calendar color coding |

---

### 3.8 `Note` (`types.ts:76`) — clinical note / consultation record

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

### 3.9 `NoteAttachment` (`types.ts:64`) — embedded in `Note.attachments[]`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `name` | `string` | ✅ | File name |
| `type` | `string` | ✅ | MIME type |
| `dataUrl` | `string` | ✅ | Base64 inline — **must become a real file store / object storage in the real app** |

### 3.10 `IcdCode` (`types.ts:71`) — embedded value object

| Field | Type | Required |
|---|---|---|
| `code` | `string` | ✅ |
| `label` | `string` | ✅ |

---

### 3.11 `Prescription` (`types.ts:91`)

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

### 3.12 `Checkup` (`types.ts:117`) — manual clinical follow-up point

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

### 3.13 `Certificate` (`types.ts:146`)

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

### 3.14 `CertificateTemplate` (`types.ts:141`) — *embedded in `Settings.certificateTemplates[]`*

| Field | Type | Required |
|---|---|---|
| `type` | `string` | ✅ |
| `text` | `string` | ✅ |

---

### 3.15 `Referral` (`types.ts:159`) — letter to a specialist

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

### 3.16 `Contact` (`types.ts:197`) — address book entry

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

### 3.17 `Diagnostic` (`types.ts:213`) — free-form patient interview / consultation

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

### 3.18 `AuditEntry` (`types.ts:226`) — activity log

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

### 3.19 `Settings` (`types.ts:284`) — singleton practice configuration

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

### 3.20 `Favorite` (`types.ts:263`) — quick-add prescription line, *embedded in `Settings.favorites[]`*

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

### 3.21 `Protocol` (`types.ts:276`) — prescription template, *embedded in `Settings.protocols[]`*

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `name` | `string` | ✅ | e.g. "Angine bactérienne (adulte)" |
| `category` | `string` | optional | |
| `note` | `string` | optional | |
| `lines` | `string[]` | ✅ | Ready-to-insert prescription lines for a common situation |

---

## 4. Session / runtime state (not persisted)

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

## 5. Static reference data (shipped as constants, not stored rows)

### 5.1 ICD-10 subset (`icd10.ts`)
`ICD10: IcdCode[]` — a short hand-picked subset of common general-medicine
codes (hypertension, diabetes, URTIs, GERD, etc.), each `{code, label}`.
`searchIcd(query, limit=8)` does a simple substring/prefix search. Picked
codes are **copied by value** into `Note.icd[]`, not referenced by code
alone — so the reference table can change without corrupting historical
notes. A real app likely wants the full CIM-10 (or ICD-11) reference table
server-side, searchable, with the same copy-on-select semantics preserved.

### 5.2 Structured interview reference data (`gi-interview.ts`)
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

### 5.3 `DRUG_CLASSES` (`types.ts:242`) — 17 therapeutic class labels
(Antalgique, AINS, Antibiotique, Antipyrétique, IPP/anti-acide,
Antihypertenseur, Antidiabétique, Hypolipémiant, Corticoïde,
Antihistaminique, Bronchodilatateur, Antitussif, Antispasmodique,
Anxiolytique/hypnotique, Vitamine/supplément, Dermatologie, Autre).

### 5.4 `BUILTIN_CERTIFICATE_TYPES` (`types.ts:132`) — 5 built-in types
(Arrêt de travail, Aptitude sportive, Certificat scolaire, Certificat
de grossesse, Certificat de vaccination). Extensible via
`Settings.certificateTemplates`.

### 5.5 `CONTACT_KINDS` (`types.ts:194`) — 4 built-in kinds
(Confrère, Laboratoire, Fournisseur, Autre). `Contact.kind` accepts any
string, these are just UI suggestions.

---

## 6. Cross-cutting derived/computed logic (not stored, computed at read time)

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

## 7. Security / data-hygiene issues visible directly in this schema

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

## 8. Suggested relational schema (normalized, for the real backend)

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

## 9. Field inventory — flat index (every field, one line each)

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

## 10. File map (where all of this lives today)

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
