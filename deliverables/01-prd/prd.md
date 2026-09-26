# Functional Product Requirements Document — OrangeHRM Web Application

## 1. Document Control

| Field | Value |
|---|---|
| Title | OrangeHRM Web Application — Functional PRD |
| Version | 2.2 (adds `US-07-08` LDAP Configuration from M2 finding FIND-005; Open Questions preamble) — 2.1 (tier consolidation + explicit API-scope decision — refines v2.0 scope-expansion rewrite, which itself supersedes v1.0 Admin-only technical PRD) |
| Status | Approved for current QA cycle (M2–M5, Admin) · specification-only for all other modules |
| Owner (role) | Lead Product Analyst, in partnership with the Senior QA Automation Architect |
| Last updated | 2026-09-26 |
| Source system | OrangeHRM, public demo build — `https://opensource-demo.orangehrmlive.com/` |
| Governing constitution | `.specify/memory/constitution.md` v1.0 |
| Companion QA artifacts | `.specify/specs/001-admin-ui/spec.md`, `plan.md`, `tasks.md` |
| Change summary vs. v1.0 | v1.0 specified the Admin module only, at test-strategy depth. v2.0 expands **product scope** to all twelve modules plus cross-cutting surfaces, written as a business-facing functional specification. The Admin module is retained as the exhaustive (Tier 1) chapter, matching where the **current QA execution cycle** (M2–M5) is actually running. All prior `EPIC-ADM-*`, `US-nn-yy`, and `NFR-nn` ids are unchanged in meaning. Technical/automation content is relocated to Appendix A. |
| Change summary vs. v2.0 | v2.1 collapses the depth model to exactly two tiers — Tier 1 (Admin, exhaustive) and Tier 3 (every other module, functional overview) — removing the intermediate Tier 2 that six module chapters previously used, so every non-Admin chapter now reads at a uniform depth. v2.1 also adds an explicit, stakeholder-visible statement (Section 6.2, Assumption A4) that API endpoint coverage is a deliberate scoping decision for this cycle, not an oversight, in response to the originating assignment naming both UI and API coverage. |
| Change summary vs. v2.1 | v2.2 closes a traceability gap left by M2. Finding FIND-005 recorded an 8th Configuration screen, **LDAP Configuration**, that this document never listed, so its two test cases had no user story to trace to. v2.2 adds it to the `EPIC-ADM-07` inventory as Tier 1 story `US-07-08`, with a field inventory and acceptance criteria written only from what exploration.md §2.7 recorded (§8.1, §10.1, audit row in §13.1). It also adds a preamble to §13 stating that every remaining `TO CONFIRM` marker belongs to a module not in the current cycle. |

**ID conventions.** Admin retains its legacy, unprefixed ids for backward compatibility with
existing QA artifacts: epics as `EPIC-ADM-nn`, stories as `US-nn-yy`. Every other module
uses a module-prefixed scheme to guarantee no collision: epics as `EPIC-<MOD>-nn`, stories
as `US-<MOD>-nn-yy`. Module codes: `ADM` Admin · `PIM` PIM · `LEV` Leave · `TIM` Time ·
`REC` Recruitment · `MYI` My Info · `PRF` Performance · `DSH` Dashboard · `DIR` Directory ·
`MNT` Maintenance · `CLM` Claim · `BUZ` Buzz · `COR` cross-cutting surfaces. Business
objectives (`BO-nn`), global business rules (`BR-nn`), and non-functional requirements
(`NFR-nn`) are global and unprefixed.

---

## 2. Table of Contents

1. Document Control
2. Table of Contents
3. Executive Summary
4. Business Objectives & Success Criteria
5. System Actors & Personas
6. Scope Statement
7. Product Map & Cross-Module Data Flow
8. Functional Breakdown — All Modules
   8.1 Admin (Tier 1) · 8.2 PIM (Tier 3) · 8.3 Leave (Tier 3) · 8.4 Time (Tier 3) ·
   8.5 Recruitment (Tier 3) · 8.6 My Info (Tier 3) · 8.7 Performance (Tier 3) ·
   8.8 Dashboard (Tier 3) · 8.9 Directory (Tier 3) · 8.10 Maintenance (Tier 3) ·
   8.11 Claim (Tier 3) · 8.12 Buzz (Tier 3) · 8.13 Cross-Cutting Surfaces (Tier 3)
9. Business Rules & Data Integrity — The Global CRUD Contract
10. User Stories & Acceptance Criteria
11. Non-Functional & UX Requirements
12. Assumptions, Constraints, Dependencies & Risks
13. Open Questions
Appendix A — Automation Alignment & Quality Metrics
Appendix B — Glossary

---

## 3. Executive Summary

OrangeHRM is a web-based Human Resource Information System (HRIS): a single system of
record that spans identity and system configuration, employee master data, absence
management, time and attendance, recruitment, performance management, expense claims,
and internal workplace communication. Organisations use it to replace a patchwork of
spreadsheets and point tools with one authenticated, role-aware application that every
employee — from a first-day hire to the system administrator — touches in some form.

The platform's defining structural feature is its **central dependency on the Admin
module**. Admin is where an organisation defines the vocabulary everything else speaks:
job titles, pay grades, employment statuses, organisational units, locations,
qualifications, and nationalities. It is also where system users are provisioned and
where the product's identity — branding, localization, enabled modules, outbound email —
is configured. Every other module consumes this reference data rather than defining its
own: an employee record in PIM cannot exist without a Job Title and Employment Status
that Admin defines; a Leave request cannot be evaluated without the Leave Types and Work
Week that Leave's own configuration screens define, but the employee taking the leave was
onboarded through Admin-configured identity. Because the dependency runs one direction —
downstream modules read Admin's configuration, not the reverse — a misconfiguration in
Admin propagates silently into every module that depends on it, often surfacing as a
confusing error two or three screens away from its actual cause.

Beyond Admin, the product organizes around the employee lifecycle. Recruitment carries a
candidate from application to hire; that hire becomes a PIM employee record; the employee
consumes their own data through My Info; their manager and HR track their time (Time),
absence (Leave), performance (Performance), and expenses (Claim) against that same
record; Directory and Dashboard give the organisation visibility into the aggregate; and
Buzz provides a social layer that sits alongside, not inside, the HR workflow.

This document specifies the **complete, currently-observable functional behaviour of the
OrangeHRM web application**, at a depth appropriate to each module's role in the current
delivery plan. The Admin module — because it is both the platform's dependency root and
the module the active QA execution cycle is automating — is specified exhaustively, to a
level a test author can act on directly. Every other module is specified completely
enough to be understood, planned against, and eventually automated in a future cycle, but
without the field-by-field exhaustiveness reserved for Admin. Section 6 states this
scope split explicitly, because conflating "what the product does" with "what this
quarter's QA cycle tests" has direct consequences for how the automation backlog is
built.

---

## 4. Business Objectives & Success Criteria

| Id | Business Objective | Business Value | Observable Success Indicator | Primary Modules |
|---|---|---|---|---|
| BO-01 | Controlled system access & role separation | Prevents unauthorized configuration or data changes; establishes accountability for every action | Every system user has exactly one role; a disabled or non-existent account cannot authenticate; an unauthenticated visitor cannot reach any protected screen | Admin, Cross-Cutting |
| BO-02 | Accurate organisational & job reference data | Reference data integrity underpins payroll classification, reporting, and workforce planning | No duplicate reference records exist; every employee-facing dropdown that draws on Admin configuration reflects the current configuration | Admin, PIM |
| BO-03 | Complete & maintainable employee master data | A single, trustworthy source of truth for every HR process that follows | Every hired candidate has a complete PIM record before Leave, Time, Performance, or Claim reference them | PIM, Recruitment, My Info |
| BO-04 | Compliant absence management | Accurate leave balances and enforced organisational policy | No approved leave exceeds the employee's entitlement; overlapping approved leave for the same employee cannot exist | Leave |
| BO-05 | Accurate time capture & project costing | Correct attendance records and billable-time data | Submitted timesheets reconcile to defined project activities; every punch-in has a matching punch-out or an explicit open state | Time |
| BO-06 | Efficient, transparent hiring funnel | Shorter time-to-hire and no candidate silently lost | Every candidate has a single, current, visible pipeline stage at all times | Recruitment |
| BO-07 | Structured performance management | Consistent, auditable evaluation cycles tied to role expectations | Every review reaches a closed state; every KPI is bound to a job title | Performance |
| BO-08 | Controlled expense claiming | Prevents unauthorized reimbursement and preserves an audit trail | Every submitted claim carries an approver decision before payment | Claim |
| BO-09 | Coherent corporate identity & safe configuration change | Consistent branding and deliberate, reversible global configuration | Branding renders consistently across the application; a global configuration change can be identified and reverted | Admin |
| BO-10 | Effective internal communication | Supports engagement and informal knowledge-sharing alongside formal HR process | Posts and interactions are visible to the intended audience and remain attributable to their author | Buzz, Dashboard |
| BO-11 | Operational visibility & oversight | Managers and auditors can locate and verify records without needing direct database access | Directory search and Dashboard widgets return results that match the current state of the underlying records | Directory, Dashboard, Maintenance |

Success indicators above are stated as **observable product behaviour**, not as test-pass
rates — the latter belongs to Appendix A, where these objectives are mapped to the
current QA cycle's quality gates.

---

## 5. System Actors & Personas

**System Administrator** (primary configuration actor). Configures identity, reference
data, organisation structure, and product-wide settings. Uses the product intensively
during setup and periodically thereafter for maintenance and onboarding-adjacent
configuration (new job titles, new locations). Expected to be technically comfortable;
low tolerance for silent failures, since a configuration mistake here is invisible until
it surfaces downstream. Cost of failure: **high and delayed** — errors are often
discovered by someone else, in another module, after the fact.

**HR Manager / HR Admin**. Owns employee master data (PIM), absence policy and
administration (Leave), and cross-module reporting. Daily-to-weekly usage. Moderate-to-high
expertise with HR process, variable technical comfort. Cost of failure: incorrect
employee records or leave balances create compliance and payroll risk.

**Line Manager / Supervisor**. Approves subordinates' leave requests, timesheets, and
claims; reviews team performance; has visibility into their reporting line's records only.
Frequent but shallow usage — mostly approval actions. Low tolerance for friction, since
approvals are usually a secondary task fitted around other work. Cost of failure: a
missed or wrongly-processed approval blocks an employee (unpaid leave, unpaid expense,
unrecorded time).

**ESS Employee** (Employee Self-Service). The largest user population. Views and
maintains their own record, applies for leave, submits timesheets and claims, and uses
Buzz. Infrequent, transactional usage with essentially no tolerance for confusing error
states, since this population has the least context on the system's internals. Cost of
failure: personal frustration and, for anything involving pay or leave, real personal
impact.

**Recruiter / Hiring Manager**. Manages vacancies and moves candidates through the
pipeline. Bursty usage tied to open positions. Cost of failure: lost or stalled
candidates, poor candidate experience.

**Auditor**. A read-only consumer of records and reports across modules, typically for
compliance or payroll verification. Infrequent, high-scrutiny usage. Cost of failure:
inability to produce an accurate record when required.

### Actor × Module Access Matrix

| Module | Sys. Admin | HR Manager | Line Manager | ESS Employee | Recruiter | Auditor |
|---|---|---|---|---|---|---|
| Admin | Full | — | — | — | — | — |
| PIM | Full | Full | Team-scoped view | Own record only (via My Info) | — | Read (reporting) |
| Leave | Config only | Full | Approve team requests | Apply/view own | — | Read |
| Time | Config only | Full | Approve team timesheets | Submit own | — | Read |
| Recruitment | — | View | — | — | Full | Read |
| My Info | — | — | — | Full (own record) | — | — |
| Performance | Config only | Full | Review team | View own reviews | — | Read |
| Dashboard | Personalised | Personalised | Personalised | Personalised | Personalised | Personalised |
| Directory | Full | Full | Full | Full | Full | Full |
| Maintenance | Full (password-gated) | — | — | — | — | — |
| Claim | Config only | Full | Approve team claims | Submit own | — | Read |
| Buzz | Full | Full | Full | Full | Full | Full |

`—` denotes no meaningful UI access on the demo's default role model. On the public demo,
only the `Admin` and `ESS` roles are actually assignable through System User Management
(`EPIC-ADM-01`); the finer-grained rows above (HR Manager, Line Manager, Recruiter,
Auditor) describe the product's intended role model, not real, separately-assignable
roles on this build. **RESOLVED (M2 — OQ-01):** the `User Role` field on both the Add
User form and the Users search filter exposes exactly two options — `-- Select --`,
`Admin`, `ESS` — confirmed directly in the rendered dropdown. No other role exists to
select on this build; see `deliverables/02-exploration/exploration.md` §2.1 / §3.

---

## 6. Scope Statement

### 6.1 In Scope (Product Scope)

The entire OrangeHRM web application, exercised **exclusively through the rendered user
interface**: navigation, forms, field validation, inline error messages, search and
filter, pagination, tables, modal dialogs, toast notifications, file upload, workflow
state transitions, session behaviour, layout, and basic accessibility, across all twelve
modules listed in Section 7.

### 6.2 Out of Scope (stated as a rule)

- API, REST, or HTTP-level testing or specification of any kind.
- Backend logic, database schema, or data-layer verification.
- Third-party integrations, beyond the behaviour of their **configuration forms** inside
  the UI. This document does not verify actual email delivery, an OAuth round-trip
  against a live provider, or a social-login handshake — only that the forms which
  configure these integrations validate and save correctly.
- Performance and load testing, penetration testing, and native mobile applications.

If a requirement cannot be verified by a person looking at the screen, it does not
belong in this PRD.

> **API scope — a deliberate decision, not an omission.** The originating assignment
> frames its milestones as covering "UI Module/s and API endpoint/s." This document, and
> the QA cycle it governs, scope to the **UI surface only**. API endpoint coverage is
> **deferred to a future cycle** by conscious choice, so that the current cycle can reach
> assertion-grade depth on the Admin UI (Tier 1) rather than spreading effort thinly
> across both surfaces. See Assumption A4 in Section 12.1.

### 6.3 Product Scope vs. Current QA Cycle Scope

This distinction is the single most important governance rule in this document, because
conflating the two would cause the automation backlog (Milestone 3) to attempt to
generate test cases for all twelve modules at once, which breaks the milestone gates
already defined in `.specify/specs/001-admin-ui/plan.md`.

| Scope type | Covers | Governs |
|---|---|---|
| **Product Scope** | All 12 modules + cross-cutting surfaces (this document, §8) | This PRD, as a durable reference for future QA cycles |
| **Current QA Cycle Scope** | Admin module only (`EPIC-ADM-00` … `EPIC-ADM-07`) | Milestones M2–M5, `.specify/specs/001-admin-ui/spec.md`, `test_design.csv`, the Playwright suite, quality gates G2–G5 |

Every chapter in Section 8 for a module other than Admin carries the marker:

> **QA CYCLE: not in current cycle — specification only.**

This means: the requirement is real and the chapter is written to assertion-ready
standard where the tier allows it, but **no test case id (`TC_ADM_xx_nnn`), page object,
or Playwright spec should be generated from it during the current cycle.** Automating a
non-Admin chapter is a scope violation of the active plan, not a bonus. Appendix A
restates this rule from the automation side and proposes the sequencing for when each
module's turn comes.

### 6.4 Boundary Rationale

The UI-only boundary exists because the UI is the contract every persona in Section 5
actually experiences — a backend that is correct but exposes a broken or misleading
screen has still failed the business. Restricting verification to what is visible on
screen also keeps this PRD readable by non-technical stakeholders and keeps the
automation it eventually produces resilient to backend refactors that don't change
observable behaviour.

---

## 7. Product Map & Cross-Module Data Flow

### 7.1 Module Inventory

| Module | Epic prefix | Primary actor | Business purpose | Depth tier | QA cycle status |
|---|---|---|---|---|---|
| Admin | `EPIC-ADM` | System Administrator | Identity, reference data, org structure, branding, global configuration | **Tier 1 — Exhaustive** | **Current cycle (M2–M5)** |
| PIM | `EPIC-PIM` | HR Manager | Employee master data and lifecycle | Tier 3 — Functional overview | Not in current cycle |
| Leave | `EPIC-LEV` | ESS Employee / Line Manager | Absence request, approval, and entitlement tracking | Tier 3 | Not in current cycle |
| Time | `EPIC-TIM` | ESS Employee / Line Manager | Timesheet and attendance capture | Tier 3 | Not in current cycle |
| Recruitment | `EPIC-REC` | Recruiter | Vacancy and candidate pipeline management | Tier 3 | Not in current cycle |
| My Info | `EPIC-MYI` | ESS Employee | Self-service view/edit of own employee record | Tier 3 | Not in current cycle |
| Performance | `EPIC-PRF` | HR Manager / Line Manager | KPI-based review cycles | Tier 3 — Functional overview | Not in current cycle |
| Dashboard | `EPIC-DSH` | All authenticated actors | At-a-glance, personalised operational summary | Tier 3 | Not in current cycle |
| Directory | `EPIC-DIR` | All authenticated actors | Organisation-wide employee lookup | Tier 3 | Not in current cycle |
| Maintenance | `EPIC-MNT` | System Administrator | Destructive record maintenance, password-gated | Tier 3 | Not in current cycle |
| Claim | `EPIC-CLM` | ESS Employee / Line Manager | Expense submission and approval | Tier 3 | Not in current cycle |
| Buzz | `EPIC-BUZ` | All authenticated actors | Internal social feed | Tier 3 | Not in current cycle |
| Cross-Cutting | `EPIC-COR` | All actors | Login, navigation, session, and other surfaces every module shares | Tier 3 | Not in current cycle |

### 7.2 Reference-Data Dependency Map

Configuration flows in one direction — downstream modules consume, they do not define:

- **Admin → PIM.** Job Titles, Employment Statuses, Pay Grades, Locations, and
  Organisational Units defined in Admin populate the dropdowns on Add Employee and the
  Job/Salary tabs of an employee record. *Consequence if wrong:* an employee is
  classified incorrectly (or cannot be classified at all) and every downstream report
  inherits the error.
- **Admin → Leave/Time/Performance/Claim (indirectly, via PIM).** These modules act on
  an employee record that Admin's identity and reference data made possible in the first
  place. *Consequence if wrong:* a leave request, timesheet, or claim cannot be
  attributed to a coherent employee profile.
- **Admin → Directory.** Location and job-title reference data drive Directory's search
  filters. *Consequence if wrong:* employees become unfindable by a filter that no
  longer matches how they were actually classified.
- **Leave's own configuration → Leave requests.** Leave Types, Leave Period, and Work
  Week (all configured inside Leave, not Admin) govern what an employee can request and
  how it is counted. *Consequence if wrong:* entitlement calculations and approvals
  become incorrect even though Admin's own data was fine.
- **Recruitment → PIM.** A candidate's "Hire" action creates a new PIM employee record.
  *Consequence if wrong:* a hired candidate never becomes a real employee record, silently
  breaking onboarding.
- **PIM → Admin (System Users).** Adding a System User in Admin requires selecting an
  existing PIM employee by name; the two records are linked, not independent.
  *Consequence if wrong:* a system user account exists with no coherent employee identity
  behind it, or an employee has no way to be granted login access.

### 7.3 End-to-End Business Journey — Hire to Productive Employee

1. A **Vacancy** is created in Recruitment (`EPIC-REC-01`) with a Hiring Manager assigned.
2. A **Candidate** applies or is added and progresses through the pipeline
   (`EPIC-REC-02`): Application Initiated → Shortlisted → Interview Scheduled →
   Interview Passed → Job Offered → **Hired**.
3. The Hire action creates a new **PIM employee record** (`EPIC-PIM-03`).
4. An Administrator provisions a **System User** account for that employee, selecting
   them by name from the same PIM record (`EPIC-ADM-01`).
5. The employee logs in and completes their own profile through **My Info**
   (`EPIC-MYI-01`): contact details, emergency contacts, dependents, immigration status.
6. HR assigns a **Leave Entitlement** to the new employee (`EPIC-LEV-02`).
7. The employee submits their **first Timesheet** (`EPIC-TIM-01`), and their Line
   Manager approves it, completing the loop from "candidate" to "productive, time-tracked
   employee."

---

## 8. Functional Breakdown — All Modules

### 8.1 Admin — `EPIC-ADM-00 … EPIC-ADM-07`

**Depth tier: Tier 1 — Exhaustive.** **QA CYCLE: current — this is the module M2–M5
automate.**

**Navigation path:** top navigation bar → **Admin**.

**Business purpose.** Admin is the platform's control plane. It is where the
organisation's identity vocabulary is defined (job, organisation, qualifications,
nationalities), where access to the system itself is granted and revoked (System Users),
and where the product's own presentation and global behaviour are configured (branding,
localization, email, modules, OAuth). No other module can meaningfully be exercised until
Admin has produced at least a minimal set of reference data — a fact that makes Admin the
correct starting point for both onboarding and QA automation.

**Primary actor:** System Administrator. **Secondary actor:** none — Admin has no
self-service surface; everything here is configuration, not personal data.

**Sub-module / screen inventory:**

| Epic | Screens |
|---|---|
| `EPIC-ADM-00` | Login, Admin tab navigation, session/logout |
| `EPIC-ADM-01` | User Management → Users (search, add, edit, delete) |
| `EPIC-ADM-02` | Job → Job Titles, Pay Grades, Employment Status, Job Categories, Work Shifts |
| `EPIC-ADM-03` | Organization → General Information, Locations, Structure |
| `EPIC-ADM-04` | Qualifications → Skills, Education, Licenses, Languages, Memberships |
| `EPIC-ADM-05` | Nationalities |
| `EPIC-ADM-06` | Corporate Branding |
| `EPIC-ADM-07` | Configuration → Email Configuration, Email Subscriptions, Localization, Language Packages, Modules, Social Media Authentication, Register OAuth Client, LDAP Configuration (added v2.2 — FIND-005) |

**Field inventory — System Users (`EPIC-ADM-01`, the highest-traffic Admin screen):**

| Field | Type | Mandatory | Constraint / allowed values | Business meaning |
|---|---|---|---|---|
| User Role | Dropdown | Yes | `Admin`, `ESS` (as observed on this build) | Determines the account's permission level |
| Employee Name | Autocomplete | Yes | Must be selected from the suggestion list; free text is rejected | Binds the login account to exactly one PIM employee record |
| Status | Dropdown | Yes | `Enabled`, `Disabled` | Whether the account can currently authenticate |
| Username | Text | Yes | Must be unique across all system users | The login identifier |
| Password | Text (masked) | Yes on create; optional on edit | Minimum length, upper-case, and numeric-character rules apply (see BR-04) | Authentication credential |
| Confirm Password | Text (masked) | Yes on create | Must match Password exactly | Prevents an unintended typo becoming the live password |

**Operations supported:** create, search (conjunctive, multi-field), edit, delete
(single and bulk, both confirmed), paginate.

**Field inventory — Qualifications & Nationalities (`EPIC-ADM-04`, `EPIC-ADM-05`):**

| Screen | Story | Field | Type | Mandatory | Business meaning |
|---|---|---|---|---|---|
| Skills | `US-04-01` | Name | Text | Yes | The competency's controlled-vocabulary label |
| Skills | `US-04-01` | Description | Text (long) | No | Detail on what the skill covers; must be retained in full on edit |
| Education | `US-04-02` | Level | Text | Yes | This screen's business key — there is no separate Name field |
| Licenses | `US-04-03` | Name | Text | Yes | The license type's controlled-vocabulary label |
| Languages | `US-04-04` | Name | Text | Yes | The language's controlled-vocabulary label |
| Memberships | `US-04-05` | Name | Text | Yes | The membership type's controlled-vocabulary label |
| Nationalities | `US-05-01` | Name | Text | Yes | The nationality's controlled-vocabulary label, referenced from an employee's Personal Details in PIM |

**Field inventory — LDAP Configuration (`EPIC-ADM-07`, `US-07-08`; added v2.2 from FIND-005):**

Written only from what exploration.md §2.7 recorded during M2. The screen was observed and
never submitted, so anything M2 did not record is marked *not recorded* rather than
inferred.

| Element | Type | Mandatory | Default observed on this build | Business meaning |
|---|---|---|---|---|
| Enable | Toggle | not recorded | not recorded | Turns the LDAP directory integration on or off |
| Server Settings (section) | Section | — | — | Groups Host, Port, Encryption and LDAP Implementation |
| Host | not recorded | not recorded | `localhost` | The directory server's address |
| Port | not recorded | not recorded | `389` | The directory server's port |
| Encryption | not recorded | not recorded | not recorded | Transport encryption for the directory connection |
| LDAP Implementation | Dropdown (`oxd-select`) | not recorded | `Open LDAP v3` | Which directory product the server runs |
| Bind Settings (section) | Section | — | — | Credentials used to connect to the directory (fields not recorded) |
| User Lookup Settings (section) | Section | — | — | How users are located in the directory |
| User Name Attribute | not recorded | not recorded | `cn` | The directory attribute holding the login name |
| User Search Filter | not recorded | not recorded | `objectClass=person` | Which directory entries count as users |
| Data Mapping (section) | Table | — | — | Maps directory attributes to employee fields (rows not recorded) |
| Additional Settings (section) | Section | — | — | Further options, including the sync interval |
| Sync Interval | not recorded | not recorded | `1` | How often directory data is synchronised (unit not recorded) |
| Test Connection, Save | Buttons | — | — | Verify and persist the configuration. **Never clicked in M2** |

The section in which exploration.md placed User Name Attribute, User Search Filter and Sync
Interval is not recorded; the grouping above follows the section names only where M2
stated it. The screen shows its own warning, verbatim: *"Before activating the LDAP
service, make sure that all LDAP settings are functioning properly since incorrect
configuration may result in corrupted data. As a precaution, we recommend you to create a
backup of your database before continuing."* On the shared demo the screen is therefore
observe-only, in the same risk class as Modules (Constitution VI.3, Risk R3; exploration.md
§9).

**Module-specific business rules** (see §9 for the full global contract; rules specific
to Admin beyond the global set):

- Employee Name must be selected from the autocomplete's suggestion list — free-typed
  text that does not resolve to a real employee is rejected as invalid, not silently
  accepted (`EPIC-ADM-01`).
- Password fields are hidden on the Edit User form until an explicit "Change Password"
  toggle is enabled — editing a user does not require resetting their credential.
- Pay Grade currency bands enforce Minimum ≤ Maximum (`EPIC-ADM-02`), confirmed via the
  inline pair of messages "Should be lower than Maximum Salary" / "Should be higher than
  Minimum Salary". Work Shift times are validated same-day only: an overnight shift
  (From later than To) is rejected outright, not accepted — see the resolved uncertainty
  below.
- Organization → General Information is read-only until an explicit Edit toggle is
  activated, preventing accidental in-place edits to organisation-wide identity data.
- Deleting an Organization Structure unit removes its child units along with it —
  the confirmation dialog for a parent with children should communicate this, per BR-09.
- Corporate Branding and Configuration → Modules changes are global and immediately
  visible to every user of the shared instance; see the blast-radius note below.

**Blast radius by Configuration screen:**

| Screen | Blast radius | Business handling |
|---|---|---|
| Email Configuration | High — could route real outbound mail if "Send Test Email" is used | Observation only; never actually send |
| Email Subscriptions | Medium — changes who receives system notifications | Revert after verification |
| Localization | Medium — changes date/language rendering instance-wide | Revert after verification |
| Language Packages | Low — read-facing | No special handling |
| Modules | Very high — can remove entire modules from every user's sidebar | Observe-only; do not toggle on a shared instance |
| Social Media Authentication / Register OAuth Client | Medium — adds/removes login-adjacent configuration | Revert after verification |
| Corporate Branding | High — visible to every user immediately | Must be reset to default before test completion |

**Upstream dependencies:** none — Admin is the dependency root.
**Downstream consumers:** PIM, Leave, Time, Performance, Directory (see §7.2).

**Behavioural uncertainties — RESOLVED (M2), formerly carried into §13 as Open Questions:**

- **Overnight Work Shift time ordering (OQ-02):** rejected. Setting From later than To
  (e.g. `06:00 PM` → `09:00 AM`) produces the inline error "To time should be after from
  time", forces `Duration Per Day` to `0.00`, and blocks Save. This build has no
  overnight-shift support at all.
- **Nationality deletion while in use by an employee (OQ-03):** **not** blocked and does
  **not** state a consequence, contrary to `BR-11`. The delete succeeds silently through
  the same generic confirmation dialog used everywhere else, and the referencing
  employee's `Nationality` field is silently reset to `-- Select --` with no notification
  to anyone. Filed as **BUG-001** (High severity) — see Appendix A / defect log.
- **Exact SMTP field validation edges (OQ-05):** `SMTP Host`, `SMTP User`, and `SMTP
  Password` are required only when their governing toggle makes them relevant (SMTP
  method selected; Authentication = Yes, respectively) — each shows `Required` when left
  blank in that state. `SMTP Port` is never required and, further, accepts non-numeric
  text (e.g. `abc`) with **no format validation at all** — a real gap against `BR-04`.
- **Exact upload size/type limits for Corporate Branding assets (OQ-04):** jpg, png, gif,
  svg; **1MB** per file for Client Logo, Client Banner, and Login Banner alike (per-field
  recommended pixel dimensions differ, but the type/size ceiling does not). The size limit
  is correctly enforced (a 1.2MB file is rejected with "Attachment Size Exceeded"), but
  the type check is broken: a non-image file under 1MB is rejected with the **same**
  "Attachment Size Exceeded" message instead of a type-specific one, because the
  client-side code tries to decode every upload as an image and mis-reports any decode
  failure as a size problem. Filed as **BUG-002** (Low-Medium severity).

Full evidence, verbatim message text, and reproduction steps for all four:
`deliverables/02-exploration/exploration.md` §2.2, §2.5, §2.6, §2.7 and §5 (defect
register). See §13 "M2 corrections" for the full list of requirement changes this
produced.

---

### 8.2 PIM — `EPIC-PIM-01 … EPIC-PIM-06`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **PIM**.

**Business purpose.** PIM (Personnel Information Management) is the employee master
record — the single object that Leave, Time, Performance, Claim, Directory, and My Info
all read from and write against. Every field an organisation needs to know about an
employee beyond "who can log in" (which is Admin's concern) lives here: personal details,
contact information, dependents, immigration status, job assignment, salary, and
qualifications.

**Primary actor:** HR Manager. **Secondary actors:** System Administrator (initial
configuration of optional/custom fields), Line Manager (read access to their team).

**Screen inventory:**

- **Configuration:** Optional Fields, Custom Fields, Data Import, Reporting Methods,
  Termination Reasons.
- **Employee List** — searchable/filterable roster.
- **Add Employee** — creates a new PIM record, with an option to simultaneously create a
  login (a System User in Admin terms).
- **Employee record tabs:** Personal Details, Contact Details, Emergency Contacts,
  Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships.
- **Termination / Reactivation.**
- **PIM Reports** — ad hoc report definition and generation.

**Field inventory — Add Employee (principal creation form):**

| Field | Type | Mandatory | Constraint | Business meaning |
|---|---|---|---|---|
| First / Last Name | Text | Yes | — | Legal identity |
| Employee Id | Text | Auto-generated, editable | Must remain unique | Internal reference number |
| Employee Photograph | File upload | No | Image types only | Directory/profile display |
| Create Login Details | Toggle | No | When enabled, exposes Username/Password fields inline | Combines PIM creation with Admin account provisioning in one step |

**Operations supported:** create, search/filter, view, edit (per tab), upload photo,
terminate, reactivate, generate reports.

**Module-specific business rules:**

- An employee cannot be assigned a Job Title, Employment Status, Sub Unit, or Location
  that does not already exist in Admin's reference data (`BR-11`-adjacent: referential
  integrity runs from PIM back to Admin).
- Terminating an employee is a state change, not a deletion — the record and its history
  remain visible, gated by a Termination Reason drawn from PIM's own configuration.
- The **Report-to** tab establishes the manager relationship that Leave and Time
  approvals, and the Actor × Module matrix in §5, depend on.

**Upstream dependencies:** Admin (job/org reference data), Recruitment (hire action
creates the record). **Downstream consumers:** Leave, Time, Performance, Claim,
Directory, My Info, Dashboard.

**Known behavioural uncertainties:** exact set of fields exposed by "Optional Fields"
configuration on this build; whether Data Import supports partial/erroring rows or is
all-or-nothing. **TO CONFIRM (Exploration).**

---

### 8.3 Leave — `EPIC-LEV-01 … EPIC-LEV-05`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **Leave**.

**Business purpose.** Leave manages the full absence lifecycle: policy configuration,
entitlement assignment, employee-initiated requests, manager approval, and reporting. It
is the module most directly tied to compliance risk (BO-04), since an incorrect balance
or an approved overlapping leave has real payroll and staffing consequences.

**Primary actor:** ESS Employee (applying). **Secondary actors:** Line Manager
(approving), HR Manager (entitlements, configuration, reporting).

**Screen inventory:** Apply, My Leave, Entitlements (Add Entitlements, Employee
Entitlements, My Entitlements), Reports (Leave Entitlements and Usage), Configure (Leave
Period, Leave Types, Work Week, Holidays), Leave List, Assign Leave.

**Field inventory — Apply for Leave (principal form):**

| Field | Type | Mandatory | Constraint | Business meaning |
|---|---|---|---|---|
| Leave Type | Dropdown | Yes | Drawn from Configure → Leave Types | Determines which entitlement balance is debited |
| From Date / To Date | Date | Yes | To Date ≥ From Date | The requested absence period |
| Partial Days | Option | No | Half-day start/end variants | Supports partial-day absence |
| Comment | Text | No | — | Context for the approver |

**Leave Request State Machine:**

| From state | Action | Actor | To state |
|---|---|---|---|
| — | Apply | ESS Employee | Pending Approval |
| Pending Approval | Approve | Line Manager | Scheduled |
| Pending Approval | Reject | Line Manager | Rejected |
| Pending Approval / Scheduled | Cancel | ESS Employee or Line Manager | Cancelled |
| Scheduled | (date elapses) | System | Taken |

**Module-specific business rules:**

- A leave request may not be approved if it would exceed the employee's remaining
  entitlement for that Leave Type (BO-04).
- Two approved (Scheduled/Taken) leave periods for the same employee may not overlap.
- Only the employee's own Line Manager (per PIM's Report-to relationship) may approve or
  reject their request (BR-14, approval authority separation).

**Upstream dependencies:** PIM (employee identity, Report-to), Admin (indirectly, since
PIM depends on Admin). **Downstream consumers:** Dashboard ("Employees on Leave Today"
widget), Time (a day on approved leave should not require a timesheet entry).

**Known behavioural uncertainties:** whether a Scheduled leave in the future can still be
edited (not just cancelled); exact behaviour when an entitlement is reduced below already-
approved leave. **TO CONFIRM (Exploration).**

---

### 8.4 Time — `EPIC-TIM-01 … EPIC-TIM-04`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **Time**.

**Business purpose.** Time captures worked hours for payroll and project costing
(BO-05), through two complementary mechanisms: structured weekly Timesheets tied to
Projects/Activities, and simple daily Attendance punch records.

**Primary actor:** ESS Employee (submitting). **Secondary actors:** Line Manager
(approving), HR Manager (configuration, reporting).

**Screen inventory:** Timesheets (My Timesheets, Employee Timesheets), Attendance (My
Records, Punch In/Out, Employee Records, Configuration), Reports (Project, Employee,
Attendance Summary), Project Info (Customers, Projects, Activities).

**Field inventory — Timesheet entry (principal form):**

| Field | Type | Mandatory | Constraint | Business meaning |
|---|---|---|---|---|
| Project | Dropdown | Yes | Drawn from Project Info | What the time is billed against |
| Activity | Dropdown | Yes | Scoped to the selected Project | The specific task within the project |
| Date | Date | Yes | Within the current timesheet period | When the work occurred |
| Hours | Numeric | Yes | Positive, within a per-day sanity bound | Duration worked |

**Timesheet State Machine:**

| From state | Action | Actor | To state |
|---|---|---|---|
| — | Create entries | ESS Employee | Not Submitted |
| Not Submitted | Submit | ESS Employee | Submitted |
| Submitted | Approve | Line Manager | Approved |
| Submitted | Reject | Line Manager | Not Submitted (for correction) |

**Module-specific business rules:**

- Every Punch In must be paired with a corresponding Punch Out before a new Punch In is
  permitted for the same employee on the same day (the punch-pairing rule).
- A rejected timesheet returns to an editable state rather than being discarded, so
  corrections do not require re-entering all hours.
- Whether an employee may edit their own Attendance records after the fact, or only view
  them, depends on Attendance Configuration. **TO CONFIRM (Exploration).**

**Upstream dependencies:** PIM (identity, Report-to for approval routing), Project Info's
own configuration. **Downstream consumers:** Dashboard ("Time at Work" widget), Reports.

---

### 8.5 Recruitment — `EPIC-REC-01 … EPIC-REC-02`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **Recruitment**.

**Business purpose.** Recruitment runs the hiring funnel from an open Vacancy through a
Candidate's progression to Hired, at which point it hands off to PIM (BO-06, §7.3).

**Primary actor:** Recruiter / Hiring Manager. **Secondary actor:** none directly in-app
(interviewers and external candidates are represented as data, not as system actors on
this build).

**Screen inventory:** Vacancies (create/edit, with Hiring Manager assignment), Candidates
(search/filter, resume upload, add/edit).

**Field inventory — Add Candidate (principal form):**

| Field | Type | Mandatory | Constraint | Business meaning |
|---|---|---|---|---|
| First / Last Name | Text | Yes | — | Candidate identity |
| Vacancy | Dropdown | No | Drawn from active Vacancies | Which open role the candidate is being considered for |
| Email | Text | Conditional | Valid email format if provided | Candidate contact |
| Resume | File upload | No | Document types only | Supporting material for the hiring decision |

**Candidate Pipeline State Machine:**

| Stage | Meaning | Possible next stages |
|---|---|---|
| Application Initiated | Candidate entered into the system | Shortlisted, rejected out-of-pipeline |
| Shortlisted | Selected for further consideration | Interview Scheduled |
| Interview Scheduled | An interview has been set | Interview Passed, Interview Failed |
| Interview Passed | Candidate cleared the interview stage | Job Offered |
| Interview Failed | Candidate did not clear the interview stage | (terminal for this vacancy) |
| Job Offered | An offer has been extended | Hired, Offer Declined |
| Hired | Candidate accepted and is onboarded | Creates a PIM record (§7.3) |
| Offer Declined | Candidate declined | (terminal) |

**Module-specific business rules:**

- The Hire action is the single integration point into PIM; it must not be reversible by
  simply changing the candidate's stage back (an already-created PIM record is not
  retracted by a pipeline-stage edit). **TO CONFIRM (Exploration)** — exact behaviour if
  a hire is reversed.
- A candidate's current stage must always be singular and visible (BO-06) — the pipeline
  view should never show a candidate as being in two stages at once.

**Upstream dependencies:** none (Recruitment originates data). **Downstream consumers:**
PIM (on Hire).

---

### 8.6 My Info — `EPIC-MYI-01`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **My Info** (visible to the logged-in
employee for their own record only).

**Business purpose.** My Info is PIM's self-service mirror: the same underlying employee
record, viewed and partially edited by the employee it belongs to, rather than by HR.

**Primary actor:** ESS Employee.

**Screen inventory:** the same tab set as a PIM employee record — Personal Details,
Contact Details, Emergency Contacts, Dependents, Immigration, Job (view-only), Salary
(view-only, if exposed at all), Report-to (view-only), Qualifications, Memberships.

**What the employee may edit vs. view:** personal/contact/emergency/dependents/
immigration/qualifications/memberships are generally editable by the employee; Job,
Salary, and Report-to are HR-controlled and expected to be **view-only** for the ESS
actor. **TO CONFIRM (Exploration)** — exact edit/view split per tab on this build, since
this is the concrete expression of the self-service boundary (BR-15) and must be verified
rather than assumed.

**Module-specific business rules:** this chapter is governed entirely by BR-15 (data
visibility boundary) applied to a single employee's own record, plus the same field-level
rules PIM defines for the tabs it shares with PIM.

**Upstream dependencies:** PIM (same underlying record). **Downstream consumers:** none —
My Info is a view/edit surface, not a data source for other modules.

---

### 8.7 Performance — `EPIC-PRF-01 … EPIC-PRF-03`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **Performance**.

**Business purpose.** Performance runs KPI-based review cycles, tying evaluation
criteria to job titles so that reviews are role-relevant rather than generic (BO-07).

**Primary actor:** HR Manager (configuration, review administration). **Secondary
actor:** Line Manager (conducting reviews), ESS Employee (viewing own reviews).

**Screen inventory:** Configure (KPIs bound to Job Titles, Trackers), Manage Reviews
(Manage Reviews, My Reviews, Employee Reviews), My Trackers, Employee Trackers (with
tracker log entries).

**Operations supported:** define KPIs per job title, generate a review for an employee,
progress a review through its lifecycle, record tracker log entries.

**Review lifecycle (overview):** a review is generated against an employee's job title's
KPIs, completed by the reviewer, and reaches a closed state that both the reviewer and
the reviewed employee can see. **TO CONFIRM (Exploration)** — the exact named states this
build uses.

**Key business rules:** a KPI cannot be scored on a review for a job title it isn't bound
to (referential integrity, BR-11-adjacent); a completed review should not be silently
editable after closure.

**Upstream dependencies:** Admin (Job Titles), PIM (employee identity).

---

### 8.8 Dashboard — `EPIC-DSH-01`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** default landing screen after login.

**Business purpose.** Dashboard gives every authenticated actor a personalised,
at-a-glance operational summary without requiring navigation into individual modules
(BO-11).

**Widget set, purpose, and data source:**

| Widget | Surfaces | Source module |
|---|---|---|
| Time at Work | Today's clocked/worked time for the logged-in user | Time |
| My Actions | Pending approvals/tasks assigned to the logged-in user | Leave, Time, Claim, Recruitment |
| Quick Launch | Shortcuts to frequently-used screens | Cross-cutting |
| Buzz Latest Posts | Recent posts from the social feed | Buzz |
| Employees on Leave Today | Who is currently absent | Leave |
| Employee Distribution by Sub Unit | Headcount breakdown by organisational unit | Admin (structure), PIM |
| Employee Distribution by Location | Headcount breakdown by location | Admin (locations), PIM |

**Key business rules:** each widget's figures must reconcile with its source module at
the time of viewing — a stale or mismatched widget is a defect, not a caching detail a
business stakeholder should have to reason about. Widget visibility/configuration per
role is **TO CONFIRM (Exploration)**.

---

### 8.9 Directory — `EPIC-DIR-01`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **Directory**.

**Business purpose.** A simple, organisation-wide employee lookup by name, job title, or
location, presented as a card grid (BO-11).

**Screen inventory:** single search screen with three filters and a result grid.

**Operations supported:** search by employee name, job title, or location (independently
or combined); view the empty state when no match is found.

**Key business rules:** search follows the same conjunctive-filter contract as every
other search screen in the product (BR-05); results reflect current PIM/Admin data with
no stale entries for terminated employees unless explicitly designed to include them
(**TO CONFIRM**).

---

### 8.10 Maintenance — `EPIC-MNT-01`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only. Flagged
observe-only regardless of cycle, due to irreversibility.**

**Navigation path:** top navigation bar → **Maintenance** (password re-authentication
required to proceed).

**Business purpose.** Provides administrative access to, and permanent purging of,
employee records — a deliberately narrow, high-risk surface separated from everyday PIM
operations by a re-authentication gate.

**Screen inventory:** password gate, Access Employee Records, Purge Employee Records.

**Key business rules:** Purge is irreversible and must be treated as destructive-by-
design; on a shared public demo instance this module must never be exercised against
real or shared data, and any future automation of it must run against fully isolated,
disposable data only.

---

### 8.11 Claim — `EPIC-CLM-01 … EPIC-CLM-02`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **Claim**.

**Business purpose.** Manages expense reimbursement requests end to end, from employee
submission through manager approval to payment (BO-08).

**Screen inventory:** Submit Claim, My Claims, Employee Claims, Configuration (Events,
Expense Types).

**Claim State Machine:**

| From state | Action | Actor | To state |
|---|---|---|---|
| — | Create | ESS Employee | Initiated |
| Initiated | Submit | ESS Employee | Submitted |
| Submitted | Approve | Line Manager | Approved |
| Submitted | Reject | Line Manager | Rejected |
| Approved | Pay | HR Manager / Finance | Paid |

**Key business rules:** a claim's expense line items must reference a configured Event
and Expense Type (referential integrity, BR-11); attachments (receipts) follow the same
upload validation contract as elsewhere (BR-12); no actor approves their own claim
(BR-14).

---

### 8.12 Buzz — `EPIC-BUZ-01`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only.**

**Navigation path:** top navigation bar → **Buzz**.

**Business purpose.** An internal social feed supporting text, photo, and video posts,
likes, comments, and shares — informal communication alongside the formal HR workflow
(BO-10).

**Screen inventory:** Newsfeed (with sort options), post composer (text/photo/video), My
Photos, My Videos, Most Liked Posts.

**Operations supported:** create, like, comment, share, edit own post, delete own post.

**Key business rules:** a user may edit or delete only their own posts and comments
(content ownership); every post and comment remains attributable to its author (BO-10);
**TO CONFIRM (Exploration)** whether any moderation capability exists for an
Administrator to remove others' content.

---

### 8.13 Cross-Cutting Surfaces — `EPIC-COR-01 … EPIC-COR-02`

**Depth tier: Tier 3.** **QA CYCLE: not in current cycle — specification only** (note:
`EPIC-ADM-00` already covers Admin-context login/navigation/session within the current
cycle; this chapter generalises the same surfaces across the whole product).

**Navigation path:** every screen, via the top bar, sidebar, and breadcrumb.

**Business purpose.** The shared shell every module sits inside: authentication, primary
navigation, session handling, and system-wide feedback (toasts). Because every persona in
Section 5 touches these surfaces on every visit, defects here have the widest possible
blast radius even though each individual surface is small.

**Screen/behaviour inventory:** Login and forgot-password flow; unauthenticated deep-link
redirect; top bar user dropdown (About, Support, Change Password, Logout); sidebar search
and collapse; breadcrumb trail; the global toast notification layer; session timeout and
post-logout back-navigation; 404/route guarding; localization's effect on date and
language rendering across every screen.

**Key business rules:** an unauthenticated user can never reach a protected screen by any
route, including a direct URL and browser back/forward after logout (BO-01); every
save/update/delete across the entire product surfaces through the same toast layer
(BR-08), so this chapter is where that mechanism itself — not any one module's use of it —
is specified.

---

## 9. Business Rules & Data Integrity — The Global CRUD Contract

These rules are defined once and referenced by id from every module chapter above,
rather than restated per screen.

| Id | Rule | Business Rationale | User-Visible Evidence | Governs |
|---|---|---|---|---|
| BR-01 | A record is never partially created; every mandatory field must be satisfied before save succeeds | Prevents incomplete, unusable reference or transactional data | Save is blocked and no row appears until all mandatory fields are valid | All modules |
| BR-02 | Validation errors appear next to the field they concern, in plain language | Lets the person fix the problem without guessing which field is wrong | Field-adjacent error text, no raw error codes | All modules |
| BR-03 | Business-key duplicates are rejected (e.g., username, reference-data name) | Prevents ambiguous or conflicting records | An explicit "already exists"-style error, not a silent second record | All modules with a uniqueness-bearing key |
| BR-04 | Field values are validated against their declared format and boundary (length, numeric, email, URL, time, date) | Keeps stored data usable by every downstream consumer | Inline validation message before/at save | All modules |
| BR-05 | Multi-field search applies all provided filters together (conjunctive), and Reset returns to the unfiltered state | Predictable search behaviour a user can reason about | Result set matches every applied filter simultaneously; Reset visibly clears all fields | All searchable lists |
| BR-06 | An empty result set is communicated explicitly, never as a blank table | Avoids the user mistaking "no results" for "still loading" or "broken" | An explicit "No Records Found"-style message | All searchable lists |
| BR-07 | Pagination is exact: the declared record count matches the true row count, no record appears on two pages, and no record is lost between pages | Auditability of any list depends on the count being trustworthy | Page-by-page traversal accounts for every record exactly once | All paginated lists |
| BR-08 | Every save, update, and delete produces an explicit success or failure notification | Silence is indistinguishable from a hang or a silent failure | A toast or equivalent notification on every mutating action | All modules |
| BR-09 | Every destructive action requires confirmation, and cancelling it changes nothing | Prevents accidental, irreversible data loss | A confirmation dialog with a genuinely non-destructive cancel path | All modules |
| BR-10 | Cancelling a form discards unsaved input | The user must be able to back out of a change with confidence | Returning to the list shows no new/changed record | All modules |
| BR-11 | A reference value currently in use cannot be silently deleted without the system stating the consequence | Prevents orphaned or silently-broken downstream records | Either the delete is blocked with an explanation, or the effect on dependents is stated before confirmation | All reference-data screens |
| BR-12 | File uploads are validated for type and size before being accepted | Prevents unusable or oversized attachments from entering the system | An explicit validation error naming the problem | Admin (Job Titles, Branding), PIM (photo), Recruitment (resume), Claim (receipts) |
| BR-13 | A workflow record can only move to a state that is a legitimate next step from its current state | Preserves the integrity of every approval/pipeline process | Only valid next actions are offered on screen | Leave, Time, Recruitment, Claim, Performance |
| BR-14 | An actor may not approve their own submission | Preserves a genuine second set of eyes on every approval | The approval action is unavailable to the submission's own author | Leave, Time, Claim, Performance |
| BR-15 | A self-service (ESS) actor sees and edits only their own records | Protects personal data and keeps HR-controlled fields HR-controlled | My Info and equivalent self-service views never expose another employee's data | My Info, Leave (My Leave), Time (My Timesheets), Claim (My Claims) |

---

## 10. User Stories & Acceptance Criteria

Stories are grouped `Module → Epic → Stories → Criteria`. Existing Admin story ids and
their meaning are unchanged from the prior revision; their Gherkin is restated here for a
complete, single-document read. Non-Admin stories are new in this revision, written at
their tier's required depth.

### 10.1 Admin (`EPIC-ADM-00 … EPIC-ADM-07`) — QA CYCLE: current

**US-00-01** — As a System Administrator, I want to log in, so that I can reach the Admin
module. *(Priority: Critical · Depends on: BR-01, BR-02)*

```gherkin
Feature: Administrator authentication

  Scenario: Successful login routes to Dashboard
    Given I am on the OrangeHRM login page
    When I enter username "Admin" and password "admin123"
    And I click "Login"
    Then I am routed to the Dashboard
    And the top bar shows the logged-in user's name

  Scenario Outline: Invalid credentials are rejected without leaking which field is wrong
    Given I am on the login page
    When I log in with "<username>" and "<password>"
    Then an alert "Invalid credentials" is displayed
    And I remain on the login page
    Examples:
      | username | password   |
      | Admin    | wrongPass  |
      | ghost    | admin123   |
      | ADMIN    | admin123   |

  Scenario Outline: Required-field validation
    Given I am on the login page
    When I leave "<field>" empty and submit
    Then the message "Required" is shown under "<field>"
    Examples:
      | field    |
      | Username |
      | Password |

  Scenario: Deep link while unauthenticated redirects to login
    Given I am not authenticated
    When I navigate directly to the System Users screen by its URL
    Then I am redirected to the login page
```

**US-00-02** — As a System Administrator, I want the Admin menu to expose its
sub-modules, so that I can reach any configuration area directly. *(Priority: High)*

```gherkin
  Scenario Outline: Admin top-tabs navigate to the correct screen
    Given I am authenticated and on the Admin module
    When I open the "<tab>" tab
    Then the "<heading>" screen is displayed
    And the breadcrumb reads "Admin"
    Examples:
      | tab             | heading            |
      | User Management | System Users       |
      | Job             | Job Titles         |
      | Organization    | General Information|
      | Qualifications  | Skills             |
      | Nationalities   | Nationalities      |
      | Corporate Branding | Corporate Branding |
      | Configuration   | Email Configuration|
```

**US-00-03** — As a System Administrator, I want logging out to fully end my session, so
that no one can reuse my browser to reach protected screens. *(Priority: Critical ·
Depends on: BR-09, NFR-07)* Session behaviour: logout invalidates the session;
back-navigation after logout must not expose authenticated screens.

**US-01-01** — As a System Administrator, I want to search system users by username,
role, employee name, and status, so that I can find an account quickly. *(Priority:
Critical · Depends on: BR-05, BR-06, BR-07)*

**US-01-02** — As a System Administrator, I want to add a system user with role,
employee, status, username, and password, so that a new account is provisioned
correctly. *(Priority: Critical · Depends on: BR-01–BR-04)*

**US-01-03** — As a System Administrator, I want to edit an existing system user, so
that role or status changes take effect without recreating the account. *(Priority:
High · Depends on: BR-02, BR-08)*

**US-01-04** — As a System Administrator, I want to delete users individually and in
bulk, with confirmation, so that access can be revoked deliberately and safely.
*(Priority: High · Depends on: BR-08, BR-09)*

**US-01-05** — As a System Administrator, I want the user list to paginate and report
record counts accurately, so that I can trust the list as a complete picture.
*(Priority: Medium · Depends on: BR-07)*

**US-01-06** — As a System Administrator, I want password rules enforced with clear,
real-time feedback, so that weak credentials are never accepted. *(Priority: Critical ·
Depends on: BR-02, BR-04)*

```gherkin
Feature: System user management

  Background:
    Given I am logged in as an administrator
    And I am on Admin > User Management > Users

  Scenario: Add a valid ESS user
    When I select User Role "ESS"
    And I type "a" into Employee Name and select a suggested employee
    And I select Status "Enabled"
    And I enter Username "e2e_user_<unique>"
    And I enter Password "Passw0rd!2025" and the same Confirm Password
    And I click "Save"
    Then a success notification is displayed
    And the user "e2e_user_<unique>" appears in the search results

  Scenario: Username uniqueness is enforced
    Given a system user "e2e_dup_<unique>" exists
    When I attempt to add another user with username "e2e_dup_<unique>"
    Then a field error indicating the username already exists is shown
    And no success notification is displayed

  Scenario Outline: Mandatory fields block submission
    When I submit the Add User form with "<field>" left empty
    Then "Required" is displayed under "<field>"
    And the record is not created
    Examples:
      | field           |
      | User Role       |
      | Employee Name   |
      | Status          |
      | Username        |
      | Password        |

  Scenario: Employee Name must be chosen from the suggestion list
    When I type an employee name that does not exist into Employee Name
    And I click "Save"
    Then a field error indicating an invalid employee is shown

  Scenario Outline: Password policy feedback (OBSERVED policy, build 5.9 — corrected M2, FIND-002)
    When I enter Password "<password>"
    Then the exact validation message "<message>" is displayed
    Examples:
      | password      | message                                      |
      | abc           | Should have at least 7 characters            |
      | Password      | Your password must contain minimum 1 number  |

  Scenario: No upper-case requirement exists on this build (corrected M2, FIND-002)
    When I enter Password "alllowercase1"
    Then the strength meter shows "Strong"
    And no validation message is displayed
    # The PRD previously asserted a message "missing an upper-case letter" for this input.
    # M2 exploration confirmed no such message ever appears, and this password is accepted
    # as strong. The invented upper-case scenario has been removed, not merely relaxed.

  Scenario: Confirm Password mismatch
    When I enter Password "Passw0rd!2025" and Confirm Password "Passw0rd!2026"
    And I click "Save"
    Then a message indicating the passwords do not match is displayed

  Scenario Outline: Search filters return a consistent result set
    When I search users by "<filter>" with value "<value>"
    Then every result row satisfies the filter
    And the record count header matches the number of rows across all pages
    Examples:
      | filter        | value   |
      | Username      | Admin   |
      | User Role     | ESS     |
      | Status        | Enabled |

  Scenario: Search with no match shows the empty state
    When I search Username "e2e_nonexistent_<unique>"
    Then "No Records Found" is displayed

  Scenario: Reset clears all filters
    Given I have applied a Username and a User Role filter
    When I click "Reset"
    Then all filter fields return to their default values
    And the unfiltered result set is restored

  Scenario: Edit a system user's role
    Given a system user "e2e_edit_<unique>" with role "ESS" exists
    When I open it for edit, change User Role to "Admin" and save
    Then a success notification is displayed
    And the list shows "Admin" for that user

  Scenario: Password is optional on edit
    Given I am editing an existing system user
    Then the password fields are hidden until "Change Password" is enabled

  Scenario: Delete a single user with confirmation
    Given a system user "e2e_del_<unique>" exists
    When I click its delete icon
    Then a confirmation dialog appears
    When I confirm the deletion
    Then a success notification is displayed
    And the user no longer appears in search results

  Scenario: Cancelling the delete dialog preserves the record
    When I open the delete dialog and cancel it
    Then the dialog closes and the record still exists

  Scenario: Bulk delete via header checkbox
    Given at least two "e2e_" users exist in the current page
    When I select them with the row checkboxes and delete the selection
    And I confirm the dialog
    Then all selected users are removed
    And the record count decreases by the number selected

  Scenario: Pagination integrity
    Given the result set spans more than one page
    When I navigate to page 2
    Then a different set of records is displayed
    And no record appears on both pages
```

**US-02-01** — As a System Administrator, I want to manage **Job Titles**, including a
Job Specification file attachment, so that every position has a defined title and
reference material. *(Priority: High · Depends on: BR-01–BR-10, BR-12)*

**US-02-02** — As a System Administrator, I want to manage **Pay Grades** and their
per-currency Minimum/Maximum salary bands, so that compensation ranges are defined and
internally consistent. *(Priority: High · Depends on: BR-01–BR-10)*

**US-02-03** — As a System Administrator, I want to manage **Employment Status** values,
so that PIM can classify employees consistently. *(Priority: Medium · Depends on:
BR-01–BR-10)*

**US-02-04** — As a System Administrator, I want to manage **Job Categories**, so that
positions can be grouped meaningfully. *(Priority: Medium · Depends on: BR-01–BR-10)*

**US-02-05** — As a System Administrator, I want to manage **Work Shifts**, including
their time range and assigned employees, so that shift-based scheduling is possible.
*(Priority: Medium · Depends on: BR-01–BR-10, BR-13)*

All five follow one shared CRUD contract, expressed once below — the same contract also
satisfies Qualifications (`EPIC-ADM-04`) and Nationalities (`EPIC-ADM-05`).

```gherkin
Feature: Reference-data CRUD contract (applies to every Job / Qualifications / Nationalities screen)

  Scenario Outline: Create a record
    Given I am on the "<screen>" screen
    When I add a new record with unique, valid values for every mandatory field and save
    Then a success notification is displayed
    And the record appears in the list

  Scenario Outline: Mandatory validation
    When I save "<screen>" with a mandatory field left empty
    Then "Required" is displayed under that field
    And no record is created

  Scenario Outline: Duplicate name rejection
    When I create a "<screen>" record with a name that already exists
    Then a duplicate/"Already exists" error is displayed
    And no second record is created

  Scenario Outline: Field length boundary
    When I enter a name at the field's stated maximum length plus one character on "<screen>"
    Then the input is either truncated at its maximum or an explicit length error is displayed

  Scenario Outline: Edit a record
    When I edit an existing "<screen>" record and save
    Then a success notification is displayed
    And the list reflects the change

  Scenario Outline: Delete with confirmation
    When I delete a "<screen>" record and confirm
    Then a success notification is displayed
    And the record is gone

  Scenario Outline: Cancel discards changes
    When I fill the "<screen>" form and cancel instead of saving
    Then I return to the list
    And no record is created

    Examples:
      | screen            | story    |
      | Job Titles        | US-02-01 |
      | Pay Grades        | US-02-02 |
      | Employment Status | US-02-03 |
      | Job Categories    | US-02-04 |
      | Work Shifts       | US-02-05 |
      | Skills            | US-04-01 |
      | Education         | US-04-02 |
      | Licenses          | US-04-03 |
      | Languages         | US-04-04 |
      | Memberships       | US-04-05 |
      | Nationalities     | US-05-01 |
```

Screen-specific additions beyond the shared contract:

```gherkin
  Scenario: Pay grade salary boundary
    Given I am adding a currency to a pay grade
    When I enter a Minimum Salary greater than the Maximum Salary
    Then a validation error indicating the maximum must exceed the minimum is displayed

  Scenario: Work shift overnight time ordering is rejected (ASSERTED — resolved M2, OQ-02)
    When I create a work shift with From "06:00 PM" and To "09:00 AM"
    Then the exact inline error "To time should be after from time" is displayed under To
    And "Duration Per Day" shows "0.00"
    And Save is blocked; no record is created
    # Resolved by manual exploration (deliverables/02-exploration/exploration.md §2.2).
    # This build has no overnight-shift support; From must be earlier than To, same day.
```

**US-03-01** — As a System Administrator, I want Organization **General Information**
to be read-only until I explicitly enable editing, so that company-identity data cannot
be changed accidentally. *(Priority: High · Depends on: BR-01–BR-04)*

**US-03-02** — As a System Administrator, I want to manage **Locations**, so that
employees can be classified by where they work. *(Priority: Medium · Depends on:
BR-01–BR-10)*

**US-03-03** — As a System Administrator, I want to manage the **Structure** hierarchy
of organisational units, so that reporting lines and sub-units are represented
accurately. *(Priority: Medium · Depends on: BR-09, BR-11)*

```gherkin
Feature: Organization management

  Scenario: Fields are read-only until Edit is toggled
    Given I am on Admin > Organization > General Information
    Then all inputs are disabled
    When I toggle "Edit"
    Then the inputs become editable and "Save" is enabled

  Scenario Outline: Field validation on save
    When I toggle Edit, set "<field>" to "<value>" and save
    Then "<outcome>" is observed
    Examples:
      | field              | value          | outcome                                |
      | Email              | not-an-email   | an expected-format email error is shown |
      | Phone              | abc!!          | an invalid-characters error is shown    |
      | Organization Name  | (empty)        | "Required" is shown                     |

  Scenario: Changes persist across reload
    When I save a modified Note and reload the page
    Then the saved value is displayed

  Scenario: Add a child organisation unit
    Given I am on Admin > Organization > Structure in Edit mode
    When I add a child unit under the root
    Then a success notification is displayed
    And the node appears beneath the root when the root is expanded

  Scenario: Deleting a parent unit removes its children with it
    Given an organisation unit has at least one child unit
    When I delete the parent and confirm
    Then the parent and all its descendants are no longer present in the tree
```

**US-04-01** — As a System Administrator, I want to manage **Skills** (Name, Description),
so that employee competencies are defined in a searchable, controlled vocabulary.
*(Priority: Medium · Depends on: BR-01–BR-10, BR-04)*

```gherkin
Feature: Skills

  Scenario: A long skill description is retained in full
    Given I create a Skill with a description at its stated maximum length
    When I save and then reopen the record for editing
    Then the full description text is retained exactly as entered
```

**US-04-02** — As a System Administrator, I want to manage **Education** levels, so that
employee qualifications can be classified consistently. *(Priority: Medium · Depends on:
BR-01–BR-10, BR-03)*

```gherkin
Feature: Education

  Scenario: Level is the business key for Education records
    Given an Education record already exists for a given Level
    When I attempt to create another Education record with the same Level
    Then a duplicate/"Already exists" error is displayed
    And no second record is created
```

**US-04-03** — As a System Administrator, I want to manage **Licenses**, so that
professional licenses can be recorded as a controlled vocabulary. *(Priority: Low ·
Depends on: BR-01–BR-10)* Follows the shared CRUD contract with no screen-specific
addition beyond it.

**US-04-04** — As a System Administrator, I want to manage **Languages**, so that
language proficiencies can be recorded consistently. *(Priority: Low · Depends on:
BR-01–BR-10)* Follows the shared CRUD contract with no screen-specific addition beyond
it.

**US-04-05** — As a System Administrator, I want to manage **Memberships**, so that
professional memberships can be recorded as a controlled vocabulary. *(Priority: Low ·
Depends on: BR-01–BR-10, BR-07)*

```gherkin
Feature: Memberships

  Scenario: Bulk delete updates the record count
    Given at least two Membership records exist
    When I select them and use "Delete Selected" and confirm
    Then both are removed
    And the displayed record count decreases by exactly the number deleted
```

**US-05-01** — As a System Administrator, I want to manage **Nationalities**, so that
employee nationality is recorded from a controlled vocabulary. *(Priority: Low ·
Depends on: BR-01–BR-10, BR-11)*

```gherkin
Feature: Nationalities

  Scenario: Deleting a Nationality already assigned to an employee — KNOWN DEFECT: BUG-001
    Given a Nationality is currently assigned to an employee in PIM
    When I attempt to delete that Nationality
    Then the confirmation dialog shows only the generic "Are you Sure? / The selected
      record will be permanently deleted." text — it does not name the affected
      employee or state any consequence
    When I confirm the deletion
    Then the Nationality is deleted with no error
    And the affected employee's Nationality field is silently reset to "-- Select --"
    And no notification is shown to the admin who deleted it, nor to anyone who later
      views the affected employee's record
    # This is the PRODUCT'S ACTUAL BEHAVIOUR, not the desired behaviour. It violates
    # BR-11 ("a reference value currently in use cannot be silently deleted without the
    # system stating the consequence"). The defect is BUG-001 (High severity) — see
    # deliverables/02-exploration/exploration.md §2.5 and §5 for the full reproduction
    # (2/2) and root-cause notes. Do NOT "fix" this scenario to assert the desired
    # BR-11-compliant behaviour; M3 must assert what the product does today and link the
    # test to BUG-001 (e.g. via test.fixme or an explicit known-defect assertion), so the
    # test suite documents the gap rather than silently passing against it or failing
    # forever against a behaviour nobody intends to change without a product fix.
```

> Resolved by manual exploration (Open Question OQ-03). This is no longer an
> **observation scenario** — it is an asserted scenario describing confirmed, reproduced
> (2/2) behaviour, annotated as a known defect rather than encoded as correct. Mirrored
> identically in `.specify/specs/001-admin-ui/spec.md`.

**US-06-01** — As a System Administrator, I want to upload a client logo, login banner,
and login background (and reset them to default), so that the product reflects our
brand. *(Priority: Medium · Depends on: BR-09, BR-12, Constitution VI.3)*

**US-06-02** — As a System Administrator, I want to change the primary, secondary, and
text colours with a live preview, so that I can confirm the theme before committing to
it. *(Priority: Low · Depends on: Constitution VI.3 — expected `needs automation = No`
on the shared demo)*

**US-06-03** — As a System Administrator, I want social media link fields to validate
URL format, so that Corporate Branding never publishes a broken link. *(Priority: Low ·
Depends on: BR-04)*

```gherkin
Feature: Corporate branding

  Scenario: Upload a logo of an unsupported type shows the WRONG message — KNOWN DEFECT: BUG-002 (corrected M2)
    When I attach a small plain-text file (well under 1MB) to Client Logo
    Then the message "Attachment Size Exceeded" is displayed
    And no upload occurs
    # This is the PRODUCT'S ACTUAL BEHAVIOUR, not the desired one. The PRD previously
    # asserted "a file-type validation error is displayed" — that message does not exist
    # on this build. The browser console shows the real cause: "The source image cannot
    # be decoded." — every upload is decoded as an image, and any decode failure is
    # reported as a size problem regardless of the file's actual size. Filed as BUG-002
    # (Low-Medium). See deliverables/02-exploration/exploration.md §2.6 and §5.

  Scenario: Oversized image is rejected (confirmed M2 — matches the PRD's original assumption)
    When I attach a 1.2MB image to Client Logo (limit is 1MB per §OQ-04 resolution above)
    Then the message "Attachment Size Exceeded" is displayed
    And no upload occurs

  Scenario: Reset to default restores the stock branding
    Given branding has been modified
    When I reset to default and confirm
    Then the default OrangeHRM branding is restored after reload
```

> Constitution VI.3: every branding test must revert its own change by the end of the
> test, regardless of outcome; colour-picker live-preview cases are expected to remain
> `needs automation = No` on the shared demo (Section 6.3, observe-only note).

**US-07-01** — As a System Administrator, I want **Email Configuration**'s SMTP fields
to appear only when relevant, so that the form isn't cluttered by an irrelevant sending
method's settings. *(Priority: Medium · Depends on: BR-01–BR-04 · Send-test observed
only, never actually triggered — blast-radius note, §8.1)*

**US-07-02** — As a System Administrator, I want to manage **Email Subscriptions**, so
that system notifications reach the right people. *(Priority: Low · Depends on: BR-04)*

**US-07-03** — As a System Administrator, I want **Localization** settings (language,
date format) to persist and apply product-wide, so that every screen renders dates
consistently. *(Priority: Medium · Depends on: BR-01)*

**US-07-04** — As a System Administrator, I want to view **Language Packages**, so that
I know what localization content is available. *(Priority: Low)*

**US-07-05** — As a System Administrator, I want **Modules** to be enabled/disabled with
a visible sidebar effect, so that unused functionality can be hidden. *(Priority: Low ·
Observe-only on the shared demo — Constitution VI.3, Risk R3)*

**US-07-06** — As a System Administrator, I want **Social Media Authentication**
provider entries validated (Name, Provider URL, credentials), so that login-adjacent
configuration cannot be saved malformed. *(Priority: Low · Depends on: BR-01, BR-04)*

**US-07-07** — As a System Administrator, I want to **Register an OAuth Client** with
CRUD and duplicate-name protection, so that external client registrations stay unique
and well-formed. *(Priority: Low · Depends on: BR-01–BR-10)*

**US-07-08** — As a System Administrator, I want to see **LDAP Configuration**'s settings
and their current defaults before anything is changed, so that directory integration is
never switched on blind against a live instance. *(Priority: Low · Tier 1 · Added v2.2 —
provenance: FIND-005, M2 found this screen missing from the original inventory · Observe-
only on the shared demo — Constitution VI.3, Risk R3; field inventory in §8.1)*

```gherkin
Feature: Configuration screens

  Scenario: SMTP fields appear only for the SMTP method
    Given I am on Admin > Configuration > Email Configuration
    When I select mail sending method "SMTP"
    Then Host, Port, Username, Password and Authentication fields become visible
    When I select "Sendmail" instead
    Then those fields are hidden

  Scenario: Email Configuration test-send is observation only
    Given I am on Email Configuration
    Then the "Send Test Email" action is exercised only as an observation scenario
      in this cycle — no real outbound email is triggered (blast-radius note, §8.1)

  Scenario: Localization date format persists and propagates
    When I change the date format and save
    And I reload the page
    Then the selected format is still displayed
    And a date-bearing screen elsewhere in the product renders dates in that format

  Scenario: Modules toggles are observed, not automated
    Given Configuration > Modules can enable or disable an entire module's sidebar entry
    Then this screen is exercised manually and observed only, never automated against
      the shared instance (Constitution VI.3, Risk R3)

  Scenario: LDAP Configuration shows its default field inventory
    Given I am on Admin > Configuration > LDAP Configuration
    Then the form shows an Enable toggle and the sections Server Settings, Bind Settings,
      User Lookup Settings, Data Mapping and Additional Settings
    And Host is "localhost", Port is "389", LDAP Implementation is "Open LDAP v3",
      User Name Attribute is "cn", User Search Filter is "objectClass=person"
      and Sync Interval is "1"

  Scenario: LDAP Configuration is observed, never mutated
    Given the screen warns that incorrect configuration "may result in corrupted data"
    Then Enable, Test Connection and Save are observed only and never clicked on the
      shared instance (Constitution VI.3, Risk R3; exploration.md §9)
```

### 10.2 PIM (`EPIC-PIM`) — QA CYCLE: not in current cycle

**US-PIM-01-01** — As an HR Manager, I want to add a new employee, so that their record
exists before any other module needs it. *(Priority: High · Depends on: BR-01, BR-11)*

```gherkin
Feature: Add employee

  Scenario: Add an employee with minimum required data
    Given I am on PIM > Add Employee
    When I enter a First Name and Last Name and save
    Then the employee record is created
    And I am taken to that employee's Personal Details tab

  Scenario: Create Login Details inline
    Given I am adding a new employee
    When I enable "Create Login Details" and complete the resulting Username/Password fields
    And I save
    Then both the employee record and its linked system user account are created

  Scenario: An employee cannot be assigned a non-existent Job Title
    Given I am on an employee's Job tab
    When I attempt to select a Job Title that has since been deleted from Admin
    Then the field no longer offers that value
```

**US-PIM-02-01** — As an HR Manager, I want to search the employee list, so that I can
find a specific employee quickly. *(Priority: Medium · Depends on: BR-05, BR-06, BR-07)*

```gherkin
  Scenario: Search returns a consistent result set
    When I search the Employee List by name
    Then every result matches the search term
    And the record count matches the number of rows across all pages

  Scenario: Search with no match shows the empty state
    When I search for a name that does not exist
    Then an explicit no-records message is displayed
```

**US-PIM-05-01** — As an HR Manager, I want to terminate an employee, so that their
status reflects reality without destroying their history. *(Priority: Medium · Depends
on: BR-13)*

```gherkin
  Scenario: Terminate an employee with a reason
    Given I am viewing an active employee
    When I terminate them with a Termination Reason
    Then the employee's status changes to terminated
    And their historical record remains viewable
```

### 10.3 Leave (`EPIC-LEV`) — QA CYCLE: not in current cycle

**US-LEV-01-01** — As an ESS Employee, I want to apply for leave, so that my absence is
recorded and can be approved. *(Priority: High · Depends on: BR-01, BR-13)*

```gherkin
Feature: Apply for leave

  Scenario: Submit a valid leave request
    Given I am on Leave > Apply
    When I select a Leave Type, a From Date and a To Date within my entitlement
    And I submit
    Then the request enters Pending Approval
    And it appears in My Leave with that status

  Scenario: A request exceeding entitlement is rejected at submission or approval
    Given my remaining entitlement for a Leave Type is less than the requested period
    When I submit a request for more than my remaining entitlement
    Then the system prevents the request from being approved as submitted
```

**US-LEV-01-02** — As a Line Manager, I want to approve or reject my team's leave
requests, so that absence is controlled. *(Priority: High · Depends on: BR-13, BR-14)*

```gherkin
  Scenario: Approve a pending request
    Given a leave request from my team member is Pending Approval
    When I approve it
    Then its state becomes Scheduled

  Scenario: A manager cannot approve their own request
    Given I have submitted my own leave request
    Then I am not offered the approval action on my own request

  Scenario: Overlapping approved leave is prevented
    Given an employee already has an approved leave period
    When a second request overlapping that period is submitted
    Then it cannot also reach an approved state
```

### 10.4 Time (`EPIC-TIM`) — QA CYCLE: not in current cycle

**US-TIM-01-01** — As an ESS Employee, I want to submit a timesheet, so that my worked
hours are recorded against the correct project. *(Priority: High · Depends on: BR-01,
BR-13)*

```gherkin
Feature: Timesheet submission

  Scenario: Submit a completed timesheet
    Given I have entered hours against a Project and Activity for the current period
    When I submit the timesheet
    Then its state becomes Submitted
    And I can no longer edit it directly

  Scenario: A rejected timesheet becomes editable again
    Given my submitted timesheet is rejected by my manager
    Then its state returns to Not Submitted
    And I can edit and resubmit it
```

**US-TIM-02-01** — As an ESS Employee, I want to punch in and out, so that my attendance
is captured without a manual timesheet entry. *(Priority: Medium · Depends on: BR-13)*

```gherkin
  Scenario: Punch out requires a prior punch in
    Given I have not punched in today
    Then Punch Out is not offered as a valid action

  Scenario: A second punch in requires the first to be closed
    Given I have punched in and not yet punched out
    Then I am not offered a second Punch In until I punch out
```

### 10.5 Recruitment (`EPIC-REC`) — QA CYCLE: not in current cycle

**US-REC-02-01** — As a Recruiter, I want to move a candidate through the pipeline, so
that their hiring status is always current and visible. *(Priority: High · Depends on:
BR-13)*

```gherkin
Feature: Candidate pipeline progression

  Scenario Outline: Only legitimate next stages are offered
    Given a candidate is at stage "<current>"
    Then the available next stages are exactly "<next stages>"
    Examples:
      | current              | next stages                          |
      | Application Initiated| Shortlisted                          |
      | Shortlisted          | Interview Scheduled                  |
      | Interview Scheduled  | Interview Passed, Interview Failed   |
      | Job Offered          | Hired, Offer Declined                |

  Scenario: Hiring a candidate creates an employee record
    Given a candidate has reached Job Offered
    When I mark them Hired
    Then a new PIM employee record is created for them
```

### 10.6 My Info (`EPIC-MYI`) — QA CYCLE: not in current cycle

**US-MYI-01-01** — As an ESS Employee, I want to view and update my own personal
details, so that my record stays accurate without needing HR's involvement for routine
changes. *(Priority: Medium · Depends on: BR-15)*

```gherkin
Feature: Self-service record access

  Scenario: An employee can edit their own contact details
    Given I am logged in as an ESS employee
    When I update my phone number on My Info > Contact Details and save
    Then the change is saved and reflected on reload

  Scenario: An employee cannot view another employee's My Info
    Given I am logged in as an ESS employee
    Then I have no path in the UI to another employee's My Info record

  Scenario: HR-controlled fields are not editable by the employee
    Given I am viewing my own Job tab under My Info
    Then the fields are presented as view-only
```

### 10.7 Performance (`EPIC-PRF`) — QA CYCLE: not in current cycle

**US-PRF-02-01** — As a Line Manager, I want to complete a performance review for my
team member, so that their evaluation is recorded against their role's KPIs. *(Priority:
Medium · Depends on: BR-11, BR-13)*

```gherkin
  Scenario: A review is generated against the employee's job title's KPIs
    Given an employee's Job Title has defined KPIs
    When a review is generated for them
    Then only those KPIs are available to score

  Scenario: A closed review is not silently editable
    Given a review has reached its closed state
    Then further edits are not offered through the normal review screen
```

### 10.8 Dashboard (`EPIC-DSH`) — QA CYCLE: not in current cycle

**US-DSH-01-01** — As any authenticated user, I want my Dashboard to reflect current
data, so that I can trust it as a starting point for my work. *(Priority: Low · Depends
on: BR-06)*

```gherkin
  Scenario: Employees on Leave Today reflects Leave module state
    Given an employee has an approved leave request covering today
    Then that employee appears in the Employees on Leave Today widget

  Scenario: An empty widget states so explicitly
    Given no employee is on leave today
    Then the widget shows an explicit empty state rather than appearing broken
```

### 10.9 Directory (`EPIC-DIR`) — QA CYCLE: not in current cycle

**US-DIR-01-01** — As any authenticated user, I want to search the employee directory,
so that I can find a colleague by name, role, or location. *(Priority: Low · Depends on:
BR-05, BR-06)*

```gherkin
  Scenario: Combined filters narrow the result set
    When I search by both Job Title and Location
    Then every result matches both filters

  Scenario: No match shows the empty state
    When I search for a combination that matches no one
    Then an explicit no-results state is shown
```

### 10.10 Maintenance (`EPIC-MNT`) — QA CYCLE: not in current cycle, observe-only

**US-MNT-01-01** — As a System Administrator, I want Purge to be gated and confirmed, so
that it cannot happen by accident. *(Priority: Low · Depends on: BR-09)*

```gherkin
  Scenario: Maintenance requires re-authentication
    Given I navigate to Maintenance
    Then I am prompted to re-enter my password before proceeding

  Scenario: Purge requires explicit confirmation
    When I initiate a Purge action
    Then I must explicitly confirm before any record is removed
```

### 10.11 Claim (`EPIC-CLM`) — QA CYCLE: not in current cycle

**US-CLM-01-01** — As an ESS Employee, I want to submit an expense claim, so that I can
be reimbursed. *(Priority: Medium · Depends on: BR-01, BR-11, BR-13)*

```gherkin
Feature: Submit a claim

  Scenario: A claim line item must reference a configured Event and Expense Type
    Given I am submitting a claim
    Then I may only select an Event and Expense Type that are currently configured

  Scenario: A submitted claim requires manager action before payment
    Given I have submitted a claim
    Then it cannot reach Paid without first being Approved by my manager
```

### 10.12 Buzz (`EPIC-BUZ`) — QA CYCLE: not in current cycle

**US-BUZ-01-01** — As any authenticated user, I want to post and interact on Buzz, so
that I can participate in internal communication. *(Priority: Low)*

```gherkin
  Scenario: A user can edit or delete their own post
    Given I authored a post
    Then I am offered edit and delete actions on it

  Scenario: A user cannot edit another user's post
    Given a post was authored by someone else
    Then I am not offered edit or delete actions on it
```

### 10.13 Cross-Cutting Surfaces (`EPIC-COR`) — QA CYCLE: not in current cycle

**US-COR-01-01** — As any user, I want an expired session to return me cleanly to login,
so that I never see a broken authenticated screen. *(Priority: High · Depends on: NFR-07)*

```gherkin
  Scenario: Session expiry redirects cleanly
    Given my session has expired
    When I attempt any action on a protected screen
    Then I am returned to the login page without a broken or partially-rendered screen

  Scenario: Back-navigation after logout does not expose protected content
    Given I have logged out
    When I use the browser back button
    Then I do not see any previously-authenticated screen with live data
```

---

## 11. Non-Functional & UX Requirements

| Id | Requirement | Business Rationale | Observable Acceptance Condition | Applies To |
|---|---|---|---|---|
| NFR-01 | Every destructive action is confirmed by a modal | Prevents accidental, irreversible data loss | A confirmation dialog appears; cancelling changes nothing | All modules |
| NFR-02 | Every save produces an explicit success or error notification | Removes ambiguity about whether an action completed | A toast or equivalent appears on every mutating action | All modules |
| NFR-03 | Validation errors are field-adjacent and human-readable | Lets a user self-correct without support intervention | Error text appears next to the field, free of internal codes | All modules |
| NFR-04 | Layout remains usable at 1920×1080, 1366×768, and 768×1024 | Users access the product from a range of devices | Sidebar, tables, modals, and the Buzz feed remain non-overlapping and non-horizontally-scrolling at all three viewports | All modules |
| NFR-05 | No client-side console errors during happy-path navigation | A quiet console is a proxy for a stable front end | No uncaught error is logged during standard navigation | All modules |
| NFR-06 | Primary flows are keyboard-reachable, with visible labels and sane tab order | Supports users who cannot or do not use a mouse | Every primary control has an accessible name and is reachable in visual tab order | All modules |
| NFR-07 | Session expiry and logout return the user cleanly to login | Prevents confusing or insecure dead-end states | No broken screen after expiry; no authenticated content visible after logout via back-navigation | All modules |
| NFR-08 | Screens clear their loading indicator within a reasonable perceived-time budget | Users should never wonder if the application has frozen | Spinners/loading states resolve within roughly 10 seconds under normal conditions | All modules |

**Additional UX requirements (new in this revision):**

- **Consistency.** Terminology, button placement, table interaction, and confirmation
  patterns must be uniform across all twelve modules; a module that names the same
  concept differently (e.g., a different verb for "cancel a workflow item") is a
  consistency defect, not an acceptable local variation.
- **Localization integrity.** Wherever a date is rendered, it must reflect the
  Admin-configured Localization date format consistently, across every module, not just
  the screen where the format was set.

---

## 12. Assumptions, Constraints, Dependencies & Risks

### 12.1 Assumptions

| Id | Assumption |
|---|---|
| A1 | The shared public demo's data resets periodically; no requirement in this document may be validated against, or assume the persistence of, pre-existing records. |
| A2 | The demo is a shared instance, concurrently mutated by other, unrelated users at any time. |
| A3 | Some role-gated behaviour described in Section 5's actor matrix cannot be fully observed from a single Admin-level account on this demo build. |
| A4 | API endpoint coverage is deliberately deferred to a future cycle; this cycle is UI-only by design (Section 6.2), trading breadth across both surfaces for depth on the observable UI surface — this is a scoping decision, not an oversight. |

### 12.2 Constraints

| Id | Constraint |
|---|---|
| C1 | Verification is limited to what is observable through the rendered UI (Section 6). |
| C2 | Screens with global blast radius (Admin Configuration → Modules; Maintenance → Purge) must not be exercised destructively against the shared instance. |

### 12.3 Dependencies

| Id | Dependency |
|---|---|
| D1 | Every non-Admin module's specification quality depends on Admin's reference data existing and being correct first (Section 7.2). |
| D2 | Future QA cycles automating a new module depend on that module's chapter here being upgraded from its current tier to Tier 1 rigor before automation begins (Appendix A). |

### 12.4 Risks

| Id | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | Known product defects exist in the demo build and can be mistaken for test flakiness | Medium | Medium | Distinguish via manual exploration (M2) before automating an assertion; file confirmed defects |
| R2 | Parallel test execution against the shared demo triggers rate limiting | Medium | Medium | Cap execution workers; avoid aggressive parallelism on the shared instance |
| R3 | Some Configuration/Maintenance screens have a blast radius affecting all concurrent users | High | Low (if respected) | Default to observe-only; never automate destructively against the shared instance |
| R4 | A future QA cycle skips straight to automating a Tier 3 module without first raising its specification depth to Tier 1 rigor | Medium | Medium | Enforce the Appendix A sequencing and the tier-upgrade dependency (D2) |

---

## 13. Open Questions

**Remaining `TO CONFIRM` markers are unresolved by design.** Every `TO CONFIRM
(Exploration)` marker still in this document sits in a Tier 3 chapter for a module marked
**"not in current cycle"** in the §7 Product Map (and in its own chapter header). None is unfinished work from this cycle. They stay open
because those modules were never explored: this cycle explored and executed Admin only,
and filling a marker without exploration would break the rule that no requirement is
written by assumption (Constitution Article V). Together they are the **entry backlog for
whichever module runs next via `/new-module`**, whose M2 exploration resolves that
module's markers first. Every Admin (current-cycle) marker was resolved in M2 (OQ-01 to
OQ-05, §13.1). The nine remaining markers, by module:

| Module (§7 status) | Where | Marker (what is unconfirmed) | Open Question |
|---|---|---|---|
| PIM — not in current cycle | §8.2 | Whether Data Import is all-or-nothing or tolerates partial rows | OQ-06 |
| Leave — not in current cycle | §8.3 | Effect of reducing an entitlement below already-approved leave | OQ-07 |
| Time — not in current cycle | §8.4 | Whether employees can edit their own Attendance records after submission | OQ-08 |
| Recruitment — not in current cycle | §8.5 | Whether a Hire can be reversed, and what happens to the PIM record | OQ-09 |
| My Info — not in current cycle | §8.6 | The exact view/edit split per tab for the ESS employee | OQ-10 |
| Performance — not in current cycle | §8.7 | The exact named states of a review's lifecycle | OQ-11 |
| Dashboard — not in current cycle | §8.8 | Whether widget visibility varies by role | OQ-13 |
| Directory — not in current cycle | §8.9 | Whether search includes terminated employees | OQ-14 |
| Buzz — not in current cycle | §8.12 | Whether an Administrator can moderate other users' posts | OQ-12 |

| Id | Question | Module | Why it matters | Resolution path | Status |
|---|---|---|---|---|---|
| OQ-01 | Which of HR Manager, Line Manager, Recruiter, and Auditor are truly distinct, separately-assignable roles on this build, versus conventions layered over Admin/ESS? | Admin, cross-cutting | The Actor × Module Access Matrix (§5) is only as accurate as the real role model | Manual exploration of Admin > User Management > Users' actual Role options | **RESOLVED (M2).** Only `Admin` and `ESS` exist; confirmed in both the Add User form and the search filter dropdown. |
| OQ-02 | Does an overnight Work Shift (e.g., 18:00–09:00) get rejected or accepted as valid? | Admin (`EPIC-ADM-02`) | Determines whether this is an asserted pass/fail case or remains an observation scenario | M2 manual exploration (already flagged in `.specify/specs/001-admin-ui/spec.md`) | **RESOLVED (M2).** Rejected — "To time should be after from time", Duration forced to 0.00, Save blocked. |
| OQ-03 | Is deleting a Nationality currently assigned to an employee blocked, or does it cascade? | Admin (`EPIC-ADM-05`) | Determines the correct BR-11 behaviour to assert | M2 manual exploration | **RESOLVED (M2) — BUG-001.** Neither blocked nor warned; silently cascades, orphaning the employee's field. Reproduced 2/2. |
| OQ-04 | What are the exact file type and size limits enforced by Corporate Branding uploads? | Admin (`EPIC-ADM-06`) | Needed to write a concrete boundary test rather than an approximate one | M2 manual exploration | **RESOLVED (M2) — BUG-002.** jpg/png/gif/svg, ≤1MB; size enforcement correct, but type-rejection message is wrong (reports size, not type). |
| OQ-05 | What SMTP field validation edge cases exist on Email Configuration? | Admin (`EPIC-ADM-07`) | Needed before any assertion beyond field-visibility toggling | M2 manual exploration | **RESOLVED (M2) — FIND-006.** Host/User/Password conditionally required as expected; Port is optional with no format validation at all. |
| OQ-06 | What fields does PIM's "Optional Fields" configuration actually expose, and is Data Import all-or-nothing or partial-row-tolerant? | PIM | Affects how PIM's Tier 3 chapter would be upgraded to Tier 1 for a future cycle | Future-cycle exploration | Open — future cycle |
| OQ-07 | Can a future-dated Scheduled leave request still be edited, or only cancelled? What happens if an entitlement is retroactively reduced below already-approved leave? | Leave | Determines the true state machine and a key business-rule edge case | Future-cycle exploration | Open — future cycle |
| OQ-08 | Can an employee edit their own Attendance records after submission, or view-only? | Time | Affects the Attendance business-rule statement | Future-cycle exploration | Open — future cycle |
| OQ-09 | Is a Hire action in Recruitment reversible, and if so, what happens to the already-created PIM record? | Recruitment | Affects the pipeline state machine's terminal-state accuracy | Future-cycle exploration | Open — future cycle |
| OQ-10 | Which My Info tabs are genuinely view-only for the ESS employee versus editable? | My Info | This is the concrete test of the BR-15 self-service boundary | Future-cycle exploration | Open — future cycle |
| OQ-11 | What are the named states of a Performance review's lifecycle on this build? | Performance | Needed to state the lifecycle precisely rather than generically | Future-cycle exploration | Open — future cycle |
| OQ-12 | Does an Administrator have any moderation capability over other users' Buzz posts? | Buzz | Affects whether a moderation business rule belongs in a future BR set | Future-cycle exploration | Open — future cycle |
| OQ-13 | Is Dashboard widget visibility/configuration the same for every role, or does it vary by actor? | Dashboard | Affects whether the widget set in §8.8 needs a per-role variant table in a future cycle | Future-cycle exploration | Open — future cycle |
| OQ-14 | Does Directory search include terminated employees, or only active ones? | Directory | Affects whether the empty-state and result-set business rule in §8.9 needs a stated inclusion/exclusion rule | Future-cycle exploration | Open — future cycle |

Every item above corresponds to a place in Sections 8–10 marked **TO CONFIRM
(Exploration)**. None of these gaps have been filled by assumption. OQ-01 through OQ-05
(Admin, current cycle) were resolved by Milestone 2 manual exploration — see the Status
column above and the "M2 corrections" subsection immediately below for the full audit
trail. OQ-06 through OQ-14 name other modules, are explicitly out of scope for the
current QA cycle, and remain open pending a future cycle.

### 13.1 M2 corrections — audit trail

Every requirement in this document that changed as a direct result of Milestone 2
manual exploration, with the finding/bug/open-question id that caused the change. This
is the record that the Progressive Specification pipeline (Constitution Article V)
actually ran: observation scenarios were converted to assertions only after being
verified against the live build, not guessed.

| Requirement changed | Caused by | What changed |
|---|---|---|
| §5 Actor × Module Access Matrix note (role model) | OQ-01 | Removed the `TO CONFIRM` marker; stated the confirmed fact that only `Admin`/`ESS` are real, selectable roles. |
| §8.1 "Known behavioural uncertainties" paragraph | OQ-02, OQ-03, OQ-04, OQ-05 | Replaced the four-item uncertainty list with the four resolved facts, each with its verbatim observed message and a pointer to exploration.md. |
| §8.1 Work Shift bullet under "Module-specific business rules" | OQ-02 | Changed "raises the overnight-shift question addressed as an open item below" to the confirmed fact: overnight shifts are rejected outright. |
| §10.1 `US-01-06` "Password policy feedback" Gherkin | FIND-002 | Replaced paraphrased messages with the exact observed wording ("Should have at least 7 characters", not 8; "Your password must contain minimum 1 number"), and **removed** the invented "missing an upper-case letter" scenario entirely, replacing it with a scenario asserting that no such requirement exists. |
| §10.1 `US-02-05` Work Shift overnight scenario | OQ-02 | Converted from an observation scenario to an asserted scenario stating the exact rejection message, the computed `0.00` duration, and the blocked Save. |
| §10.1 `US-05-01` Nationalities deletion scenario | OQ-03 / BUG-001 | Converted from an observation scenario to an asserted scenario describing the product's actual (defective) behaviour, explicitly annotated `KNOWN DEFECT: BUG-001` rather than written as if the desired BR-11-compliant behaviour were the requirement. |
| §10.1 `US-06-01` Corporate Branding "unsupported type" scenario | OQ-04 / BUG-002 | The PRD previously asserted "a file-type validation error is displayed" — a message that does not exist on this build. Corrected to assert the actual (wrong) message "Attachment Size Exceeded" and annotated `KNOWN DEFECT: BUG-002`, since the original assertion would never pass against the real product. |
| §8.1 `EPIC-ADM-07` inventory, new LDAP field inventory; §10.1 new `US-07-08` (added v2.2, 2026-09-26) | FIND-005 | M2 found an 8th Configuration screen this document never listed, so its two test cases (`TC_ADM_CFG_018`/`019`) traced to a finding id instead of a story. Added the screen to the inventory and specified it as Tier 1 story `US-07-08`, with field inventory and two scenarios written only from exploration.md §2.7. Unrecorded details are marked *not recorded*. |
| §13 Open Questions table | OQ-01–OQ-05 | Added a `Status` column; all five Admin/current-cycle questions marked `RESOLVED (M2)` with a one-line answer. OQ-06–OQ-14 marked `Open — future cycle` (unchanged in substance, now explicit). |

Corrected-requirement count: **8**: the 7 original M2 corrections plus the `US-07-08`
addition from FIND-005 (v2.2). This excludes the Open Questions table entry, which is a
status update rather than a requirement change; including it, **9** rows.

---

## Appendix A — Automation Alignment & Quality Metrics

**Scope restatement.** Per Section 6.3, this document's Product Scope (all twelve
modules) is broader than the Current QA Cycle Scope (Admin only). Milestone M3 generates
`TC_ADM_xx_nnn` cases **for Admin only**. Every non-Admin story in Section 10 carries
`TC: pending future cycle` rather than a fabricated id — automating one now, ahead of its
own module's cycle, is a plan violation, not extra coverage.

**Quality gates → business guarantee mapping:**

| Gate | What it guarantees the business |
|---|---|
| G1 (traceability) | Every Admin requirement in this PRD has a corresponding, findable automated check |
| G2 (no unverified assertions) | No Admin test encodes a guessed expected result as fact |
| G3 (shared-environment safety) | The automated suite cannot corrupt or destabilize the shared public demo for other users |
| G4 (CI reliability) | The suite's pass/fail signal can be trusted, run over run |
| G5 (defect/flake separation) | A red build always points at either a real product defect or a real regression, never noise |

**Traceability matrix (skeleton — full matrix maintained in
`deliverables/04-reporting/traceability-matrix.md` once M3/M5 run):**

| BO | Module | Epic | Story | TC (M3) | Automation Id (M5) |
|---|---|---|---|---|---|
| BO-01 | Admin | EPIC-ADM-00 | US-00-01 | pending M3 | pending M5 |
| BO-01 | Admin | EPIC-ADM-01 | US-01-01…06 | pending M3 | pending M5 |
| BO-02 | Admin | EPIC-ADM-02 | US-02-01…05 | pending M3 | pending M5 |
| BO-02 | Admin | EPIC-ADM-03 | US-03-01…03 | pending M3 | pending M5 |
| BO-02 | Admin | EPIC-ADM-04 | US-04-01…05 | pending M3 | pending M5 |
| BO-02 | Admin | EPIC-ADM-05 | US-05-01 | pending M3 | pending M5 |
| BO-09 | Admin | EPIC-ADM-06 | US-06-01…03 | pending M3 | pending M5 |
| BO-09 | Admin | EPIC-ADM-07 | US-07-01…07 | pending M3 | pending M5 |
| BO-03 | PIM | EPIC-PIM-01…06 | US-PIM-* | pending future cycle | pending future cycle |
| BO-04 | Leave | EPIC-LEV-01…05 | US-LEV-* | pending future cycle | pending future cycle |
| BO-05 | Time | EPIC-TIM-01…04 | US-TIM-* | pending future cycle | pending future cycle |
| BO-06 | Recruitment | EPIC-REC-01…02 | US-REC-* | pending future cycle | pending future cycle |
| BO-03 | My Info | EPIC-MYI-01 | US-MYI-* | pending future cycle | pending future cycle |
| BO-07 | Performance | EPIC-PRF-01…03 | US-PRF-* | pending future cycle | pending future cycle |
| BO-11 | Dashboard | EPIC-DSH-01 | US-DSH-* | pending future cycle | pending future cycle |
| BO-11 | Directory | EPIC-DIR-01 | US-DIR-* | pending future cycle | pending future cycle |
| BO-11 | Maintenance | EPIC-MNT-01 | US-MNT-* | pending future cycle | pending future cycle |
| BO-08 | Claim | EPIC-CLM-01…02 | US-CLM-* | pending future cycle | pending future cycle |
| BO-10 | Buzz | EPIC-BUZ-01 | US-BUZ-* | pending future cycle | pending future cycle |
| BO-01 | Cross-Cutting | EPIC-COR-01…02 | US-COR-* | pending future cycle | pending future cycle |

**Quality metrics, as business outcomes:**

- **Requirement coverage** — proportion of `US-nn-yy` (Admin) with a passing, traceable
  test case.
- **Critical-path coverage** — proportion of the hire-to-productive-employee journey
  (§7.3) with automated protection, tracked across cycles as new modules join.
- **Defect density per module** — confirmed `BUG-nnn` entries per module, surfaced from
  M4 reporting.
- **Regression protection ratio** — proportion of stories with automated (not just
  specified) coverage, tracked per module per cycle.

**Future-cycle roadmap:**

| Sequence | Module | Rationale |
|---|---|---|
| 1 | Admin (current) | Dependency root for every other module |
| 2 | PIM | Second dependency layer; almost every other module needs a real employee record |
| 3 | Leave | High compliance risk (BO-04), moderate complexity |
| 4 | Time | Shares the approval-routing pattern Leave establishes |
| 5 | Recruitment | Self-contained until the Hire handoff into PIM |
| 6 | Remainder (My Info, Performance, Dashboard, Directory, Maintenance, Claim, Buzz, Cross-Cutting) | Lower interdependency; sequence by business priority at the time |

The framework is module-agnostic by constitutional requirement (`.specify/memory/
constitution.md`, Article IV) — each new cycle needs only a new `spec.md` under
`.specify/specs/`, new page objects under `pages/`, and new tests under `tests/`, not a
change to the framework itself.

**Governing implementation documents (deliberately not restated here):** Page Object
Model standards, locator strategy, wait strategy, selector-healing process, and the
UI-only technical prohibitions remain governed by `.specify/memory/constitution.md` and
`.specify/specs/001-admin-ui/plan.md`.

---

## Appendix B — Glossary

- **ESS** — Employee Self-Service; the role/persona under which an employee views and
  maintains their own record.
- **System user vs. employee record** — a System User (Admin) is a login account; an
  Employee record (PIM) is the underlying person data. One employee may have zero or one
  linked system user.
- **Pay Grade** — a compensation band, further broken into per-currency minimum/maximum
  salary ranges.
- **Employment Status** — an employee's current working classification (e.g., active,
  probation), defined in Admin and applied in PIM.
- **Organisational Unit / Sub Unit** — a node in the company's structural hierarchy,
  defined in Admin → Organization → Structure.
- **Leave Period** — the annual (or otherwise defined) cycle against which leave
  entitlements are calculated.
- **Leave Entitlement vs. Balance** — Entitlement is the total leave granted for a period;
  Balance is what remains after approved/taken leave is deducted.
- **Work Week** — the configured set of working days used to calculate leave and
  attendance.
- **Timesheet Period** — the recurring interval (typically weekly) a timesheet covers.
- **Project Activity** — a specific task within a Project, the level at which time is
  actually logged.
- **Vacancy** — an open position tracked in Recruitment, distinct from the Job Title
  reference data defined in Admin.
- **Candidate Pipeline** — the ordered set of stages a candidate moves through from
  application to hire or rejection.
- **KPI** — Key Performance Indicator; a scoring criterion bound to a Job Title, used in
  Performance reviews.
- **Tracker** — a running log of performance-related entries for an employee, distinct
  from a formal review.
- **Claim Event / Expense Type** — the configured categories a Claim's line items must
  reference.
- **Reference data** — configuration-owned data (job titles, locations, leave types,
  etc.) that other modules consume but do not themselves define.
- **Blast radius** — the extent to which a single change is visible to, or affects, users
  beyond the person making it; used here to flag screens unsafe to mutate on a shared
  instance.
- **Toast notification** — the transient on-screen message confirming or reporting the
  failure of a save/update/delete action.
