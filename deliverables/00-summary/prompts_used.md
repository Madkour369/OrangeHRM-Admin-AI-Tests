# Prompts Used — OrangeHRM Admin QA Automation Pipeline

## Structure of this project

- **`CLAUDE.md`** (repo root) is the standing system prompt: it governs every session in
  this workspace and is re-injected as context on every turn. It is not one of the prompts
  below — it is the constant background the prompts below all operate under.
- **`.specify/`** holds the governing documents the prompts below produced and referenced:
  `memory/constitution.md` (the highest-authority rules) and `specs/001-admin-ui/`
  (`spec.md`, `plan.md`, `tasks.md`).
- **`.claude/commands/`** holds the reusable commands (`/analyze`, `/coverage`,
  `/code-review`, `/heal`, `/new-module`) that several of the prompts below invoke by name
  rather than restate.
- **This file** is the third layer: the actual per-milestone, per-gate, corrective and
  resume prompts a human sent, in the order they were sent, that drove the pipeline above
  to produce everything in `deliverables/`.

## Sourcing note

Every prompt below was recovered directly from this project's session transcripts
(`~/.claude/projects/.../*.jsonl`, 6 files spanning 2026-09-19 through 2026-09-25), not
from memory or from the compacted conversation summaries handed between sessions — those
summaries paraphrase, and paraphrase was explicitly ruled out for this document. 45
candidate human-authored turns were found; **2 were excluded**: Claude Code's own
auto-generated "this session is being continued from a previous conversation" compaction
summaries, which are system-generated context injections, not something the user typed,
and including them here would misrepresent an artifact of the session-continuity mechanism
as a prompt someone sent. The remaining **43** are reproduced below.

Where a message was an IDE notification (`<ide_opened_file>`, `<ide_selection>`) wrapping
a real instruction, the notification tag itself is stripped as non-instructional metadata;
every word of the actual human-authored text inside and after it is reproduced unchanged.
One prompt (**#28**) is only partially recoverable — the transcript entry itself cuts off
mid-sentence — and is marked `[partial]` with a note on what is known to be missing, per
the instruction not to invent what wasn't recoverable.

## Improved prompts and the reusable library (added 2026-09-26)

Each prompt below is followed by an **improved prompt** and **what the improvement fixes**. The improved versions were written afterwards, with hindsight: each one names a specific correction, retry or gap that actually followed the original, with the prompt number, finding, bug, healing entry or commit that records it. Where nothing traceable went wrong after a prompt, the "fixes" line says so rather than inventing a weakness. The original prompts are unchanged.

Some improved versions of very long prompts (the pasted spec draft in #2, CLAUDE.md in #16, the command files in #21, and the M1, M2, M3, M4 and M5 briefs) keep the unchanged parts by reference to the original prompt directly above them, and spell out only what changes. The **Reusable prompt library** at the end has the complete, standalone, module-parameterised versions.

---


## Pre-M1 — Project Origin

### #1 — 2026-09-19T21:40:06Z — Gate —

**Purpose:** Project origin prompt — before the SpecKit pipeline existed

```
Create Page Object Model and Playwright E2E tests for OrangeHRM Admin Module (https://opensource-demo.orangehrmlive.com/). Include tests for admin login, searching users, and creating a new user using TypeScript.
```

**Produced:** An initial ad-hoc Playwright POM suite (later deleted at the G2 reconciliation, since it predated the pipeline and lived at the repo root, not under src/).

**Improved prompt:**

```
I want a UI-only QA cycle for the OrangeHRM Admin module (https://opensource-demo.orangehrmlive.com/), ending in a Playwright + TypeScript Page Object Model suite.

Do not write any test code yet. Tests come last, after the product has been specified, explored manually and executed manually, so that no assertion is written from assumption.

First, set up the spec-driven pipeline: I will give you the governing CLAUDE.md in the next message. Until then, create nothing under tests/, pages/ or utils/, and tell me if any such folders already exist.
```

**What the improvement fixes:** Asked for test code before any spec, exploration or pipeline existed; the ad-hoc suite it produced at the repo root predated the pipeline and had to be reported and deleted at Gate G2 (#19, #20, #22).

---

## M1 — PRD

### #2 — 2026-09-19T22:13:10Z — Gate G1

**Purpose:** Kickoff of the SpecKit workspace and Milestone 1

````
# Specification — OrangeHRM Web UI (Feature 001: Admin Module)

Produced under Constitution v1.0 · Scope: **UI only** · Target:
`https://opensource-demo.orangehrmlive.com/`

---

## 1. Product Vision

OrangeHRM is a web-based HRMS. Administrators configure the organisation's reference data,
identity, and branding; employees and managers consume it. This specification defines the
**testable UI behaviour** of the product, with an executable deep-dive on the Admin module.

## 2. Personas

| Persona | Needs from the UI |
|---|---|
| **System Administrator** (primary) | Create/maintain users, jobs, org structure, qualifications, branding; expects validated forms, clear errors, reliable search. |
| ESS User | Read-only exposure to configuration through their own screens. |
| Hiring / HR Manager | Consumes Admin reference data in PIM, Leave, Recruitment. |
| QA Engineer | Deterministic, addressable UI with stable semantics. |

## 3. Scope

**In scope** — everything reachable and operable through the rendered web interface:
navigation, forms, validation, search/filter, pagination, tables, modals, toasts, session
behaviour, responsive layout, keyboard/accessibility basics.

**Out of scope (explicit)** — REST/API testing, backend/database verification, performance and
load testing, security penetration testing, email delivery verification, mobile-native apps,
integrations to third-party identity providers beyond the UI form behaviour.

## 4. UI Module Inventory (full product breadth)

| # | Module | UI surface | Priority for this cycle |
|---|---|---|---|
| 1 | **Admin** | User Management, Job, Organization, Qualifications, Nationalities, Corporate Branding, Configuration | **P0 — deep dive** |
| 2 | PIM | Employee list, Add Employee, config tabs, reports | P1 — inventory only |
| 3 | Leave | Apply, My Leave, Entitlements, Reports, Configure, Leave List, Assign | P1 |
| 4 | Time | Timesheets, Attendance, Reports, Project Info | P1 |
| 5 | Recruitment | Candidates, Vacancies, candidate workflow | P1 |
| 6 | My Info | Personal/Contact/Emergency/Dependents/Immigration/Job/Salary/Report-to/Qualifications/Memberships tabs | P1 |
| 7 | Performance | KPIs, Trackers, My Trackers, Employee Trackers, Reviews | P2 |
| 8 | Dashboard | Widgets: Time at Work, My Actions, Quick Launch, Buzz feed, Employees on Leave | P2 |
| 9 | Directory | Search by employee/job title/location, card grid | P2 |
| 10 | Maintenance | Access/Purge Employee Records (password-gated) | P2 |
| 11 | Claim | Submit/My Claims/Employee Claims, expenses, configuration | P2 |
| 12 | Buzz | Post, share, like, comment, photo/video posts | P2 |

Cross-cutting UI surfaces: Login/Forgot-password, top bar user dropdown, sidebar
search & collapse, breadcrumb, global toast layer, session timeout, 404/route guard.

---

## 5. ADMIN MODULE — DEEP DIVE

### Epic map

| Epic | Title | Sub-module |
|---|---|---|
| EPIC-ADM-01 | System User Management | Admin → User Management → Users |
| EPIC-ADM-02 | Job Configuration | Job Titles, Pay Grades, Employment Status, Job Categories, Work Shifts |
| EPIC-ADM-03 | Organization Management | General Information, Locations, Structure |
| EPIC-ADM-04 | Qualifications Management | Skills, Education, Licenses, Languages, Memberships |
| EPIC-ADM-05 | Nationalities | Admin → Nationalities |
| EPIC-ADM-06 | Corporate Branding | Admin → Corporate Branding |
| EPIC-ADM-07 | Configuration | Email Configuration, Email Subscriptions, Localization, Language Packages, Modules, Social Media Authentication, Register OAuth Client |
| EPIC-ADM-00 | Access, Navigation & Session (cross-cutting) | Login, sidebar, breadcrumbs, session |

---

### EPIC-ADM-00 — Access, Navigation & Session

**US-00-01** As an administrator I want to log in so that I can reach the Admin module.

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
    When I navigate directly to "/web/index.php/admin/viewSystemUsers"
    Then I am redirected to the login page
```

**US-00-02** As an administrator I want the Admin menu to expose its sub-modules.

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

**US-00-03** Session behaviour: logout invalidates the session; back-navigation after logout
must not expose authenticated screens.

---

### EPIC-ADM-01 — System User Management

| Story | Statement |
|---|---|
| US-01-01 | As an admin I want to search system users by username, role, employee name and status. |
| US-01-02 | As an admin I want to add a system user with role, employee, status, username, password. |
| US-01-03 | As an admin I want to edit an existing system user. |
| US-01-04 | As an admin I want to delete users individually and in bulk, with confirmation. |
| US-01-05 | As an admin I want the user list to paginate and report record counts accurately. |
| US-01-06 | As an admin I want password rules enforced with clear, real-time feedback. |

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
    Then a success toast "Successfully Saved" is displayed
    And the user "e2e_user_<unique>" appears in the search results

  Scenario: Username uniqueness is enforced
    Given a system user "e2e_dup_<unique>" exists
    When I attempt to add another user with username "e2e_dup_<unique>"
    Then the field error "Already exists" is shown under Username
    And no success toast is displayed

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

  Scenario: Employee Name must be chosen from the hint list
    When I type "zzzznotarealemployee" into Employee Name
    And I click "Save"
    Then the field error "Invalid" is shown under Employee Name

  Scenario Outline: Password policy feedback
    When I enter Password "<password>"
    Then the validation message "<message>" is displayed
    Examples:
      | password      | message                                        |
      | abc           | Should have at least 8 characters               |
      | alllowercase1 | Your password must contain minimum 1 upper-case letter |
      | Password      | Your password must contain minimum 1 number     |

  Scenario: Confirm Password mismatch
    When I enter Password "Passw0rd!2025" and Confirm Password "Passw0rd!2026"
    And I click "Save"
    Then "Passwords do not match" is displayed

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
    And the results table body contains zero rows

  Scenario: Reset clears all filters
    Given I have applied a Username and a User Role filter
    When I click "Reset"
    Then all filter fields return to their default values
    And the unfiltered result set is restored

  Scenario: Edit a system user's role
    Given a system user "e2e_edit_<unique>" with role "ESS" exists
    When I open it for edit, change User Role to "Admin" and save
    Then a success toast is displayed
    And the list shows "Admin" for that user

  Scenario: Password is optional on edit
    Given I am editing an existing system user
    Then the password fields are hidden until "Change Password" is enabled

  Scenario: Delete a single user with confirmation
    Given a system user "e2e_del_<unique>" exists
    When I click its delete icon
    Then a confirmation dialog appears
    When I confirm with "Yes, Delete"
    Then a success toast "Successfully Deleted" is displayed
    And the user no longer appears in search results

  Scenario: Cancelling the delete dialog preserves the record
    When I open the delete dialog and press "No, Cancel"
    Then the dialog closes and the record still exists

  Scenario: Bulk delete via header checkbox
    Given at least two "e2e_" users exist in the current page
    When I select them with the row checkboxes and click "Delete Selected"
    And I confirm the dialog
    Then all selected users are removed
    And the record count decreases by the number selected

  Scenario: Pagination integrity
    Given the result set spans more than one page
    When I navigate to page 2
    Then a different set of records is displayed
    And no record appears on both pages
```

---

### EPIC-ADM-02 — Job Configuration

Applies to five CRUD screens. Each is specified by the **shared CRUD contract** below plus
its screen-specific fields.

```gherkin
Feature: Reference-data CRUD contract (applies to every Job/Qualifications/Nationalities screen)

  Scenario Outline: Create a record
    Given I am on the "<screen>" screen
    When I click "Add", complete the mandatory fields with unique values and save
    Then a success toast is displayed
    And the record appears in the list

  Scenario Outline: Mandatory validation
    When I save "<screen>" with the mandatory field empty
    Then "Required" is displayed and no record is created

  Scenario Outline: Duplicate name rejection
    When I create a "<screen>" record with a name that already exists
    Then a duplicate/"Already exists" error is displayed

  Scenario Outline: Field length boundary
    When I enter a name of 51 characters on "<screen>"
    Then the input is truncated at its maximum or an explicit length error is displayed

  Scenario Outline: Edit a record
    When I edit an existing "<screen>" record and save
    Then a success toast is displayed and the list reflects the change

  Scenario Outline: Delete with confirmation
    When I delete a "<screen>" record and confirm
    Then a success toast is displayed and the record is gone

  Scenario Outline: Cancel discards changes
    When I fill the "<screen>" form and press "Cancel"
    Then I return to the list and no record is created

    Examples:
      | screen            |
      | Job Titles        |
      | Pay Grades        |
      | Employment Status |
      | Job Categories    |
      | Work Shifts       |
      | Skills            |
      | Education         |
      | Licenses          |
      | Languages         |
      | Memberships       |
      | Nationalities     |
```

**Screen-specific stories**

- **US-02-01 Job Titles** — fields: Job Title*, Job Description, Job Specification (file
  upload, ≤1MB), Note. Covers file attach, replace, delete attachment, unsupported type.
- **US-02-02 Pay Grades** — create grade, then add **currencies** with Minimum/Maximum
  salary; validate min ≤ max, numeric-only, duplicate currency rejection, currency dropdown
  search.
- **US-02-03 Employment Status** — simple name CRUD; verify the new status becomes selectable
  in PIM Job tab (UI cross-module check, read-only navigation).
- **US-02-04 Job Categories** — simple name CRUD.
- **US-02-05 Work Shifts** — fields: Shift Name*, From/To time, assigned Employees
  (multi-autocomplete). Validate time ordering, duplicate employee assignment, removal chips.

```gherkin
  Scenario: Pay grade salary boundary
    Given I am adding a currency to pay grade "e2e_pg_<unique>"
    When I enter Minimum Salary "5000" and Maximum Salary "1000"
    Then a validation error indicating the maximum must exceed the minimum is displayed

  Scenario: Work shift time ordering
    When I create a work shift From "18:00" To "09:00"
    Then the behaviour is recorded: either rejected with a validation error,
      or accepted as an overnight shift — the observed behaviour is documented in exploration.md
```

> Note: the second scenario above is intentionally written as an **observation scenario**. Per
> Constitution Article V, the expected result is finalised only after manual exploration (M2).

---

### EPIC-ADM-03 — Organization Management

**US-03-01 General Information** — view and edit organisation name, registration number, tax
id, phone/fax/email, address block, country dropdown, notes. Edit is gated by a toggle.

```gherkin
  Scenario: Fields are read-only until Edit is toggled
    Given I am on Admin > Organization > General Information
    Then all inputs are disabled
    When I toggle "Edit"
    Then the inputs become editable and "Save" is enabled

  Scenario Outline: Field validation on save
    When I toggle Edit, set "<field>" to "<value>" and save
    Then "<outcome>" is observed
    Examples:
      | field      | value              | outcome                          |
      | Email      | not-an-email       | "Expected format: admin@example.com" |
      | Phone      | abc!!              | invalid-characters error         |
      | Organization Name | (empty)     | "Required"                        |

  Scenario: Changes persist across reload
    When I save a modified Note and reload the page
    Then the saved value is displayed
```

**US-03-02 Locations** — searchable list (City, Country); add/edit/delete location with
Name*, Country*, Province, City, Address, Zip, Phone, Fax, Notes; "Number of Employees"
column is read-only and links to the employee list.

**US-03-03 Structure** — hierarchical unit tree; toggle Edit mode to add child units
(Name*, Unit Id, Description); delete a unit with confirmation; verify child nodes are
removed with the parent; expand/collapse behaviour.

```gherkin
  Scenario: Add a child organisation unit
    Given I am on Admin > Organization > Structure in Edit mode
    When I add a child unit "e2e_unit_<unique>" under the root
    Then a success toast is displayed
    And the node appears beneath the root when the root is expanded

  Scenario: Deleting a parent unit warns about its children
    Given "e2e_unit_<unique>" has at least one child
    When I delete the parent and confirm
    Then the parent and its descendants are no longer present in the tree
```

---

### EPIC-ADM-04 — Qualifications

Screens: Skills (Name*, Description), Education (Level*), Licenses (Name*),
Languages (Name*), Memberships (Name*). All follow the shared CRUD contract, plus:

```gherkin
  Scenario: Skill description accepts long text within its limit
    When I create a skill with a 400-character description
    Then the record saves and the full description is retained on edit

  Scenario: Bulk delete from the qualifications list
    Given at least two "e2e_" skills exist
    When I select them and use "Delete Selected" and confirm
    Then both are removed and the record count updates
```

---

### EPIC-ADM-05 — Nationalities

Shared CRUD contract. Additional:

```gherkin
  Scenario: A nationality in use cannot be silently removed
    Given a nationality is assigned to an employee in PIM
    When I attempt to delete it
    Then the resulting behaviour (blocked with an error, or cascaded) is recorded as a finding
```

---

### EPIC-ADM-06 — Corporate Branding

**US-06-01** Upload client logo / login banner / login page background; reset to default.
**US-06-02** Change primary, secondary and text colours; observe live preview.
**US-06-03** Social media link fields validate URL format.

```gherkin
  Scenario: Upload a logo of an unsupported type
    When I attach a ".txt" file to "Client Logo"
    Then a file-type validation error is displayed and no upload occurs

  Scenario: Oversized image is rejected
    When I attach an image larger than the stated size limit
    Then a size validation error naming the limit is displayed

  Scenario: Reset to default restores the stock branding
    Given branding has been modified
    When I click "Reset to Default" and confirm
    Then the default OrangeHRM branding is restored after reload
```

> Constitution VI.3: branding tests must revert their own changes; on the shared demo,
> colour-picker cases are expected to be marked `needs automation = No`.

---

### EPIC-ADM-07 — Configuration

| Story | Screen | UI behaviour under test |
|---|---|---|
| US-07-01 | Email Configuration | Mail sending method radio (Sendmail/SMTP/Secure SMTP), conditional SMTP fields, port numeric validation, "Send Test Email" toggle. **Observation only — do not send.** |
| US-07-02 | Email Subscriptions | Toggle subscription on/off, add/remove subscribers, email format validation. |
| US-07-03 | Localization | Language dropdown, date format dropdown, persistence after reload, effect on a date-bearing screen. |
| US-07-04 | Language Packages | List rendering, download/empty state. |
| US-07-05 | Modules | Enable/disable module toggles and the resulting sidebar change. **High blast radius — revert immediately; likely `valid in scope = No` on shared demo.** |
| US-07-06 | Social Media Authentication | Add provider form validation (Name*, Provider URL*, client id/secret), URL format. |
| US-07-07 | Register OAuth Client | Client Name*, Redirect URI*, Client ID, confidential toggle; CRUD + duplicate name. |

```gherkin
  Scenario: SMTP fields appear only for the SMTP method
    Given I am on Admin > Configuration > Email Configuration
    When I select mail sending method "SMTP"
    Then SMTP Host, Port, Username, Password and Authentication fields become visible
    When I select "Sendmail"
    Then those fields are hidden

  Scenario: Localization date format persists
    When I change the date format and save
    And I reload the page
    Then the selected format is still displayed
```

---

## 6. Non-Functional UI Requirements

| Id | Requirement | How it is tested (UI only) |
|---|---|---|
| NFR-01 | Every destructive action is confirmed by a modal | Dialog present, cancel is non-destructive |
| NFR-02 | Every save produces an explicit success or error toast | Toast presence + variant class |
| NFR-03 | Validation errors are field-adjacent and human-readable | Error text under the field, no raw codes |
| NFR-04 | Pages render usably at 1920×1080, 1366×768 and 768×1024 | Viewport-parameterised layout checks |
| NFR-05 | No client-side console errors during happy-path navigation | Console listener assertion (observability, not API) |
| NFR-06 | Primary flows are keyboard-reachable; controls have accessible names | `getByRole` resolvability + tab-order spot checks |
| NFR-07 | Session expiry returns the user to login without a broken screen | Observed during long runs |
| NFR-08 | Screens render within a reasonable perceived time (spinner clears < 10s) | `waitForIdle()` timeout budget |

## 7. Assumptions & Risks

- **A1** Demo data resets periodically; no test may depend on pre-existing records.
- **A2** The demo is shared and mutated concurrently by other users.
- **R1** Known product defects exist; distinguishing them from flakiness is M2's job.
- **R2** Rate limiting under parallel execution → workers capped at 2.
- **R3** Some Configuration screens have global blast radius → default to observe-only.

## 8. Traceability Seed

`EPIC-ADM-0x` → `US-0x-yy` → `TC_ADM_xx_nnn` → `Automation_ID` → `BUG-nnn`.
Ids assigned here are authoritative and must be reused verbatim downstream.
"Please act as the Principal QA Architect. Read the Master System Prompt rules we discussed. Create all the required SpecKit workspace files (.specify/memory/constitution.md, .specify/specs/001-admin-ui/spec.md, plan.md, tasks.md, and .claude/commands/) directly on disk yourself. Do not ask me to create any files manually. Once you generate the workspace setup, execute Milestone 1 (deliverables/01-prd/prd.md)."
````

**Produced:** Instruction to create .specify/memory/constitution.md, spec.md, plan.md, tasks.md, .claude/commands/, and begin prd.md.

**Notes:** Most of the message body is a pasted draft of spec.md's own content (evidently drafted earlier in the same working session as reference material); the new instruction is the final paragraph.

**Improved prompt:**

```
Act as the Principal QA Architect for the OrangeHRM Admin UI cycle.

Step 1 — create CLAUDE.md at the workspace root with the content I paste below, verbatim. It is the governing system prompt; everything else must follow it.
Step 2 — create the SpecKit workspace strictly to CLAUDE.md's model: five milestones (PRD, exploration, test design, manual execution, automation) with gates G1–G5, and the src/ layout in its section 4. Files: .specify/memory/constitution.md, .specify/specs/001-admin-ui/spec.md (from the draft pasted below), plan.md, tasks.md, and only the four custom commands in .claude/commands/ (analyze, coverage, code-review, heal).
Do not generate stock SpecKit templates or commands. If a tool creates any, list them and stop; do not keep them alongside ours.
Step 3 — list every file you created, with its purpose, and confirm there is exactly one milestone model in the workspace.
Then start Milestone 1 (deliverables/01-prd/prd.md), and stop at Gate G1.

[CLAUDE.md content]
[spec.md draft — the text pasted in the original prompt, unchanged]
```

**What the improvement fixes:** Asked for "all the required SpecKit workspace files" without naming the governing model or supplying CLAUDE.md, so stock 4-milestone scaffolding and commands appeared next to the project's own; CLAUDE.md turned out to be missing (#15) and the two pipelines had to be reconciled at Gate G2 (#20, #21).

---
### #3 — 2026-09-19T22:47:55Z — Gate G1

**Purpose:** PRD scope refinement — expand from Admin-only to all 12 modules

````
تمام — غيّرت الـ scope بحيث الـ PRD يغطي التطبيق كله (١٢ موديول + الشاشات المشتركة زي اللوجين والسيشن)، مع إبقاء الـ Admin كأعمق فصل لأنه هو الموديول اللي دورة الاختبار الحالية (M2–M5) شغالة عليه.

نقطة مهمة ضفتها في البرومبت: فيه فرق دلوقتي بين **Product Scope** (الموقع كله — ده الـ PRD) و**Current QA Cycle Scope** (الأدمن بس — ده الـ test_design.csv والتنفيذ). لو مفصلناش ده بوضوح، الإيجنت هيروح يولّد تيست كيسيز لـ ١٢ موديول في M3 ويكسر الـ gates بتاعتك. البرومبت بيجبره يكتب الفرق ده صراحةً.

---

# MASTER PROMPT — Transform `deliverables/01-prd/prd.md` into a Full-Product Functional PRD (All Modules)

## ROLE

You are acting as a **Lead Product Analyst** working alongside a **Senior QA Automation Architect**. Your deliverable is a **business-facing Functional Product Requirements Document for the entire OrangeHRM web application**, not a test strategy.

Product Owners, Business Analysts, and HR stakeholders must be able to read it end to end and understand *what the product does and why* — without needing to know that Playwright exists. All technical automation rules remain in force for the project, but inside this document they are **subordinate context**, confined to the appendix.

## OBJECTIVE

Rewrite `deliverables/01-prd/prd.md` **in place**, converting it from a technical, Admin-only test-strategy artifact into a formal **Functional PRD covering the complete OrangeHRM UI** as observable on the public live demo at `https://opensource-demo.orangehrmlive.com/`.

Write the complete file to `deliverables/01-prd/prd.md`. Do not print the document to the terminal instead of writing it. Do not create a parallel file.

## THE SCOPE CHANGE — READ THIS FIRST

The previous revision of this PRD was scoped to the **Admin module only**. That was too narrow. The product scope is now the **entire application**.

However, the *QA execution cycle* (Milestones 2–5, `test_design.csv`, `agent_execution_report.html`, the Playwright suite) remains scoped to **Admin only**. These are now two different scopes, and the document must make that distinction explicit and unmissable, in its own section:

| Scope type | Covers | Governs |
|---|---|---|
| **Product Scope** | All 12 modules + cross-cutting surfaces | This PRD |
| **Current QA Cycle Scope** | Admin module only | M2–M5 artifacts, gates G2–G5 |

Non-Admin modules are **specified but not yet tested**. Every non-Admin chapter must carry a visible marker: `QA CYCLE: not in current cycle — specification only`. This prevents Milestone 3 from generating twelve modules' worth of test cases and blowing the existing gate definitions.

## PRE-WORK (mandatory, before writing a single line)

1. Read the current `deliverables/01-prd/prd.md` in full.
2. Read `.specify/memory/constitution.md` and `.specify/specs/001-admin-ui/spec.md`.
3. Produce a **preservation list**: every existing `EPIC-ADM-*`, `US-nn-yy`, `NFR-nn`, and `BO-nn` id. These are **immutable** — never renumber, rename, or delete. Downstream artifacts already reference them and must continue to resolve.
4. Note which existing sections are technical-execution material to be **relocated to the appendix**, not deleted.
5. State how you will extend the id scheme for the eleven newly-specified modules without colliding with existing ids (see the ID SCHEME section below).

Only after this inventory, begin writing.

## ID SCHEME (extension rules)

- **Admin keeps its legacy ids unchanged**: `EPIC-ADM-00` … `EPIC-ADM-07`, and stories in the existing `US-nn-yy` form. Do not touch them.
- **New modules use a module-prefixed scheme** so collision is impossible:
  - Epics: `EPIC-<MOD>-nn`
  - Stories: `US-<MOD>-nn-yy`
- Module codes: `ADM` Admin · `PIM` PIM · `LEV` Leave · `TIM` Time · `REC` Recruitment · `MYI` My Info · `PRF` Performance · `DSH` Dashboard · `DIR` Directory · `MNT` Maintenance · `CLM` Claim · `BUZ` Buzz · `COR` cross-cutting (login, navigation, session).
- Add a short **ID conventions** note in Document Control explaining that Admin uses the legacy unprefixed story form for backward compatibility, and everything else is prefixed.
- Business rules `BR-nn`, business objectives `BO-nn`, and NFRs `NFR-nn` remain global and continue the existing numbering.

## SCOPE CONSTRAINTS (strict, non-negotiable)

**In scope**
- The **entire OrangeHRM web application**, exercised **exclusively through the rendered user interface**.
- Observable functional behaviour: navigation, forms, field validation, inline error messages, search and filter, pagination, tables, modal dialogs, toast notifications, file upload, workflow state transitions, session behaviour, layout, and basic accessibility.

**Out of scope — state explicitly in the document as a rule, not a footnote**
- API / REST / HTTP-level testing or specification of any kind.
- Backend logic, database schema, or data-layer verification.
- Third-party integrations beyond the behaviour of their **configuration forms** inside the UI (no verification of actual email delivery, no OAuth round-trip against a live provider, no social-login handshake).
- Performance/load testing, penetration testing, mobile-native applications.

If a requirement cannot be verified by a person looking at the screen, it does not belong in this PRD.

## REQUIRED DOCUMENT STRUCTURE

### 1. Document Control
Table: title, version (increment; mark as a scope-expansion rewrite), status, owner role, last updated, source system and URL, governing constitution version, ID conventions note, and a one-line change summary versus the prior revision.

### 2. Table of Contents

### 3. Executive Summary
Four to six paragraphs of business prose. What OrangeHRM *is* as an HRIS: a single system of record spanning identity and configuration, employee master data, absence, time and attendance, hiring, performance, expense claims, and internal communication. Explain the platform's central dependency — Admin holds the reference data that every other module consumes, so configuration errors propagate silently downstream. Written for a stakeholder who has never opened the application.

### 4. Business Objectives & Success Criteria
Table: `BO-nn | Business Objective | Business Value | Observable Success Indicator | Primary Modules`. Cover at minimum: controlled system access and role separation; accurate organisational and job reference data; complete and maintainable employee master data; compliant absence management; accurate time capture and project costing; an efficient hiring funnel; structured performance management; controlled expense claiming; and coherent corporate identity. Success indicators phrased in business terms, never as test pass rates.

### 5. System Actors & Personas
Full persona treatment for each, with responsibilities, frequency of use, expertise level, friction tolerance, and the business cost of failure:
- **System Administrator** — configuration and identity control plane.
- **HR Manager / HR Admin** — employee master data, absence policy, reporting.
- **Line Manager / Supervisor** — approvals (leave, timesheets, claims), team visibility, performance reviews.
- **ESS Employee** — self-service: own data, leave requests, timesheets, claims, Buzz.
- **Recruiter / Hiring Manager** — vacancies and candidate pipeline.
- **Auditor** — read-only consumer of records and reports.

Include an **actor × module access matrix** showing which personas reach which modules, and note where the demo's role model actually constrains visibility.

### 6. Scope Statement
Two tables (in scope / out of scope) exactly as defined above, plus the **Product Scope vs Current QA Cycle Scope** table from the SCOPE CHANGE section, plus a boundary-rationale paragraph explaining why the UI-only line was drawn.

### 7. Product Map & Cross-Module Data Flow

This section is the reason a whole-product PRD is worth more than twelve separate ones. Produce:

- A **module inventory table**: `Module | Epic prefix | Primary actor | Business purpose (one line) | Depth tier | QA cycle status`.
- A **reference-data dependency map** in prose plus a table, tracing how configuration flows: Admin job titles, employment statuses, pay grades, locations and organisational units feed PIM employee records → PIM employee records feed Leave entitlements, Time timesheets, Performance reviews, Claim submissions and Directory → Leave types and holidays configured in Leave govern what an employee can request → Recruitment's hire action creates a PIM record. Name each dependency and state the business consequence of it being wrong.
- An **end-to-end business journey** walked across modules: *hire to productive employee* — vacancy created in Recruitment → candidate progresses through the pipeline → hired → employee record created in PIM → system user provisioned in Admin → employee completes My Info → leave entitlement assigned → first timesheet submitted and approved. Reference the epics each step touches.

### 8. Functional Breakdown — All Modules

The core of the document. Use an **identical internal template** for every module chapter so the document reads consistently:

> **8.x `<Module name>`**
> Epic ids · QA cycle status marker · Navigation path · **Business purpose** (a paragraph, not a sentence) · Primary and secondary actors · **Sub-module / screen inventory** · **Field inventory table** (`Field | Type | Mandatory | Constraint / allowed values | Business meaning`) for the principal forms · **Operations supported** (create, read, search, update, delete, bulk, upload, approve/reject, state transition) · **Module-specific business rules** (referencing the global `BR-nn` contract rather than repeating it) · **Upstream dependencies / downstream consumers** · **Known behavioural uncertainties** (see HONESTY RULE).

**Depth tiers** — apply deliberately and declare the tier in each chapter header:

- **Tier 1 — Exhaustive (Admin only).** Every one of the seven sub-modules fully specified at field level, with complete business rules and full Gherkin coverage including negative and boundary cases. This is the module the current QA cycle executes against, so its specification must be assertion-grade.
- **Tier 2 — Full functional (PIM, Leave, Time, Recruitment, My Info, Claim).** Complete screen and sub-module inventory, field tables for the principal forms, all operations and workflow states, module business rules, and user stories with Gherkin for the primary happy paths plus the most business-critical edge cases. Not exhaustive at every field.
- **Tier 3 — Functional overview (Performance, Dashboard, Directory, Maintenance, Buzz, cross-cutting).** Purpose, screen inventory, operations, key business rules, and user stories with Gherkin for the primary flows.

Chapters to produce, with the surfaces each must cover:

1. **Admin** *(Tier 1)* — System User Management (roles, status, employee-name autocomplete as a binding constraint, username uniqueness, password policy and its user-facing messages, password handling at create vs edit); Job Configuration (Job Titles with specification attachment, Pay Grades with per-currency min/max bands and the min ≤ max rule, Employment Status, Job Categories, Work Shifts); Organization (General Information and its read-only-by-default edit toggle, Locations with employee counts, Structure hierarchy and parent-delete cascade); Qualifications (Skills, Education, Licenses, Languages, Memberships); Nationalities; Corporate Branding (logos, banner, background, theme colours with live preview, reset to default); Configuration (Email Configuration with conditional SMTP field set, Email Subscriptions, Localization with system-wide date format effect, Language Packages, Modules toggles, Social Media Authentication, Register OAuth Client). For every Configuration screen state the **blast radius** in business terms.
2. **PIM** *(Tier 2)* — Configuration (Optional Fields, Custom Fields, Data Import, Reporting Methods, Termination Reasons); Employee List with its filters; Add Employee including login-creation option; the employee record tab set (Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships); employee termination and reactivation; PIM Reports definition and generation.
3. **Leave** *(Tier 2)* — Apply; My Leave; Entitlements (Add Entitlements, Employee Entitlements, My Entitlements); Reports (Leave Entitlements and Usage); Configure (Leave Period, Leave Types, Work Week, Holidays); Leave List; Assign Leave. Specify the **leave request state machine** (Pending Approval → Scheduled → Taken / Rejected / Cancelled) and who may perform each transition, plus the balance-sufficiency rule and overlap prevention.
4. **Time** *(Tier 2)* — Timesheets (My Timesheets, Employee Timesheets) and the timesheet **state machine** (Not Submitted → Submitted → Approved / Rejected); Attendance (My Records, Punch In/Out, Employee Records, Configuration and whether employees may edit their own attendance); Reports (Project, Employee, Attendance Summary); Project Info (Customers, Projects and activities). Cover the punch-in/punch-out pairing rule.
5. **Recruitment** *(Tier 2)* — Vacancies (with hiring manager assignment); Candidates with search and filters; resume upload; the **candidate pipeline state machine** (Application Initiated → Shortlisted → Interview Scheduled → Interview Passed/Failed → Job Offered → Offer Declined / Hired) and the actions available at each state; the hire action's effect on PIM.
6. **My Info** *(Tier 2)* — the ESS view of the employee record and its full tab set; what the employee may edit versus view; attachment handling; the self-service boundary as a business rule.
7. **Performance** *(Tier 3)* — Configure (KPIs bound to job titles, Trackers); Manage Reviews (Manage Reviews, My Reviews, Employee Reviews) and the review lifecycle; My Trackers and Employee Trackers with tracker log entries.
8. **Dashboard** *(Tier 3)* — the widget set (Time at Work, My Actions, Quick Launch, Buzz Latest Posts, Employees on Leave Today, Employee Distribution by Sub Unit and by Location), what each surfaces, its data source module, and widget configuration.
9. **Directory** *(Tier 3)* — employee search by name, job title and location; the result card grid; the empty state.
10. **Maintenance** *(Tier 3)* — the password re-authentication gate; Access Employee Records; Purge Employee Records and its irreversibility. Flag the whole module as destructive-by-design and therefore observe-only on a shared demo instance.
11. **Claim** *(Tier 3)* — Submit Claim, My Claims, Employee Claims; expense line items against configured Events and Expense Types; the **claim state machine** (Initiated → Submitted → Approved / Rejected / Paid) and attachment handling; Configuration (Events, Expense Types).
12. **Buzz** *(Tier 3)* — Newsfeed with sort options; create text, photo and video posts; like, comment, share, edit and delete own post; My Photos, My Videos, Most Liked Posts; content ownership and moderation rules.
13. **Cross-Cutting Surfaces** *(Tier 3, `COR`)* — Login and forgot-password flow; unauthenticated deep-link redirect; top bar user dropdown (About, Support, Change Password, Logout); sidebar search and collapse; breadcrumbs; the global toast layer; session timeout and post-logout back-navigation; 404 and route guarding; localization effects on date and language rendering.

### 9. Business Rules & Data Integrity — The Global CRUD Contract

Define **once**, as a normative table with ids (`BR-nn`), the behaviour every data-maintenance screen across the product must satisfy; module chapters then reference these ids instead of repeating them. Each rule gets: id, rule statement, business rationale, user-visible evidence, and the modules it governs.

Cover: mandatory-field enforcement with no partial record creation · field-adjacent inline validation in plain language · duplicate prevention on business keys · length, numeric, email, URL, time and date format boundaries · conjunctive search and filter semantics with a working reset · explicit empty-state messaging · pagination integrity (declared count matches reality, no record on two pages, no record lost, count updates after create and delete) · a success or failure notification for every save, update and delete, with silence treated as a defect · confirmation dialogs on all destructive actions, with cancel non-destructive · cancel-discards-input semantics · referential integrity when deleting a reference value that is in use · file upload type and size validation · **workflow state-transition integrity** (only permitted transitions are offered, and only to actors entitled to perform them) · **approval authority** (no actor approves their own submission) · **data visibility boundaries** (an ESS user sees only their own records).

### 10. User Stories & Acceptance Criteria

- Preserve every existing `US-nn-yy` id and meaning. Add new stories under the prefixed scheme.
- Full form for each: `**US-<MOD>-nn-yy** — As a <persona>, I want <capability>, so that <business outcome>.` followed by priority, module, QA cycle status, dependent business rules, and acceptance criteria.
- Acceptance criteria in **Gherkin** (`Feature` / `Background` / `Scenario` / `Scenario Outline` with `Examples`), fenced as ```gherkin.
- **Gherkin must be written in domain language.** "The supervisor approves the timesheet", "a confirmation message is displayed" — never CSS selectors, never `oxd-` class names, never Playwright API calls, never element ids. If a criterion cannot be expressed without naming a selector, it is an implementation detail and belongs in the appendix.
- Coverage by tier: Tier 1 — happy path, mandatory-empty, duplicate, boundary, invalid format, cancel, delete-confirm and delete-cancel, empty search, pagination. Tier 2 — happy path, the critical negative case, and every workflow state transition. Tier 3 — happy path and the primary negative case.
- Group stories under their epics, and epics under their module chapter, so the document reads `Module → Epic → Stories → Criteria`.

### 11. Non-Functional & UX Requirements (UI level)

Continue existing `NFR-nn` numbering. Table: `Id | Requirement | Business rationale | Observable acceptance condition | Applies to`. Cover:

- **Form accessibility** — visible labels and accessible names on every control; mandatory fields visually marked; errors programmatically associated with their field; primary flows keyboard-completable; focus order follows visual order; colour never the sole carrier of meaning.
- **Perceived responsiveness** — navigation completes and clears its loading indicator within a stated budget; long operations show progress rather than appearing frozen; large lists remain usable.
- **Viewport responsiveness** — usable, non-overlapping, non-horizontally-scrolling layout at **1920×1080**, **1366×768**, and **768×1024**, with per-viewport expectations for the sidebar, data tables, modal dialogs, and the Buzz feed.
- **Session handling** — expiry returns cleanly to login rather than a half-rendered page; unauthenticated deep links redirect; post-logout back-navigation does not expose authenticated content; unsaved-work loss is communicated rather than silent.
- **Error and empty-state quality** — actionable messages, free of internal error codes or stack traces.
- **Consistency** — terminology, button placement, table behaviour, and confirmation patterns uniform across all modules; deviations are defects.
- **Localization integrity** — the configured language and date format render consistently wherever dates appear.

### 12. Assumptions, Constraints, Dependencies & Risks
Separate tables. Must include: the shared public demo environment and its periodic data reset; concurrent mutation by other anonymous users; pre-existing product defects in the demo build; screens whose blast radius makes them observe-only on a shared instance (Admin Configuration Modules, Maintenance Purge); and the fact that some role-gated behaviour cannot be fully observed from a single Admin account on the demo. Risks carry impact, likelihood, and mitigation.

### 13. Open Questions
Numbered register of behaviours requiring confirmation through manual exploration before they can be stated as requirements. Each with the question, the module, why it matters, and how it will be resolved.

### Appendix A — Automation Alignment & Quality Metrics

The **only** place technical execution material may live. Keep it compact and clearly subordinate.

- Restate the **Product Scope vs Current QA Cycle Scope** distinction and its consequence: Milestone 3 generates `TC_ADM_xx_nnn` cases for Admin only; non-Admin stories carry `TC: pending future cycle`.
- Map quality gates **G1–G5** to the business milestones they protect, phrased as what each gate guarantees the business.
- **Traceability matrix**: `BO-nn → Module → EPIC-<MOD>-nn → US-<MOD>-nn-yy → TC_ADM_xx_nnn (M3) → Automation_ID (M5)`. Where downstream ids do not yet exist, write `pending M3`, `pending M5`, or `pending future cycle` — never invent an id.
- Quality metrics as business outcomes: requirement coverage, critical-path coverage, defect density per module, and the proportion of stories with automated regression protection.
- A **future-cycle roadmap** table proposing module sequencing for subsequent QA cycles, with a rationale for the order (suggested: Admin → PIM → Leave → Time → Recruitment → remainder), noting that the framework is module-agnostic by constitutional requirement so each new cycle needs only a new spec, new page objects, and new tests.
- A pointer note stating that all implementation-level rules — Page Object Model standards, locator strategy, wait strategy, healing process, and the UI-only technical prohibitions — remain governed by `.specify/memory/constitution.md` and `.specify/specs/001-admin-ui/plan.md` and are deliberately not restated here.

### Appendix B — Glossary
Business and product terms across the whole platform: ESS, system user vs employee record, pay grade, employment status, organisational unit / sub unit, leave period, leave entitlement vs balance, work week, timesheet period, project activity, vacancy, candidate pipeline, KPI, tracker, claim event, expense type, reference data, blast radius, toast notification.

## WRITING STANDARDS

- **Clean Markdown.** ATX headings with strict hierarchical nesting, consistent numbering, tables for every structured set, fenced `gherkin` blocks for acceptance criteria, blockquotes reserved for normative callouts. No raw HTML.
- **Visual hierarchy.** Every module chapter opens with prose before its first table. A reader must be able to navigate by heading alone.
- **Business register.** Write for a Product Owner. Explain *why* before *what*. Technical vocabulary only where it is genuinely the business's vocabulary.
- **Consistency across chapters is mandatory** — with thirteen chapters, a drifting template makes the document unusable. Same section order, same table columns, same heading depth everywhere.
- **Length.** Substance over brevity; this is a specification, not a summary. But every paragraph must carry information — no filler, no restating the heading. Manage total length through the depth tiers, not by thinning Tier 1.

## HONESTY RULE (non-negotiable)

Do not invent application behaviour. Where you cannot confirm how the live demo actually behaves — exact validation message wording, precise field length limits, the date format in use, referential-integrity behaviour on delete, file type and size limits, which workflow transitions a given role is actually offered, whether a module is enabled on the demo build — you must **not** guess a value and present it as a requirement.

Write the requirement at the level you can defend, and mark the unknown explicitly:

> **TO CONFIRM (Exploration):** exact maximum length of the Job Title field; record the observed limit here once verified.

Add every marker to the Open Questions register in §13. Be especially disciplined in Tier 2 and Tier 3 chapters, where the temptation to fill gaps from general HRIS knowledge is strongest — you are specifying *this build of this demo*, not HRIS software in general. An invented constant is worse than an acknowledged gap, because it will be silently encoded into test assertions two milestones later.

Preserve any "observation scenario" already present in the source documents — acceptance criteria whose expected result is pending manual verification. Keep them flagged; do not resolve them by assumption.

## COMPLETION CHECKLIST

Verify and report each line before declaring done:

- [ ] `deliverables/01-prd/prd.md` written in place; no duplicate or parallel file created.
- [ ] Every pre-existing `EPIC-ADM-*`, `US-nn-yy`, `NFR-nn`, `BO-nn` id still present and unchanged in meaning.
- [ ] All 12 modules plus the cross-cutting chapter present, each following the identical template.
- [ ] Depth tier declared in every chapter header; Admin is Tier 1 and demonstrably the deepest.
- [ ] Product Scope vs Current QA Cycle Scope stated in §6 and restated in Appendix A; every non-Admin chapter carries the `not in current cycle` marker.
- [ ] Cross-module data flow map and the end-to-end hire journey present in §7.
- [ ] All four workflow state machines specified (Leave request, Timesheet, Candidate pipeline, Claim).
- [ ] Zero API, REST, HTTP, database, or backend requirements anywhere in the body.
- [ ] Zero CSS selectors, `oxd-` class names, or Playwright references outside Appendix A.
- [ ] Every business rule has an id, rationale, user-visible evidence, and the modules it governs.
- [ ] Every user story has Gherkin criteria at the coverage depth its tier requires.
- [ ] All three viewports named explicitly in §11.
- [ ] Traceability appendix present; unassigned downstream ids marked `pending`, never fabricated.
- [ ] Every unverified constant carries a `TO CONFIRM` marker and appears in Open Questions.
- [ ] Markdown renders cleanly; tables well-formed; table of contents matches the headings.

Report: the checklist results, counts of modules / epics / stories / business rules produced, the number of `TO CONFIRM` markers raised, and a short diff summary versus the previous revision.

---
````

**Produced:** Revised PRD scope: full 12-module product breadth with Admin as the deep-dive tier.

**Notes:** Written in Arabic (Egyptian dialect), as sent.

**Improved prompt:**

```
Before any PRD text is written, settle the scope decisions, because changing them afterwards means rewriting the document:

1. Product scope: all 12 OrangeHRM modules plus cross-cutting surfaces (login, navigation, session).
2. QA cycle scope: Admin only. Every non-Admin chapter carries "QA CYCLE: not in current cycle — specification only".
3. Depth: exactly two tiers. Admin is Tier 1 (exhaustive, assertion-grade). Every other module is Tier 3 (functional overview). No intermediate tier.
4. API scope: deferred by explicit decision, stated in the PRD.

Reply with these four decisions restated in one line each and any you think are wrong. The full PRD brief follows once they are confirmed (see #4).
```

**What the improvement fixes:** Introduced a three-tier depth model that the very next prompt reversed (#4 collapsed Tier 2 into Tier 3, later recorded as PRD v2.1), so the PRD was specified twice; like #4, its honesty rule left it to the writer to judge what counted as unverified.

---
### #4 — 2026-09-19T23:06:02Z — Gate G1

**Purpose:** Milestone-by-milestone kickoff: the actual M1 PRD-writing brief

````
تمام، فاهم. هنمشي **ميلستون ميلستون** — أديك برومبت، تشغّله، تقوللي خلص، أديك اللي بعده.

قبل ما نبدأ، تلات حاجات لازم تعرفها دلوقتي مش بعدين:

**التاسك طالبة UI و API.** انت قررت UI بس. ده يخصم من التقييم لأن الميلستونز مكتوبة `UI Module/s and API endpoint/s`. لو ناوي تسيبها UI، لازم الـ PRD نفسه يكتب سطر صريح إن الـ API scope مؤجّل بقرار واعي — أحسن من إن المصحّح يفتكرها نسيان. لو غيّرت رأيك، قوللي وأضيف API track موازي.

**التاسك بتقول IntelliJ في ميلستون ٥،** مش VS Code. الكود نفسه واحد (Playwright TS)، بس لازم تفتح البروجكت في IntelliJ وتاخد سكرين شوتس من هناك للتسليم.

**فيه ديليفرابلز مش موجودة في الـ pack:** الـ Excel summary (`a`) والـ flowchart HTML (`b`). دول هنعملهم في ميلستون سادس بعد M5 — أنا حاططهم في دماغي.

---

## الإعداد (مرة واحدة، قبل M1)

في روت الريبو:

```
cp MASTER_SYSTEM_PROMPT.md CLAUDE.md
```

اتأكد إن `.specify/` و `.claude/commands/` مكانهم. بعد كده افتح session جديدة والزق البرومبت اللي تحت.

**قرار أخدته عنك** عشان مانعطّلش: الموديولات غير الأدمن هتبقى **Tier 3** (توصيف وظيفي مختصر)، والأدمن **Tier 1** (عمق كامل). ده متسق مع إن التنفيذ أدمن بس، وبيخلّي الـ PRD في حجم معقول. لو عايزهم أعمق قوللي قبل ما تشغّل.

---

## 🟢 MILESTONE 1 — PRD Generation

الزق ده في Claude Code:

```
# MILESTONE 1 — Generate the Product Requirements Document

## Context
You are operating the SpecKit pipeline defined in CLAUDE.md, under the rules of
.specify/memory/constitution.md. This is Milestone 1 (Gate G1).

Assignment input:  project URL — https://opensource-demo.orangehrmlive.com/
Assignment output: a PRD markdown file.

## Pre-work (do this before writing anything)
1. Read .specify/memory/constitution.md in full.
2. Read .specify/specs/001-admin-ui/spec.md and .specify/specs/001-admin-ui/tasks.md (Milestone 1 + its DoD).
3. Restate in one line: the scope restriction, and the Gate G1 exit condition.
4. List every existing EPIC-ADM-*, US-*, NFR-*, BO-* id found in spec.md.
   These ids are IMMUTABLE — reuse them verbatim, never renumber or rename.

## Role
Act as a Lead Product Analyst. The output is a business-facing Functional PRD that a
Product Owner or HR stakeholder can read end to end. It is NOT a test strategy document.

## THE TWO SCOPES — state both explicitly in the document

| Scope type              | Covers                                    | Governs              |
|-------------------------|-------------------------------------------|----------------------|
| Product Scope           | The entire OrangeHRM web application      | This PRD             |
| Current QA Cycle Scope  | Admin module only                         | Milestones 2–5       |

Every non-Admin chapter must carry the marker:
`QA CYCLE: not in current cycle — specification only`

This prevents Milestone 3 from generating test cases for twelve modules.

## Scope constraints (strict)
IN:  The whole application, exercised exclusively through the rendered web UI.
OUT: API/REST specification or testing; backend/database logic; performance, load and
     security testing; native mobile apps; verification of third-party integrations
     beyond the behaviour of their configuration forms inside the UI.

Record in the Assumptions section, as a deliberate decision and not an omission:
"API endpoint coverage is deferred to a future cycle; this cycle is UI-only by design."

If a requirement cannot be verified by a person looking at the screen, it does not belong here.

## Depth tiers — declare the tier in every chapter header
- Tier 1 — Admin (exhaustive): all 7 sub-modules at field level, complete business rules,
  full Gherkin including negative and boundary cases. This is the module the QA cycle
  executes against, so its specification must be assertion-grade.
- Tier 3 — all other modules (functional overview): purpose, screen inventory, operations,
  key business rules, workflow state machines where they exist, and Gherkin for primary
  flows plus one critical negative case.

## ID scheme
- Admin keeps its legacy ids unchanged: EPIC-ADM-00…07, US-nn-yy.
- New modules use a prefixed scheme to guarantee no collision:
  Epics `EPIC-<MOD>-nn`, Stories `US-<MOD>-nn-yy`.
  Codes: PIM LEV TIM REC MYI PRF DSH DIR MNT CLM BUZ, and COR for cross-cutting surfaces.
- Business rules BR-nn, objectives BO-nn and NFR-nn remain global and continue existing numbering.

## Required structure
1.  Document Control (version, owner, source URL, constitution version, ID conventions)
2.  Table of Contents
3.  Executive Summary — what OrangeHRM is as an HRIS; why Admin reference data is the
    platform's central dependency and how configuration errors propagate downstream
4.  Business Objectives & Success Criteria — BO-nn | Objective | Business value |
    Observable success indicator | Primary modules
5.  System Actors & Personas — System Administrator (full treatment), HR Manager,
    Line Manager/Supervisor, ESS Employee, Recruiter, Auditor; plus an actor × module
    access matrix
6.  Scope Statement — in/out tables, the two-scopes table above, and a boundary rationale
7.  Product Map & Cross-Module Data Flow
      - module inventory table: Module | Epic prefix | Primary actor | Purpose | Tier | QA cycle status
      - reference-data dependency map: how Admin job titles, employment statuses, pay grades,
        locations and org units feed PIM; how PIM records feed Leave, Time, Performance,
        Claim and Directory; how a Recruitment hire creates a PIM record. State the business
        consequence of each dependency being wrong.
      - one end-to-end journey walked across modules: vacancy → candidate pipeline → hire →
        PIM record → system user provisioned in Admin → My Info completed → leave entitlement
        → first timesheet approved
8.  Functional Breakdown — every chapter uses the IDENTICAL template:
      Epic ids · Tier · QA cycle status · Navigation path · Business purpose (a paragraph) ·
      Actors · Screen inventory · Field inventory table (Field | Type | Mandatory |
      Constraint | Business meaning) · Operations supported · Module-specific business rules
      (referencing BR-nn, not repeating them) · Upstream dependencies / downstream consumers ·
      Known behavioural uncertainties

    8.1  Admin — TIER 1, the deepest chapter in the document:
         System User Management (Admin/ESS roles and what each grant means operationally;
         enabled vs disabled status; the employee-name autocomplete as a binding business
         constraint — a system user must be bound to a real employee record, which is why
         free text is rejected; username uniqueness; the password policy as business rules
         with each user-facing message; password handling at create vs edit)
         Job Configuration (Job Titles incl. specification attachment; Pay Grades with
         per-currency min/max bands and the min ≤ max rule; Employment Status; Job Categories;
         Work Shifts with times and employee assignment)
         Organization (General Information and its read-only-by-default edit toggle and why
         that protects data; Locations with employee counts; Structure hierarchy, parent/child
         semantics and the cascade consequence of deleting a parent)
         Qualifications (Skills, Education, Licenses, Languages, Memberships as the controlled
         vocabularies that make competency data searchable)
         Nationalities (and the integrity question of removing a value already in use)
         Corporate Branding (logos, banner, background, theme colours with live preview,
         reset to default — framed as brand consistency, not cosmetics)
         Configuration (Email Configuration and its conditional SMTP field set; Email
         Subscriptions; Localization and the system-wide date format effect; Language
         Packages; Modules toggles; Social Media Authentication; Register OAuth Client).
         For every Configuration screen, state the BLAST RADIUS in business terms:
         who is affected when an administrator changes it.
    8.2  PIM          — TIER 3
    8.3  Leave        — TIER 3, include the leave request state machine
    8.4  Time         — TIER 3, include the timesheet state machine
    8.5  Recruitment  — TIER 3, include the candidate pipeline state machine
    8.6  My Info      — TIER 3, include the self-service edit boundary
    8.7  Performance  — TIER 3
    8.8  Dashboard    — TIER 3
    8.9  Directory    — TIER 3
    8.10 Maintenance  — TIER 3, flag as destructive-by-design, observe-only on a shared demo
    8.11 Claim        — TIER 3, include the claim state machine
    8.12 Buzz         — TIER 3
    8.13 Cross-Cutting Surfaces (COR) — TIER 3: login and forgot-password; unauthenticated
         deep-link redirect; top bar dropdown; sidebar search and collapse; breadcrumbs;
         the global toast layer; session timeout and post-logout back-navigation; 404 and
         route guarding
9.  Business Rules & Data Integrity — the global CRUD contract, defined ONCE as a normative
    BR-nn table (id | rule | business rationale | user-visible evidence | modules governed).
    Cover: mandatory-field enforcement with no partial record creation; field-adjacent inline
    validation in plain language; duplicate prevention on business keys; length/numeric/email/
    URL/date-time boundaries; conjunctive search and filter semantics with a working reset;
    explicit empty-state messaging; pagination integrity (declared count matches reality, no
    record on two pages, none lost, count updates after create and delete); a success or
    failure notification for every save, update and delete — silence is a defect; confirmation
    dialogs on all destructive actions with cancel non-destructive; cancel-discards-input;
    referential integrity when deleting a value already in use; file upload type and size
    validation; workflow state-transition integrity; approval authority (no actor approves
    their own submission); data visibility boundaries (an ESS user sees only their own records)
10. User Stories & Acceptance Criteria — grouped Module → Epic → Stories → Criteria.
    Full form: **US-<MOD>-nn-yy** — As a <persona>, I want <capability>, so that <outcome>.
    Then priority, module, QA cycle status, dependent BR-nn ids, and Gherkin criteria in
    ```gherkin fences.
    GHERKIN MUST BE DOMAIN LANGUAGE. "the administrator saves the user", "a confirmation
    message is displayed" — never CSS selectors, never oxd- class names, never Playwright
    calls, never element ids. If a criterion cannot be expressed without naming a selector,
    it is an implementation detail and belongs in the appendix.
    Coverage: Tier 1 — happy path, mandatory-empty, duplicate, boundary, invalid format,
    cancel, delete-confirm and delete-cancel, empty search, pagination.
    Tier 3 — happy path, primary negative case, and each workflow state transition.
11. Non-Functional & UX Requirements (NFR-nn) — form accessibility (visible labels and
    accessible names, mandatory markers, errors associated with their field, keyboard-
    completable primary flows, colour never the sole carrier of meaning); perceived
    responsiveness with a stated budget; viewport responsiveness at 1920×1080, 1366×768
    and 768×1024 with per-viewport expectations for sidebar, tables and modals; session
    handling (clean redirect on expiry, deep-link guarding, post-logout back-navigation);
    error and empty-state quality free of internal codes; cross-module consistency of
    terminology, button placement and confirmation patterns
12. Assumptions, Constraints, Dependencies & Risks — separate tables. Must include: the
    shared public demo and its periodic data reset; concurrent mutation by other anonymous
    users; pre-existing product defects in the demo build; screens with global blast radius
    that are observe-only on a shared instance (Admin Configuration → Modules, Maintenance →
    Purge); the single-Admin-account limitation on observing role-gated behaviour; and the
    deliberate API-deferral decision. Risks carry impact, likelihood and mitigation.
13. Open Questions — numbered register of behaviours needing confirmation in Milestone 2
14. Appendix A — Automation Alignment: restate the two-scopes distinction; map gates G1–G5
    to what each guarantees the business; traceability matrix
    BO-nn → Module → EPIC → US → TC_ADM_xx_nnn (pending M3) → Automation_ID (pending M5),
    with non-Admin stories marked `pending future cycle`; quality metrics as business
    outcomes; a future-cycle module roadmap; and a pointer note stating that POM standards,
    locator strategy, wait strategy and healing process remain governed by
    .specify/memory/constitution.md and plan.md and are deliberately not restated here
15. Appendix B — Glossary of business terms across the platform

## HONESTY RULE (non-negotiable)
Do not invent application behaviour. Where you cannot confirm how the live demo actually
behaves — exact validation message wording, precise field length limits, the date format in
use, referential-integrity behaviour on delete, file type and size limits, which workflow
transitions a role is actually offered, whether a module is enabled on this build — do NOT
guess a value and present it as a requirement.

Write the requirement at the level you can defend, and mark the unknown explicitly:

> **TO CONFIRM (M2 — Exploration):** exact maximum length of the Job Title field.

Add every marker to the Open Questions register in §13. Be especially disciplined in Tier 3
chapters, where the temptation to fill gaps from general HRIS knowledge is strongest — you
are specifying THIS build of THIS demo, not HRIS software in general. An invented constant
is worse than an acknowledged gap, because it will be silently encoded into a test assertion
two milestones later.

## Output
Write the complete document to `deliverables/01-prd/prd.md`.
Create the directory if it does not exist. Write the file — do not print it to the terminal
instead. Clean Markdown: ATX headings, strict hierarchy, tables for every structured set,
```gherkin fences for criteria, no raw HTML. Consistency across the thirteen chapters is
mandatory — same section order, same table columns, same heading depth everywhere.

## Definition of Done — verify and report each line
- [ ] deliverables/01-prd/prd.md written in place; no duplicate file created
- [ ] Every pre-existing EPIC-ADM-*, US-*, NFR-*, BO-* id preserved verbatim
- [ ] All 12 modules + the cross-cutting chapter present, identical template each
- [ ] Tier declared in every chapter header; Admin is visibly the deepest
- [ ] Two-scopes table in §6 and Appendix A; every non-Admin chapter carries the QA CYCLE marker
- [ ] Cross-module dependency map and the end-to-end hire journey present in §7
- [ ] All four state machines specified (Leave, Timesheet, Candidate, Claim)
- [ ] Zero API, REST, HTTP, database or backend requirements in the body
- [ ] Zero CSS selectors, oxd- class names or Playwright references outside Appendix A
- [ ] Every BR-nn has id, rationale, user-visible evidence and modules governed
- [ ] Every story has Gherkin at the depth its tier requires
- [ ] All three viewports named explicitly in §11
- [ ] Traceability appendix present; unassigned ids marked `pending`, never fabricated
- [ ] Every unverified constant carries a TO CONFIRM marker and appears in Open Questions
- [ ] Markdown renders cleanly; TOC matches headings

Report: the checklist results, counts of modules / epics / stories / business rules produced,
and the number of TO CONFIRM markers raised.

Then STOP at Gate G1 and wait for my sign-off. Do not begin Milestone 2.
```

---
````

**Produced:** deliverables/01-prd/prd.md v1 (personas, scope, Epics/Stories/Gherkin, NFRs, assumptions/risks, traceability seed).

**Notes:** Written in Arabic (Egyptian dialect) with the technical brief in English, as sent.

**Improved prompt:**

```
# MILESTONE 1 — Product Requirements Document

Context, pre-work, role, the two scopes, scope constraints, depth tiers, id scheme and the 15-section structure: as in the original M1 brief, unchanged. The changes below are binding and override anything in it.

## Always unverified until observed
The following can never be stated as fact in this document, however standard they look. Each gets a TO CONFIRM (M2 — Exploration) marker and an Open Questions row:
- every user-facing message, toast, empty state and error string, quoted or paraphrased
- every numeric rule: lengths, minimums, maximums, counts, formats, date formats
- every validation rule, including password policy (length, character classes)
- which fields are mandatory
- delete behaviour on referenced data, and file type/size limits
Describe the capability ("the system enforces a password policy and explains violations") and mark the specifics. A familiar rule is not a verified rule.

## Screen inventory comes from the product, not from this prompt
The screen lists in this brief are a starting point. Open the live navigation menu for each Admin sub-module and list what is actually there. Any screen not in this brief gets a story; any screen in this brief that is not in the menu is flagged.

## One story per screen
Every Admin screen in the inventory has at least one US-nn-yy story with Tier 1 Gherkin. Report the screen → story mapping.

## Definition of Done additions
- [ ] Zero message strings, limits or validation rules stated without a TO CONFIRM marker
- [ ] Screen inventory checked against the live menu; every screen has a story
- [ ] TO CONFIRM count equals the Open Questions count

Stop at Gate G1.
```

**What the improvement fixes:** Asked for "the password policy … with each user-facing message" while forbidding invention, and left the TO CONFIRM rule to the writer's judgement, so the PRD asserted an upper-case rule and an 8-character minimum that build 5.9 does not have (FIND-002, corrected in #18); it also hand-listed 7 Configuration screens (LDAP was missing, FIND-005) and did not require one story per screen (Qualifications and Nationalities had none, #6).

---
### #5 — 2026-09-19T23:12:49Z — Gate G1

**Purpose:** Verification commands for the Admin-vs-total story count

````
cd deliverables/01-prd

# كام ستوري للأدمن مقابل الباقي
grep -o 'US-[A-Z]*-\?[0-9-]*' prd.md | sort -u | wc -l
grep -c 'US-0[0-9]-' prd.md              # الأدمن (الـ legacy ids)
grep -o 'US-\(PIM\|LEV\|TIM\|REC\|MYI\|PRF\|DSH\|DIR\|MNT\|CLM\|BUZ\|COR\)' prd.md | sort | uniq -c

# الـ ids القديمة اتحافظ عليها؟
grep -c 'EPIC-ADM-0' prd.md

# عمق الجيركين: في negative/boundary ولا happy path بس؟
grep -c '```gherkin' prd.md
grep -ci 'Scenario Outline' prd.md

# الـ TO CONFIRM موزّعة إزاي
grep -n 'TO CONFIRM' prd.md

# حجم الملف
wc -w prd.md
````

**Produced:** Story-count verification against prd.md.

**Notes:** Shell commands with Arabic inline comments, as sent.

**Improved prompt:**

```
Run these checks on deliverables/01-prd/prd.md and report the raw output:

1. Story counts: all, Admin (US-0n-nn), and per module prefix.
2. Every Admin screen in §8.1's inventory, with the story id(s) that cover it. List screens with none.
3. Gherkin blocks and Scenario Outlines, per Admin epic.
4. Every quoted string inside a Gherkin step (text between double quotes). For each, show whether a TO CONFIRM marker covers it. List the unmarked ones.
5. TO CONFIRM marker count vs Open Questions row count; list any mismatch.
6. prd.md vs spec.md id parity for US-, EPIC-ADM- and BR- ids (diff; report the exit code).
```

**What the improvement fixes:** Counted stories and markers but did not check that every Admin screen had a story or that every quoted message was either observed or marked; the missing Qualifications/Nationalities stories needed a separate corrective (#6), and the unmarked password messages passed Gate G1.

---
### #6 — 2026-09-19T23:21:23Z — Gate G1

**Purpose:** Corrective: mint the missing Qualifications/Nationalities story ids before G1 sign-off

```
Resolve item 1 before G1 sign-off. Mint the missing story ids in BOTH
.specify/specs/001-admin-ui/spec.md and deliverables/01-prd/prd.md, keeping them identical.

This is an ADDITION, not a renumbering — do not touch any existing id.

EPIC-ADM-04 (Qualifications) — five sub-modules, five stories:
  US-04-01 Skills · US-04-02 Education · US-04-03 Licenses
  US-04-04 Languages · US-04-05 Memberships
EPIC-ADM-05 (Nationalities):
  US-05-01 Nationalities CRUD

Each story gets the full form (As a / I want / So that), priority, dependent BR-nn ids,
and inline Tier 1 Gherkin. Do not duplicate the shared CRUD contract prose — reference
the BR-nn ids and write the screen-specific scenarios only:
  - US-04-01 Skills: the long-description retention case on edit
  - US-04-02 Education: the Level field as the business key
  - US-04-05 Memberships: bulk delete from the list with count update
  - US-05-01 Nationalities: deleting a nationality already assigned to an employee —
    write this as an OBSERVATION scenario with a TO CONFIRM (M2) marker; do not assert
    whether it is blocked or cascaded
Each screen still needs its field inventory table if one is missing.

Then update the §10.1 US-02 Examples table so it references these ids rather than
carrying Qualifications and Nationalities anonymously, and refresh the Appendix A
traceability matrix.

Re-run the G1 checklist. Report the new story count, gherkin block count, TO CONFIRM
count, and confirm spec.md and prd.md ids match. Stop at G1.
```

**Produced:** US-04-01..05 and US-05-01 added to spec.md and prd.md identically.

**Improved prompt:**

```
Before G1 sign-off, close the story gaps. This is an addition, not a renumbering; no existing id changes.

1. Mint the stories you listed for EPIC-ADM-04 (US-04-01 to US-04-05) and EPIC-ADM-05 (US-05-01) in both spec.md and prd.md, identically, with full story form, priority, BR-nn references and Tier 1 Gherkin. The Nationalities in-use delete scenario is an OBSERVATION scenario with a TO CONFIRM (M2) marker.
2. Then sweep every other Admin epic the same way: compare each epic's screens with the live navigation menu and list any screen with no story. Propose ids for them; do not mint them without my approval.
3. Re-run the G1 checks from #5 and report.

Stop at G1.
```

**What the improvement fixes:** Fixed only the two named epics; a sweep of every epic against the live menus would also have surfaced LDAP Configuration, which stayed without a story until US-07-08 was added on 2026-09-26.

---
### #7 — 2026-09-19T23:26:43Z — Gate G1

**Purpose:** Id-parity verification command

```
diff <(grep -o 'US-0[0-9]-[0-9][0-9]' deliverables/01-prd/prd.md | sort -u) \
     <(grep -o 'US-0[0-9]-[0-9][0-9]' .specify/specs/001-admin-ui/spec.md | sort -u)
```

**Produced:** diff confirming spec.md/prd.md story-id parity.

**Improved prompt:**

```
diff <(grep -oE 'US-0[0-9]-[0-9]{2}|EPIC-ADM-[0-9]{2}' deliverables/01-prd/prd.md | sort -u) \
     <(grep -oE 'US-0[0-9]-[0-9]{2}|EPIC-ADM-[0-9]{2}' .specify/specs/001-admin-ui/spec.md | sort -u)
echo "exit code: $?"
```

**What the improvement fixes:** No downstream problem traced to this command. Small gap: it compares Admin story ids only; the improved version also compares epic ids, which every later parity check needed (e.g. commit 23c3cd9).

---
### #8 — 2026-09-19T23:28:05Z — Gate G1

**Purpose:** Sign-off

```
Gate G1 approved. prd.md is signed off.
```

**Produced:** Gate G1 approved.

**Improved prompt:**

```
Gate G1 approved: deliverables/01-prd/prd.md is signed off as it stands (50 stories, 33 Admin; id parity with spec.md verified). The remaining TO CONFIRM markers are expected and are Milestone 2's input. Do not start Milestone 2 until I confirm the browser tooling works.
```

**What the improvement fixes:** No downstream problem traced to this sign-off. The improved version records what was approved and what stays open, so the approval can be audited later.

---

## Pre-M2 — Tooling Setup

### #9 — 2026-09-19T23:28:22Z — Gate —

**Purpose:** Require a real, working browser tool before M2 begins — no exploration from memory

```
Before Milestone 2: confirm you have a working browser tool in this session that can
actually load https://opensource-demo.orangehrmlive.com/ and log in with Admin/admin123.

Navigate there now, log in, and tell me the exact build/version string from the page
footer and the exact text of the page heading after login.

If you cannot drive a real browser, say so plainly and stop — do not proceed to
Milestone 2, because an exploration written from memory is worthless and everything
downstream would be built on it.
```

**Produced:** A hard precondition on M2: confirm live browser access or stop.

**Improved prompt:**

```
Before Milestone 2 you need a real browser. Set it up in one pass:

1. Register the Playwright MCP server in the project's .mcp.json using bundled Chromium:
   {"mcpServers":{"playwright":{"command":"npx","args":["-y","@playwright/mcp@latest","--browser","chromium"]}}}
2. Run: npx playwright install chromium
3. Tell me to restart the session, and nothing else.

After the restart I will ask you to prove the browser works. If at any point you cannot drive a real browser, say so and stop: exploration written from memory is worthless.
```

**What the improvement fixes:** Asked only whether a browser tool worked, not for the setup it needs; the next five prompts (#10–#14) went on registering the MCP server, creating .mcp.json, installing Chromium and restarting the session twice.

---
### #10 — 2026-09-19T23:29:28Z — Gate —

**Purpose:** Register the Playwright MCP server

```
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

**Produced:** MCP server registration command.

**Improved prompt:**

```
claude mcp add playwright -- npx -y @playwright/mcp@latest --browser chromium
npx playwright install chromium
```

**What the improvement fixes:** Registered the server without the bundled-Chromium flag, so the browser failed to launch and #13 had to add "--browser chromium" and install Chromium.

---
### #11 — 2026-09-19T23:32:28Z — Gate —

**Purpose:** Create .mcp.json for the Playwright MCP server

```
Create a file named `.mcp.json` in the repo root with exactly this content:

{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}

Then tell me to restart the session.
```

**Produced:** .mcp.json created.

**Improved prompt:**

```
Create .mcp.json in the repo root with exactly this content, then run "npx playwright install chromium" and tell me to restart the session:

{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--browser", "chromium"]
    }
  }
}
```

**What the improvement fixes:** Duplicated #10's registration in a second form, still without the bundled-Chromium flag (added in #13).

---
### #12 — 2026-09-19T23:34:16Z — Gate —

**Purpose:** Verify the MCP server loaded and do a first live browser check

```
Re-read CLAUDE.md and .specify/memory/constitution.md.

Context: Gate G1 is approved — deliverables/01-prd/prd.md is signed off (50 stories,
33 Admin / 17 non-Admin, 8/8 Admin epics traced, id parity with spec.md verified).
We are about to start Milestone 2.

First, verify the Playwright MCP server actually loaded. List the browser tools you
now have available.

If it loaded: navigate to https://opensource-demo.orangehrmlive.com/, log in with
Admin/admin123, and report exactly what you see —
1. the build/version string in the page footer
2. the exact text of the main heading after login
3. the exact placeholder text of the Username field on the login page

Report only what you actually observe. Then stop and wait.
```

**Produced:** First live check of the demo's build string and login heading.

**Notes:** Session had to be restarted for the MCP tool to load; see #13/#14.

**Improved prompt:**

```
Re-read CLAUDE.md and .specify/memory/constitution.md. Gate G1 is approved; Milestone 2 is next.

1. List the browser tools you have. If the Playwright tools are missing, or the browser fails to launch, report the exact error and stop — do not attempt workarounds.
2. If it works: open https://opensource-demo.orangehrmlive.com/, log in through the form as Admin/admin123, and report exactly what you see: the footer build/version string, the main heading after login, and the Username field's placeholder on the login page.

Report only what you observe. Then stop.
```

**What the improvement fixes:** Assumed the browser would launch; it did not until Chromium was installed (#13), so the same check had to be re-sent in a new session (#14).

---
### #13 — 2026-09-19T23:35:16Z — Gate —

**Purpose:** Fix: install bundled Chromium so the MCP browser tool actually launches

```
Yes — install the browser, then retry.

Run: npx playwright install chromium

Then update .mcp.json to use bundled Chromium instead of the system Chrome channel:

{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--browser", "chromium"]
    }
  }
}

Tell me when the install finishes so I can restart the session again.
```

**Produced:** npx playwright install chromium; .mcp.json updated to force the chromium channel.

**Improved prompt:**

```
Install the browser and switch to bundled Chromium in one step:

npx playwright install chromium

Then set .mcp.json's args to ["-y", "@playwright/mcp@latest", "--browser", "chromium"], and tell me when both are done so I can restart the session.
```

**What the improvement fixes:** No downstream problem traced to this fix; the improved version is folded into the one-pass setup (#9, #10) so the install happens once.

---
### #14 — 2026-09-19T23:35:59Z — Gate —

**Purpose:** Retry of #12 after the Chromium install, in a new session

```
Re-read CLAUDE.md and .specify/memory/constitution.md.

Context: Gate G1 approved, prd.md signed off. About to start Milestone 2.

Navigate to https://opensource-demo.orangehrmlive.com/, log in with Admin/admin123,
and report exactly what you observe —
1. the build/version string in the page footer
2. the exact text of the main heading after login
3. the exact placeholder text of the Username field on the login page

Report only what you actually see. Then stop and wait.
```

**Produced:** Same first-live-check request, re-sent after the session restart.

**Notes:** Near-duplicate of #12 — sent again because the tooling fix in #13 required a fresh session.

**Improved prompt:**

```
Re-read CLAUDE.md and .specify/memory/constitution.md. Gate G1 is approved; Milestone 2 is next.

Open https://opensource-demo.orangehrmlive.com/, log in through the form as Admin/admin123, and report exactly what you observe: the footer build/version string, the main heading after login, and the Username field's placeholder. If the browser does not launch, report the error and stop. Then wait.
```

**What the improvement fixes:** A near-duplicate of #12, needed only because setup was split across several prompts; no change beyond the #12 improvements.

---
### #15 — 2026-09-19T23:41:02Z — Gate —

**Purpose:** Recreate the missing CLAUDE.md from the source pack

```
CLAUDE.md is missing from the workspace root. Create it by copying the master system
prompt file from this pack — look for MASTER_SYSTEM_PROMPT.md (check the repo root and
any folder where the SpecKit pack was unpacked).

If you find it: copy it verbatim to CLAUDE.md in the workspace root.
If you cannot find it anywhere: tell me and I will paste the content.

Then read CLAUDE.md and confirm you can see section 5, the OrangeHRM UI survival guide.
Report the titles of the sections you find in it.
```

**Produced:** Request to locate and copy MASTER_SYSTEM_PROMPT.md verbatim to CLAUDE.md.

**Improved prompt:**

```
CLAUDE.md is missing from the workspace root. Create it now with the exact content I paste below (not from a file on disk). Then read it back and list its section titles and the subsection titles of section 5, so I can confirm nothing was lost.

[CLAUDE.md content]
```

**What the improvement fixes:** Searched for a file that was not in the workspace, costing a round-trip before the content was pasted in #16; CLAUDE.md should have been created first, at #2.

---
### #16 — 2026-09-19T23:43:33Z — Gate —

**Purpose:** Create CLAUDE.md at the workspace root with its exact, full content

````
Create `CLAUDE.md` at the WORKSPACE ROOT (next to .specify/ and .claude/ — NOT inside
deliverables/) with exactly this content:

# MASTER SYSTEM PROMPT — OrangeHRM UI SpecKit Pipeline (SDD)

## 1. ROLE

You are a **Principal QA Automation Architect** operating a **Spec-Driven Development (SDD)**
pipeline. You do not "write tests on request". You execute a gated, auditable pipeline whose
outputs are artifacts a client would accept as a deliverable.

You behave like a senior engineer in a regulated environment:
- You never claim a step is done without the artifact on disk.
- You never assert a defect you did not observe in the UI.
- You never skip a gate because the next step looks more interesting.

## 2. MISSION

Execute a full QA cycle against **OrangeHRM Demo**, UI only.

| Key | Value |
|---|---|
| Target | `https://opensource-demo.orangehrmlive.com/` |
| Credentials | `Admin` / `admin123` |
| Scope | **100% UI. Zero API testing.** No `request.` fixtures, no direct HTTP assertions, no DB access. |
| Module under test | **Admin** (all sub-modules) |
| Stack | Playwright + TypeScript, Page Object Model |
| Output language | English, professional, client-deliverable |

**The API prohibition is absolute.** Playwright's `page.route()` may be used *only* for
observability (logging a failing XHR into a healing note). It may never be used to stub,
mock, seed, or shortcut a UI flow. Login happens through the login form; `storageState`
reuse is permitted **only after** at least one real UI login has been recorded in the run.

## 3. NON-NEGOTIABLE PIPELINE ORDER

```
M1 prd.md
   └─> M2 exploration.md        (manual UI exploration — NO automation yet)
          └─> M3 test_design.csv (valid in scope / needs automation)
                 └─> M4 agent_execution_report.html (manual execution + bugs)
                        └─> M5 Playwright POM + healing_process.md
```

**Gate rule:** you may not begin milestone *N+1* until milestone *N*'s artifact exists on
disk, is non-empty, and passes its Definition of Done in `.specify/specs/001-admin-ui/tasks.md`.
If the user asks you to jump ahead, state the gate you would be skipping, then either
(a) backfill the missing artifact, or (b) proceed only on explicit override and record
`GATE-OVERRIDE` at the top of the produced artifact.

**Manual-first rule:** Milestone 2 and Milestone 4 are *human-style exploration and execution*.
You drive the real UI and record what you observe. You do not write a single `*.spec.ts`
before M4 is signed off. The demo site is known to be buggy and flaky; the whole point of
M2/M4 is to separate **product defects** from **automation instability** *before* those
defects get baked into assertions.

## 4. REPOSITORY CONTRACT

```
.
├── CLAUDE.md                          # this prompt
├── .specify/
│   ├── memory/constitution.md         # governing law — read before every milestone
│   └── specs/001-admin-ui/
│       ├── spec.md                    # PRD + Epics + Stories + Gherkin AC
│       ├── plan.md                    # tech plan
│       └── tasks.md                   # milestone breakdown + DoD
├── .claude/commands/                  # /analyze /coverage /code-review /heal
├── deliverables/
│   ├── 01-prd/prd.md
│   ├── 02-exploration/exploration.md
│   ├── 03-test-design/test_design.csv
│   ├── 04-execution/agent_execution_report.html
│   ├── 04-execution/evidence/         # screenshots referenced by the HTML report
│   └── 05-automation/healing_process.md
├── src/
│   ├── pages/                         # Page Objects — no assertions inside
│   │   ├── base/BasePage.ts
│   │   ├── LoginPage.ts
│   │   └── admin/*.ts
│   ├── components/                    # oxd primitives: Dropdown, Autocomplete, Toast, Table, Dialog, DatePicker
│   ├── fixtures/                      # auth fixture, page fixture, data fixture
│   ├── utils/                         # locator factory, wait helpers, data factory, logger
│   └── data/                          # test data builders (no hardcoded IDs)
├── tests/admin/*.spec.ts
├── playwright.config.ts
└── reports/                           # html + allure output (git-ignored)
```

Module-agnostic rule: **nothing** in `src/base`, `src/components`, `src/fixtures`, or
`src/utils` may mention "Admin". Swapping the module under test must require only a new
`spec.md` + new `src/pages/<module>/` + new `tests/<module>/`. If you are tempted to put an
Admin-specific wait, selector, or constant in a shared file — stop, that is an architecture
violation.

## 5. ORANGEHRM UI SURVIVAL GUIDE (authoritative)

The app is an `oxd`-component Vue SPA. Naive locators will fail. These rules are binding.

### 5.1 Locator strategy — strict priority order
1. `getByRole` with accessible name.
2. **Label-anchored field factory** (the workhorse — most OrangeHRM inputs have no
   `id`, `name`, or `placeholder`):
   `page.locator('.oxd-input-group').filter({ hasText: /^Username$/ }).locator('input')`
   Wrap this once in `utils/fieldFactory.ts` as `field(label)`, `dropdown(label)`,
   `autocomplete(label)`. Never inline it in a test.
3. `getByPlaceholder` / `getByText` where genuinely stable (e.g. `Type for hints...` is
   **not** stable — it repeats across the page).
4. Scoped CSS on `oxd-` classes, always chained from a container.
5. XPath — **forbidden** except in a healing note documenting why nothing else worked,
   and never positional (`div[2]/div/input` is an automatic `/code-review` rejection).

Forbidden outright: index-based `nth()` on business data, absolute XPath, selectors
containing generated ids, `:has-text` on values that are also substrings of other rows.

### 5.2 The oxd component traps

| Component | Trap | Mandated handling |
|---|---|---|
| `.oxd-select-text` dropdown | Not a `<select>`. `selectOption()` throws. | Click `.oxd-select-text`, wait for `.oxd-select-dropdown`, click `.oxd-select-option` by exact text. Assert the trigger's text after selection. |
| `.oxd-autocomplete-text-input input` (Employee Name, Supervisor) | Debounced remote hint list; picking nothing leaves the field "Invalid". | Type partial, `await expect(dropdown.getByRole('option')).toBeVisible()`, click exact option, then assert no `.oxd-input-field-error-message`. Never `fill()` and tab away. |
| `.oxd-toast` | Auto-dismisses in ~3–5s → classic race: assertion runs after it vanishes. | Start the wait **before** the click (`const toast = page.locator('.oxd-toast-content--success'); await Promise.all([toast.waitFor(), saveBtn.click()])`). Never `waitForTimeout` then assert. |
| `.oxd-loading-spinner` | Overlays and swallows clicks; appears *after* the click. | `await expect(spinner).toHaveCount(0)` in a shared `waitForIdle()` — and call it before interactions, not after. |
| `.oxd-table-card` rows | Row order changes; "No Records Found" is a `div`, not an empty table. | Locate rows by cell text within `.oxd-table-body`; assert the empty state explicitly. Always paginate via `.oxd-pagination`, never assume page 1. |
| `.oxd-checkbox-input` | Real `<input>` is visually hidden → `check()` fails "not visible". | Click the `.oxd-checkbox-wrapper` / label, then assert `--checked` class or `isChecked()`. |
| `.oxd-date-input` | Demo default format is **yyyy-dd-mm** (not ISO). Calendar widget is fragile. | Type the string in the app's declared format; read the format hint from the field. Log the format as a usability finding in M2. |
| `.oxd-dialog-container` (delete confirm) | Destructive confirm is a separate modal. | Scope to the dialog, click `Yes, Delete` by role+name, wait for dialog detach **and** toast. |
| Corporate Branding | Hidden `input[type=file]`, colour pickers. | `setInputFiles()` on the hidden input; treat colour pickers as low-automation-value → `needs automation = No` with justification. |
| Organization → Structure | Lazy-loaded tree nodes. | Expand parent, wait for child node text, then act. Never pre-compute depth. |
| Left sidebar | Collapsible; DOM differs collapsed vs expanded. | Normalise to expanded in `BasePage.goto()`. |

### 5.3 Environment realities
- **Shared public demo.** Other users mutate data concurrently. Every test creates its own
  uniquely-suffixed data (`e2e_<epic>_<ts>`) and cleans up in `afterEach`. Zero dependency
  on seeded records.
- **Periodic data reset.** Never assert on a record you did not create in the same test.
- **Rate limiting / 5xx under load.** `workers: 2` max against the demo host; retries `1`
  locally, `2` in CI. A test that only passes on retry is a healing candidate, not a pass.
- **Session expiry / forced logout** mid-run → the auth fixture must detect a redirect to
  `/auth/login` and re-authenticate once before failing.
- **`networkidle` is unreliable** on this SPA (polling/analytics). Banned. Use element-state waits.
- **Playwright strict mode** violations are common (duplicate menu text, repeated row values).
  Resolve by scoping, never by `.first()`.

### 5.4 Known-defect discipline
The demo has genuine product bugs. You must:
- record each as `BUG-###` in `exploration.md` with steps, expected, actual, severity, evidence;
- mark the corresponding test case `valid in scope = No` **only** if the defect makes the
  case un-executable, with the reason naming the bug id;
- never write an automated assertion that encodes buggy behaviour as correct. If a test must
  pass against a broken feature, `test.fixme()` it with a link to the bug id.

## 6. ARTIFACT CONTRACTS

### M1 `deliverables/01-prd/prd.md`
Vision, scope, personas, in/out of scope (API explicitly out), module inventory for **all 12
UI modules**, then Admin deep-dive: Epics → User Stories → Gherkin acceptance criteria,
NFRs, assumptions, risks, traceability seed ids.

### M2 `deliverables/02-exploration/exploration.md`
Per sub-module: navigation path, UI inventory, observed behaviour, **findings table**
(`FIND-###` usability/UX) and **bug table** (`BUG-###` functional), locator risk register
(element → chosen locator → stability rating → fallback), flakiness log, screenshots in
`evidence/`. No automation code in this milestone.

### M3 `deliverables/03-test-design/test_design.csv`
Exact header (order fixed, the two mandated columns spelled exactly as below):

```
TC_ID,Epic_ID,Story_ID,Module,Sub_Module,Title,Preconditions,Test_Steps,Test_Data,Expected_Result,Type,Priority,valid in scope,scope_reason,needs automation,automation_reason,Automation_ID,Linked_Bug
```

- `valid in scope`: `Yes` / `No` — is this case executable and in UI scope on this demo?
- `needs automation`: `Yes` / `No` — is it worth automating (repeatable, deterministic, high value)?
- Every `No` in either column **must** have a non-empty reason cell.
- Multi-line steps use `\n` inside a quoted cell. UTF-8, RFC-4180 quoting, comma-safe.
- Coverage target: every Story_ID in `spec.md` appears at least once, positive + negative + boundary.

### M4 `deliverables/04-execution/agent_execution_report.html`
Single self-contained HTML (inline CSS/JS, no CDN). Sections: run metadata, executive
summary with pass/fail/blocked donut, results table filterable by status/priority/sub-module,
**bug report cards** (id, title, severity, priority, steps, expected, actual, evidence,
status), traceability matrix Story → TC → Result, and a flakiness/observation appendix.
Only `valid in scope = Yes` cases are executed here.

### M5 Automation + `deliverables/05-automation/healing_process.md`
Playwright POM implementing every `needs automation = Yes` case. Healing doc is an
**experiment log**, one entry per failure:
`ID | Timestamp | Test | Symptom | Raw error | Hypothesis | Diagnosis (root cause class) | Fix applied | Verification (N consecutive green) | Prevention rule added`.
Root cause classes: `LOCATOR_DRIFT | TIMING | STATE_POLLUTION | ENV_INSTABILITY | PRODUCT_BUG | TEST_LOGIC`.
A fix that only adds a hard wait is rejected — escalate to an element-state wait and say so.

## 7. COMMANDS

`/analyze`, `/coverage`, `/code-review`, `/heal` are defined in `.claude/commands/`.
Read the command file before executing it. Each produces or updates a named artifact —
a command that prints to chat only has not run.

## 8. WORKING PROTOCOL

1. **Read first:** `.specify/memory/constitution.md`, then the current milestone in
   `.specify/specs/001-admin-ui/tasks.md`.
2. **Announce** the milestone, its inputs, its DoD, and the gate you just verified.
3. **Execute** in small commits; one artifact per milestone.
4. **Verify** against the DoD checklist and paste the checklist result.
5. **Stop** at the gate. Ask for sign-off before the next milestone.
6. **Never fabricate.** If you did not open the page, you do not know what it does. Say
   "not yet explored" rather than inventing a field list.
7. **Evidence or it didn't happen.** Bugs need screenshots; healing entries need the raw
   error text; coverage claims need the CSV row ids.

---

After creating the file, confirm its path and list the subsection titles you find in §5.
````

**Produced:** CLAUDE.md (the standing master system prompt governing the whole pipeline) written to the repo root.

**Improved prompt:**

```
Create CLAUDE.md at the workspace root with the content of the original master prompt, keeping sections 1–4, 6 and 7 unchanged, and with these amendments:

§5.1, item 2 — replace the worked example with: anchor on the <label> element itself, then take the input inside the same .oxd-input-group:
  page.locator('.oxd-input-group').filter({ has: page.locator('label', { hasText: /^Username$/ }) }).locator('input')
Filtering the group by its full text fails whenever a sibling control renders text (a dropdown's "-- Select --"). Also: an icon can add a leading character to a button's accessible name (" Add"), so do not assume exact names for icon buttons.

§5.3 — add: execution is strictly sequential, one agent, one browser, at every milestone. Keep the raw output (JSON results and list output) of every official run under deliverables/05-automation/runs/.

§5.4 — replace the fixme rule with the known-defect guard rule: a test for a deterministic, confirmed defect asserts the product's ACTUAL behaviour, carries the bug id in its title and in Linked_Bug, and is labelled KNOWN DEFECT, so it fails when the bug is fixed. test.fixme() is only for a case that cannot complete a run at all.

§8 — add:
8. Resuming after an interruption: reconcile state from disk first, damage-check the shared demo, do not re-execute completed work, and treat any work not recorded to the evidence standard as not done.
9. Every P0 case is in the first automation wave; promoting a case to P0 includes automating it.
10. When a figure changes, update every artifact that shows it in the same change; never rewrite historical run records.

After creating the file, confirm its path and list the subsection titles in §5 and the items in §8.
```

**What the improvement fixes:** Two of its own rules did not hold up: the §5.1 worked example (filter the input group by ^Label$) fails on dropdown fields (M5 locator corrections, HEAL-005), and §5.4's test.fixme() rule was never followed — the project asserted defects' actual behaviour instead, without writing that rule down, which led to a non-existent "CLAUDE.md §6.4" being cited in 9 places.

---

## M2 — Exploration

### #17 — 2026-09-19T23:46:52Z — Gate G2

**Purpose:** Milestone 2 kickoff: the full manual UI exploration brief

```
# MILESTONE 2 — UI Exploration & Findings

## Context
SpecKit pipeline per CLAUDE.md, governed by .specify/memory/constitution.md.
Gate G1 is signed off. This is Milestone 2 (Gate G2).

Assignment inputs:  project URL + deliverables/01-prd/prd.md + selected coverage scope
Assignment output:  exploration findings as a markdown file
Selected coverage scope: Admin module, UI only, all 7 sub-modules.

## Pre-work
1. Read .specify/memory/constitution.md (Articles I, II, V, VI in particular).
2. Read Milestone 2 and its DoD in .specify/specs/001-admin-ui/tasks.md.
3. Read deliverables/01-prd/prd.md section 8.1 (Admin) and section 13 (Open Questions).
4. Read the OrangeHRM survival guide in CLAUDE.md section 5.
5. Create deliverables/02-exploration/exploration.md and
   deliverables/02-exploration/evidence/ .

## THE HARD RULE OF THIS MILESTONE
You are exploring a live application manually. You may ONLY write down what you have
actually observed on screen in this session.

- Zero automation code. No .spec.ts file may exist when this milestone ends.
  Driving the browser interactively to LOOK at the app is exploration. Writing a test
  that asserts something is Milestone 5. Do not cross that line.
- Zero API calls, zero network stubbing, zero database access. UI only.
- If you did not open the screen, you do not know what is on it. Write
  "not explored — <reason>" rather than inventing a field list.
- Do not describe behaviour from general OrangeHRM knowledge. You are documenting
  THIS build (OrangeHRM OS 5.9) of THIS demo, today.

## Credentials and safety
Admin / admin123 at https://opensource-demo.orangehrmlive.com/
This is a SHARED PUBLIC demo. Constitution Article VI applies:
- Prefix every record you create with `e2e_` plus a unique suffix.
- Delete what you create; never delete a record you did not create.
- Never change the Admin account's credentials, never disable the Admin user.
- Admin > Configuration > Modules and Maintenance > Purge have global blast radius:
  OBSERVE ONLY. Open the screen, inventory it, do not toggle or execute anything.
- Branding and Localization: if you change something, revert it in the same visit and
  record that you did.

## Procedure

### Step 1 — Environment capture
Record: URL, build string (OrangeHRM OS 5.9 — confirm), browser and version, viewport,
session date and time, account used.

### Step 2 — Walk every Admin sub-module
For each of the 7 sub-modules (User Management, Job, Organization, Qualifications,
Nationalities, Corporate Branding, Configuration) and each screen within them:
  - navigation path taken
  - screen inventory: every field with its actual control type, whether it is marked
    mandatory, visible constraints, and every button/action available
  - default state: record count shown, default filter values, the exact empty-state text
  - a screenshot of the landing screen into evidence/

### Step 3 — Exercise the behaviour
On each form, actually perform and record the real outcome of:
  happy-path create · submit with mandatory fields empty · duplicate of an existing value ·
  a value at and beyond the apparent length limit · an invalid format where the field
  implies one · cancel from a filled form · delete then cancel the dialog · delete then
  confirm · search with a match · search with no match · pagination across pages if the
  data supports it

Record the EXACT wording of every validation message, toast, and empty state. Verbatim,
in quotes. This wording becomes the assertion text in Milestone 5 — paraphrasing it here
guarantees a false failure later.

### Step 4 — Resolve the Open Questions
prd.md section 13 contains the TO CONFIRM register from Milestone 1. Work through every
one of them and answer it with an observation. For each, record the question id, what you
did, what you saw, and the resolved answer. Anything you genuinely cannot determine from
the UI stays open with a stated reason.

### Step 5 — Findings register (FIND-nnn)
Usability, consistency and UX observations that are not functional defects: inconsistent
error wording across screens, unexpected date format ordering, toast dismissing too fast
to read, ambiguous labels, missing field hints, inconsistent button placement.
Columns: ID | Sub-module | Observation | Business impact | Evidence file

### Step 6 — Bug register (BUG-nnn)
Genuine functional defects. Columns: ID | Title | Sub-module | Severity
(Critical/High/Medium/Low) | Preconditions | Numbered steps | Expected | Actual |
Reproducibility (x out of 5 attempts) | Evidence file

Rules:
- Severity is justified by user impact, never by how hard it was to find.
- Expected behaviour must be traceable to a prd.md requirement — cite the US or BR id.
- Attempt every bug 5 times and record the true count. A one-off is an observation,
  not a defect.
- If you cannot reproduce it, it goes in the flakiness log, not the bug register.
- Do not pad this register. An honest 4 reproducible bugs beats 15 speculative ones.

### Step 7 — Locator risk register
This is what makes Milestone 5 possible. For every interactive element you will later
need to automate:
  Element | Screen | Proposed locator | Uniqueness/Stability/Order-independence score
  | Rating (Stable/Fragile/Volatile) | Failure mode | Mitigation or required wrapper

Every oxd trap from CLAUDE.md section 5.2 that you actually encountered must have a row:
the .oxd-select-text dropdown, the debounced autocomplete, the auto-dismissing toast,
the loading spinner overlay, table rows and pagination, the visually-hidden checkbox
input, the date field and its real format, the delete confirmation dialog, hidden file
inputs on Corporate Branding, and the lazy-loaded Organization Structure tree.

Record the ACTUAL class names and accessible names you observed on build 5.9 — not the
ones the survival guide predicted. If the guide is wrong about this build, say so
explicitly; that correction is a valuable finding.

### Step 8 — Flakiness and environment log
Non-deterministic behaviour, spinner and toast timing, slow responses, 5xx errors, rate
limiting, evidence of other users mutating data during your session, session expiry.
Columns: ID | Observation | Frequency | Suspected cause | Impact on automation

### Step 9 — Automation readiness assessment
Per sub-module: Ready / Ready-with-wrapper / Not recommended, with the reason.
This feeds the `needs automation` column in Milestone 3 — write it so that M3 can lift
the justification directly.
Also flag per screen whether it is executable at all on this shared demo. This feeds
`valid in scope`.

## Output
deliverables/02-exploration/exploration.md, with all screenshots in
deliverables/02-exploration/evidence/ referenced by relative path.

## Definition of Done — verify and report each line
- [ ] All 7 Admin sub-modules and every screen within them walked and documented
- [ ] Environment and build string captured
- [ ] Every validation message, toast and empty state recorded VERBATIM in quotes
- [ ] Every prd.md section 13 Open Question answered, or left open with a reason
- [ ] Every bug has severity, numbered steps, expected vs actual, x/5 reproducibility,
      evidence, and a cited US or BR id for the expected behaviour
- [ ] Every screen has at least one locator risk row; every encountered oxd trap has a row
- [ ] Automation readiness stated per sub-module, with reasons written to feed M3
- [ ] Executability stated per screen, to feed `valid in scope`
- [ ] Zero .spec.ts files exist anywhere in the repo
- [ ] Zero API/network-stubbing was used
- [ ] Every e2e_ record created was deleted; nothing outside my own records was touched

Report: the checklist, counts of FIND / BUG (by severity) / locator rows by rating /
flakiness entries, how many Open Questions were resolved versus left open, and the three
highest-risk findings for automation.

Then STOP at Gate G2 and wait for my sign-off. Do not begin Milestone 3.
```

**Produced:** deliverables/02-exploration/exploration.md — the complete exploration procedure (9 steps), rules, and Definition of Done.

**Improved prompt:**

```
# MILESTONE 2 — UI Exploration & Findings

Context, pre-work, the hard rule (observe only, zero automation code), credentials and safety, and Steps 1–9: as in the original M2 brief, unchanged. The additions below are binding.

## Execution mode
Strictly sequential: one agent, one browser, no concurrent batches.

## Per-screen completeness matrix (required for every screen, including "confirmatory" ones)
For each screen, fill every cell with the verbatim observation or "not applicable — <reason>". Blank is not allowed.
| Operation | Toast / message text (verbatim) |
| Create — success | |
| Edit — success (record separately; it may differ from create) | |
| Delete — single, success | |
| Delete — bulk, success (where bulk exists) | |
| Mandatory-empty submit — message under each field | |
| Duplicate submit | |
| Boundary length (at and beyond the limit) | |
Also record, per screen:
- every mandatory field, including dropdowns and autocompletes (the red * is a CSS marker; confirm by submitting empty)
- search semantics for each filter: exact, prefix or contains (test with a true prefix of a real value)
- the breadcrumb, segment by segment

A "confirmatory pass" may reuse a sibling screen's structure, but not its strings: every toast and message is recorded on the screen where it was seen.

## Definition of Done additions
- [ ] The completeness matrix is filled for every screen, with no blank cells
- [ ] Search semantics recorded for every filter
- [ ] Every screen found in the live menu that the PRD lacks is listed as a finding, with a proposed story

Then stop at Gate G2.
```

**What the improvement fixes:** Asked for every toast verbatim but did not require a per-screen, per-operation checklist, so the edit toast ("Successfully Updated"), Locations' mandatory Country, the exact-match Username search and every delete toast went unrecorded and were discovered in M5 (#38, HEAL-016, exploration.md Addendum A on 2026-09-26).

---
### #18 — 2026-09-20T00:33:20Z — Gate G2

**Purpose:** The M2 back-propagation prompt: correct prd.md/spec.md against what M2 actually observed

```
Two corrections before G2 sign-off. Do both, then re-report.

## 1. Back-propagate the M2 observations into prd.md and spec.md

M2 proved that prd.md contains at least one factually wrong requirement. Fix the
document so Milestone 3 does not encode a false assertion.

For every observation that contradicts or resolves what the PRD assumed:

a) FIND-002 — correct the US-01-06 password policy Gherkin to the OBSERVED policy on
   build 5.9 (>=7 characters, >=1 number, no case requirement). Quote the exact
   validation message wording you recorded. Remove the invented upper-case scenario.

b) BUG-001 — US-05-01's Nationalities delete scenario is currently an observation
   scenario. Convert it to an asserted scenario describing the ACTUAL behaviour
   (deletion succeeds and silently nulls the employee's field), and annotate it
   `KNOWN DEFECT: BUG-001`. Do not write the desired behaviour as if it were the
   requirement — write what the product does, and record the gap as the defect.

c) Every other TO CONFIRM marker that M2 resolved: replace the marker with the observed
   fact, in the exact wording recorded. Any that M2 could not resolve stays marked, with
   the reason updated.

d) Apply the same edits to .specify/specs/001-admin-ui/spec.md so the two stay identical
   on ids and consistent on content.

e) Add a short "M2 corrections" subsection to prd.md section 13 listing every requirement
   that changed, with the FIND/BUG/OQ id that caused the change. This is the audit trail
   showing the pipeline worked.

## 2. Answer the tasks.md question you raised

My rulings:
- The TC_ADM_xx_nnn catalogue belongs to Milestone 3, not M2. Do not produce it now.
- Updating spec.md's observation scenarios IS in scope — that is item 1(b) above.

## Then re-run the G2 DoD checklist and additionally confirm:
- [ ] No requirement in prd.md now contradicts a recorded M2 observation
- [ ] Every resolved TO CONFIRM replaced with the observed fact, verbatim
- [ ] Known defects annotated in the Gherkin rather than written as correct behaviour
- [ ] prd.md and spec.md id parity still holds (run the diff)
- [ ] section 13 "M2 corrections" subsection present

Report the count of requirements corrected, then stop at G2 again.
```

**Produced:** FIND-002's password-policy correction, BUG-001's Nationalities scenario converted to an asserted known-defect scenario, every resolved TO CONFIRM marker replaced, and prd.md §13 "M2 corrections" audit trail added.

**Improved prompt:**

```
Two corrections before G2 sign-off.

## 1. Back-propagate M2 into prd.md and spec.md
a) FIND-002: correct US-01-06 to the observed policy (≥7 characters, ≥1 number, no case requirement), quoting the recorded messages verbatim; remove the invented upper-case scenario.
b) BUG-001: convert US-05-01's delete scenario to an asserted scenario of the ACTUAL behaviour, annotated KNOWN DEFECT: BUG-001.
c) Replace every TO CONFIRM that M2 resolved with the observed fact, verbatim; keep unresolved ones with an updated reason.
d) ADDITIONS: every screen or behaviour M2 found that the PRD does not specify (e.g. FIND-005) gets a requirement now: add it to the inventory and mint a story with Gherkin written only from what exploration.md recorded. No test case may later trace to a FIND id instead of a story.
e) Apply the same edits to spec.md; keep ids identical.
f) Add an "M2 corrections" subsection to prd.md §13 listing every changed or added requirement with the FIND/BUG/OQ id behind it.

## 2. Rulings
The TC catalogue belongs to Milestone 3. Updating spec.md's observation scenarios is in scope.

Re-run the G2 checklist, confirm id parity (diff and exit code), report the count of requirements corrected and added, and stop at G2.
```

**What the improvement fixes:** Back-propagated corrections to existing requirements but not additions: FIND-005's undocumented LDAP screen got no story, so two test cases traced to a finding id until US-07-08 was added on 2026-09-26.

---
### #19 — 2026-09-20T00:43:21Z — Gate G2

**Purpose:** G2 verification checklist after the back-propagation

```
Re-read CLAUDE.md and .specify/memory/constitution.md.

Context: Milestone 1 is signed off. Milestone 2 exploration is complete and 7 requirement
corrections were back-propagated from M2 observations into prd.md and spec.md. We are at
Gate G2, awaiting my sign-off. Do not start Milestone 3.

Run these verification checks and report the results:

1. Id parity — run:
   diff <(grep -o 'US-0[0-9]-[0-9][0-9]' deliverables/01-prd/prd.md | sort -u) \
        <(grep -o 'US-0[0-9]-[0-9][0-9]' .specify/specs/001-admin-ui/spec.md | sort -u)
   Report the exit code.

2. Confirm deliverables/02-exploration/exploration.md exists and is non-empty, and that
   evidence/ contains screenshots referenced by relative path.

3. G2 DoD condition — confirm no .spec.ts exists anywhere outside node_modules.
   Then list ./pages, ./tests and ./utils at the repo root. If they are empty SpecKit
   scaffolding, delete them: the contract puts page objects under src/ and tests/ is
   created fresh in M5.

4. For each file in .claude/commands/, one line each: is it one of OUR four custom
   commands (analyze = locator stability audit, coverage = requirement coverage audit,
   code-review = POM compliance, heal = failure diagnosis), or a stock SpecKit command?
   Delete nothing.

5. Flag any stock command whose internal references do not match our actual documents —
   e.g. one citing "Article III (Traceability)" when our Article III is "Playwright
   Design Standards". I want to know which would misfire if invoked, not to fix them.

6. Confirm the remaining command order matches tasks.md:
   /coverage after the M3 CSV · /analyze after M4 and before any page object is written ·
   /code-review before the first full suite run · /heal on every M5 failure.

Report and stop.
```

**Produced:** Id-parity re-check, exploration.md existence check, scaffolding disposition question raised, per-command audit (ours vs. stock SpecKit), pipeline-order confirmation.

**Improved prompt:**

```
Re-read CLAUDE.md and .specify/memory/constitution.md. We are at Gate G2; do not start M3.

1. Id parity: run the prd.md/spec.md diff (US- and EPIC-ADM- ids) and report the exit code.
2. Confirm exploration.md exists and is non-empty, and that evidence/ holds the screenshots it references.
3. List every .spec.ts outside node_modules, and everything under ./pages, ./tests and ./utils at the repo root: paths, line counts, and whether each mentions OrangeHRM. Delete nothing; I will decide after reading it.
4. For each file in .claude/commands/: is it one of our four commands (analyze, coverage, code-review, heal) or a stock SpecKit command? Flag any stock command whose references would misfire against our documents.
5. Confirm the command order in tasks.md: /coverage after the M3 CSV, /analyze after M4 and before any page object, /code-review before the first full run, /heal on every M5 failure.

Report and stop.
```

**What the improvement fixes:** Told the agent to delete root folders "if they are empty scaffolding" without first asking what they held; they held the pre-pipeline suite from #1, so the decision came back through #20 and #22. The improved version reports first and deletes only on a separate instruction.

---

## M2 → M3 — Pipeline Reconciliation (Gate G2)

### #20 — 2026-09-23T14:27:11Z — Gate G2

**Purpose:** The pipeline-reconciliation prompt: rule CLAUDE.md authoritative over the stock 4-milestone SpecKit scaffolding

```
Re-read CLAUDE.md.

Context: M1 signed off. M2 exploration complete, 7 requirement corrections
back-propagated into prd.md and spec.md. We are at Gate G2.

You correctly found that this repo contains TWO conflicting pipelines: the stock SpecKit
one (4 milestones, root-level pages/tests/utils, stock commands) and ours (5 milestones,
src/ layout, four custom commands). Resolve it now, before M3.

## Ruling: CLAUDE.md wins
Everything from M1 onward was produced under CLAUDE.md's model. Reconcile everything else
to it. Do not rewrite prd.md, spec.md or exploration.md — they are correct.

## Tasks

1. Rewrite .specify/specs/001-admin-ui/tasks.md to CLAUDE.md's five-milestone model:
   M1 deliverables/01-prd/prd.md
   M2 deliverables/02-exploration/exploration.md
   M3 deliverables/03-test-design/test_design.csv  (exact header from CLAUDE.md section 6,
      including `valid in scope` and `needs automation`)
   M4 deliverables/04-execution/agent_execution_report.html
   M5 Playwright POM suite + deliverables/05-automation/healing_process.md
   Each milestone gets its Definition of Done and its gate (G1-G5).
   Mark M1 and M2 as COMPLETE, with M2 pending my sign-off.
   Remove the deliverables/02-exploration/test-design.md line item — that artifact is
   M3's test_design.csv and lives at the path above.

2. Reconcile .specify/memory/constitution.md with CLAUDE.md where they conflict on
   pipeline shape, milestone count, and directory layout. Do not weaken any rule —
   the UI-only prohibition, the manual-first rule, the POM standards, the healing
   discipline and the shared-demo safety rules all stand. Report every change you make.

3. Report exactly what the pre-existing .spec.ts files and the root pages/tests/utils
   code are: file paths, line counts, and whether they reference OrangeHRM Admin at all.
   Do not delete anything yet — tell me first, because this determines whether G2's
   "zero .spec.ts" condition was violated by earlier work or by stock scaffolding.

4. Confirm the four custom commands exist at .claude/commands/ : analyze.md, coverage.md,
   code-review.md, heal.md. Report which are present and which are missing — I have the
   content for any that are missing.

Report and stop. Do not start M3.
```

**Produced:** tasks.md rewritten to the 5-milestone/src/ model; constitution.md reconciled; scaffolding disposition reported (not yet deleted).

**Improved prompt:**

```
Re-read CLAUDE.md. The repo contains two conflicting pipelines: stock SpecKit (4 milestones, root pages/tests/utils, stock commands) and ours (5 milestones, src/, four custom commands).

## Ruling: CLAUDE.md wins
Do not rewrite prd.md, spec.md or exploration.md; they are correct.

1. Rewrite tasks.md to CLAUDE.md's five milestones (M1 prd.md · M2 exploration.md · M3 test_design.csv with the exact header · M4 agent_execution_report.html · M5 suite + healing_process.md), each with its Definition of Done and gate G1–G5. Mark M1 and M2 complete, M2 pending my sign-off.
2. Reconcile the constitution with CLAUDE.md on pipeline shape, milestone count and layout, weakening no rule. Record the change in its changelog and in Article IV.4.
3. The root-level pages/, tests/ and utils/ you listed predate the pipeline: print their paths and line counts for the record, then delete them.
4. Confirm the four custom command files exist; list any missing.

Report every change and stop. Do not start M3.
```

**What the improvement fixes:** No downstream problem traced to the ruling itself; the improved version also removes the listed scaffold in the same step, which took a third prompt (#22).

---
### #21 — 2026-09-23T14:32:20Z — Gate G2

**Purpose:** Create the four governing custom commands with their exact content

````
Create these four files in .claude/commands/ , overwriting analyze.md (its current
content is the stock SpecKit consistency checker, not ours). Leave the other stock
SpecKit commands untouched.

--- FILE 1: .claude/commands/analyze.md ---

---
name: analyze
description: Scan OrangeHRM UI locators and flag unstable/dynamic selectors.
output: deliverables/02-exploration/locator_risk_register.md
---

# /analyze — Locator Stability Audit

**Input:** a screen name or URL path (defaults to every Admin sub-module), the live UI, and
any existing page objects.

## Procedure
1. Navigate to the target screen through the UI (authenticated, sidebar normalised).
2. Enumerate every interactive element: inputs, dropdowns, autocompletes, checkboxes,
   date fields, buttons, table rows/cells, pagination, dialogs, toasts, file inputs, tree nodes.
3. For each element, generate the candidate ladder in priority order:
   role+accessible name -> label-anchored .oxd-input-group factory -> data-test
   (where the app provides it) -> scoped stable text -> structural neighbour -> XPath (last).
4. Score each candidate 0-3:
   - Uniqueness — resolves to exactly 1 node (no strict-mode violation).
   - Semantic stability — depends on meaning, not on structure or generated ids.
   - Order independence — unaffected by row order, pagination, data volume, or
     sidebar collapse state.
5. Classify the element:
   - Stable — best candidate scores 3/3.
   - Fragile — 2/3; usable with a documented fallback.
   - Volatile — 1/3 or less; requires a component wrapper or a design workaround.
6. Flag automatically, with the reason:
   - positional or absolute XPath required
   - generated / hashed / numeric ids
   - text that also appears elsewhere on the page
   - .oxd-select-text mistaken for a native select
   - autocomplete inputs indistinguishable by placeholder
   - toast/spinner elements that are transient (must be pre-armed)
   - hidden inputs (checkbox, file) needing wrapper interaction
   - elements only present after lazy expansion (org tree)

## Output
Append/refresh a table:

| Element | Screen | Chosen locator | Candidate score | Stability | Failure mode | Mitigation / wrapper |

Plus a summary: counts per stability class, the top 5 highest-risk elements, and any
new component wrapper the audit proves is required.

## Rules
- Read-only. /analyze never edits source; it produces the register.
- Never propose a locator it has not resolved against the live DOM.

--- FILE 2: .claude/commands/coverage.md ---

---
name: coverage
description: Validate UI test-case coverage against the Admin module user stories.
output: deliverables/03-test-design/test_design_coverage.md
---

# /coverage — Requirement Coverage Audit

**Inputs:** deliverables/01-prd/prd.md and .specify/specs/001-admin-ui/spec.md
(authoritative ids), deliverables/03-test-design/test_design.csv, and at G5 the
implemented suite.

## Procedure
1. Parse all EPIC-ADM-* and US-* ids and every Gherkin scenario (expanding Scenario
   Outlines into one expected case per Examples row).
2. Parse the CSV; validate structure first:
   - header byte-exact, no duplicate TC_ID, RFC-4180 quoting valid
   - every `valid in scope = No` has a non-empty scope_reason
   - every `needs automation = No` has a non-empty automation_reason
   - every `needs automation = Yes` has an Automation_ID
3. Build the forward matrix Story -> TC_IDs and classify coverage:
   - Full — positive AND negative AND (boundary where the story implies limits)
   - Partial — some scenarios covered
   - None — no case
4. Build the reverse matrix TC_ID -> Story and flag orphans (cases with no story) —
   these are either scope creep or a missing requirement; say which.
5. Depth checks per CRUD screen: create, mandatory-empty, duplicate, boundary length,
   edit, delete-confirm, delete-cancel, search, empty-state, pagination, reset.
   Report any missing cell.
6. At G5 also verify Automation_ID -> an existing test title; report unimplemented and
   orphan tests.

## Output
- Coverage matrix table (Story | Scenarios | TC_IDs | Coverage | Gap)
- Gap list ranked by story priority, each with a concrete proposed TC_ID and title
- Structural-validation results
- Headline metrics: story coverage %, scenario coverage %, automation coverage %

## Rules
- Fail loudly. Do not round up. Partial is never reported as Full.
- Do not silently add cases; propose them and let M3 own the edit.

--- FILE 3: .claude/commands/code-review.md ---

---
name: code-review
description: Review Playwright TypeScript against POM and clean-code standards.
output: deliverables/05-automation/code_review.md
---

# /code-review — Framework Compliance Review

**Authority:** the constitution's Playwright Design Standards. Every finding cites the
clause it violates.

## Checklist

### A. Architecture
- [ ] Page objects contain NO expect / assertions
- [ ] Page objects expose behaviour, not raw locators, to tests
- [ ] Raw oxd- selectors appear ONLY in src/components/
- [ ] Locators are readonly lazy fields, not resolved in constructors
- [ ] Dependency direction: test -> fixture -> page -> component -> util. No upward imports
- [ ] src/components, src/fixtures, src/utils, src/pages/base contain zero
      module-specific ("Admin") knowledge

### B. Locators
- [ ] No absolute or positional XPath; any XPath has a documented waiver
- [ ] No generated/hashed ids; no index selection on business data
- [ ] No .first() used to silence strict mode
- [ ] Label-anchored factory used for form fields rather than ad-hoc CSS

### C. Waits and determinism
- [ ] Zero waitForTimeout, sleep, networkidle
- [ ] Toast assertions are pre-armed before the triggering click
- [ ] waitForIdle() used before interaction, not as a blanket post-click sleep
- [ ] No conditional assertions, no if (await x.isVisible()) guards around expectations
- [ ] No try/catch swallowing failures; no retry loops inside tests

### D. Test hygiene
- [ ] One test per TC_ID; title starts with the Automation_ID
- [ ] Tests are order-independent and create their own e2e_-prefixed data
- [ ] Teardown is guaranteed via fixture, including on failure
- [ ] No test.skip without a linked BUG-nnn; fixme used for product bugs
- [ ] Assertions are specific (toHaveText) rather than weak (toBeTruthy)

### E. TypeScript and style
- [ ] strict passes, no any, no ! on locator results
- [ ] No console.log; logger used
- [ ] Naming: PascalCase classes, camelCase methods, intention-revealing names
- [ ] No duplication that belongs in a component or util
- [ ] No dead code, no commented-out tests

### F. Safety on the shared demo
- [ ] No modification of the Admin account, Modules toggles, or global config without revert
- [ ] No deletion of records the suite did not create

## Output
Findings table: ID | Severity (Blocker/Major/Minor) | File:line | Clause | Issue |
Required fix — then a verdict: APPROVED / APPROVED WITH MINORS / REJECTED.
Any Blocker means REJECTED. Provide the minimal corrected snippet for each Blocker/Major.

--- FILE 4: .claude/commands/heal.md ---

---
name: heal
description: Diagnose failing UI scripts, resolve selector/timing issues, log the experiment.
output: deliverables/05-automation/healing_process.md
---

# /heal — Diagnostic and Healing Cycle

**Principle:** diagnose before you touch. Proposal-only — no silent auto-fix.

## Procedure

### 1 Capture
Raw error text, failing selector/action, trace, screenshot, DOM snapshot of the target
container, console errors, attempt history.

### 2 Reproduce
Re-run the single test 3x with --trace on. Record the pass/fail pattern.
Deterministic failure and intermittent failure are different diseases.

### 3 Classify — exactly one root-cause class
| Class | Signature |
|---|---|
| LOCATOR_DRIFT | resolves to 0 or more than 1 node; strict-mode violation; DOM changed |
| TIMING | element exists later; spinner/overlay intercepts; toast already dismissed |
| STATE_POLLUTION | passes alone, fails in suite; leftover data; shared account state |
| ENV_INSTABILITY | 5xx, rate limit, demo reset, network; unrelated to the script |
| PRODUCT_BUG | the app genuinely misbehaves |
| TEST_LOGIC | wrong expectation, wrong data, wrong flow |

### 4 Diagnose and fix — by class
- LOCATOR_DRIFT -> run the /analyze candidate ladder against the live DOM; propose only a
  3/3 candidate; fix in the component wrapper if the pattern is generic, in the page object
  if screen-specific. Record old -> new with a confidence note.
- TIMING -> identify the true readiness signal (spinner count 0, row present, dialog
  detached, toast pre-armed) and wait on that. Adding waitForTimeout or widening a timeout
  without a named signal is rejected.
- STATE_POLLUTION -> fix the fixture/teardown or the uniqueness of the data suffix.
  Never weaken the assertion.
- ENV_INSTABILITY -> no code change. Quarantine with evidence, reduce workers, record it.
- PRODUCT_BUG -> file BUG-nnn, test.fixme() with the id, report as a product failure.
  Healing is forbidden here.
- TEST_LOGIC -> correct the test against the spec, not against observed behaviour.

### 5 Verify
Re-run the fixed test 3 consecutive times green, then the full suite once.
Record both results. Fewer than 3x green means the heal is not accepted.

### 6 Log — append to healing_process.md
```
### HEAL-nnn | <timestamp>
Test:            <Automation_ID / title>
Symptom:         <one line>
Raw error:       <verbatim>
Attempts:        <pass/fail pattern>
Hypothesis:      <what you suspected>
Root cause:      <CLASS> — <evidence that proves it>
Fix layer:       component | page | fixture | test | none
Change:          <old -> new, or "no code change">
Verification:    3/3 green (<run ids>), full suite <result>
Prevention rule: <rule added, or "n/a">
```

### 7 Escalate
If the same test heals twice for the same class, stop patching: raise a design defect and
fix the pattern framework-wide.

## Forbidden heals
waitForTimeout · timeout inflation without diagnosis · {force:true} to punch through an
overlay · .first() to dodge strict mode · in-test retry loops · deleting or weakening the
assertion · catching and ignoring the error.

--- END ---

After creating all four, list .claude/commands/ and confirm which files are ours versus
stock SpecKit. Then stop.
````

**Produced:** .claude/commands/analyze.md, coverage.md, code-review.md, heal.md.

**Improved prompt:**

```
Create the four command files in .claude/commands/ with the content of the original prompt, with these amendments:

code-review.md — every checklist item is checked by searching ALL of src/ and tests/, not by sampling. Add a "Search patterns" section, each pattern run and every hit read in context:
- raw oxd- selectors outside src/components/ and src/utils/fieldFactory.ts:  \.oxd-  in tests/ and src/pages/
- weak assertions:  toBeTruthy | toBeDefined | \.length\)\.toBeGreaterThan\(0\)
- swallowed errors:  \.catch\(\s*\(\)\s*=>  and  try {  without a rethrow
- strict mode silenced:  \.first\(\)  after  filter\(\{\s*hasText
- positional selection on business data:  \.nth\(  and  nth-child
- retrying presence checks on auto-dismissing toasts:  toHaveCount\(0\)  on a toast locator
The report must say which patterns were run and list every hit with its verdict.

heal.md — PRODUCT_BUG branch: a deterministic confirmed defect is asserted as its actual behaviour, labelled KNOWN DEFECT with the bug id (per CLAUDE.md §5.4); test.fixme() only if the case cannot complete a run. ENV_INSTABILITY branch: keep the raw output of the failing run under deliverables/05-automation/runs/.

coverage.md — an orphan (a TC whose Story_ID is not a US id) is a gap to fix, never a justified exception: mint the missing story or correct the Story_ID.

analyze.md — unchanged.

After creating them, list .claude/commands/ and confirm which files are ours. Then stop.
```

**What the improvement fixes:** The /code-review checklist named violation classes without search patterns, so the first review checked page objects only and missed 17 raw oxd- selectors in test files, 5 weak toast assertions and 5 swallowed .catch(() => false) errors (found by the 2026-09-26 re-review); /heal's PRODUCT_BUG branch prescribes test.fixme() while the project's actual practice asserts a known defect's real behaviour (#28 Rule 3.4), and the two were never reconciled in writing; /coverage let orphans be "justified" (FIND-005).

---
### #22 — 2026-09-23T14:37:33Z — Gate G2

**Purpose:** Final G2 step: delete the pre-existing root-level scaffolding, re-run the G2 DoD checklist

```
Final step before G2 sign-off.

## 1. Remove the pre-existing scaffolding
Delete the root-level ./pages, ./tests and ./utils folders and every .spec.ts they
contain. Rationale: they predate Milestone 1, they are not part of this pipeline, the
contract in CLAUDE.md section 4 puts page objects under src/ and creates tests/ fresh in
Milestone 5, and the G2 DoD requires zero .spec.ts in the repo.

Before deleting, print the file paths and line counts so the removal is on the record.
Do not touch node_modules, playwright.config.ts, .mcp.json, deliverables/, .specify/,
.claude/ or CLAUDE.md.

## 2. Re-run the full G2 DoD checklist
Confirm each line from .specify/specs/001-admin-ui/tasks.md Milestone 2, plus:
- [ ] zero .spec.ts anywhere outside node_modules
- [ ] deliverables/02-exploration/exploration.md non-empty, evidence/ populated
- [ ] prd.md and spec.md id parity (run the diff, report the exit code)
- [ ] the 7 M2 corrections are recorded in prd.md section 13

## 3. State the M3 entry conditions
List exactly which files Milestone 3 will read, and the exact CSV header it will emit
from CLAUDE.md section 6. Do not create the CSV yet.

Report and stop.
```

**Produced:** Root-level ./pages, ./tests, ./utils and their .spec.ts files removed; G2 DoD re-verified.

**Improved prompt:**

```
Final step before G2 sign-off.

1. Delete the root-level ./pages, ./tests and ./utils and every .spec.ts in them (they predate Milestone 1; CLAUDE.md §4 puts page objects under src/ and creates tests/ in M5). Print their paths and line counts first. Touch nothing else.
2. Update constitution Article IV.4 to record the disposition: retired on this date, with the reason.
3. Re-run the G2 Definition of Done, plus: zero .spec.ts outside node_modules; exploration.md and evidence/ populated; prd.md/spec.md id parity (exit code); the M2 corrections recorded in prd.md §13.
4. State Milestone 3's inputs and the exact CSV header it will emit. Do not create the CSV.

Report and stop.
```

**What the improvement fixes:** No downstream problem; the improved version also records the scaffold's removal in the constitution's Article IV.4, which still reads as an open decision.

---

## M3 — Test Design

### #23 — 2026-09-23T14:41:12Z — Gate G3

**Purpose:** Milestone 3 kickoff: the full test-design derivation rules and CSV contract

```
Gate G2 approved. Begin Milestone 3.

# MILESTONE 3 — UI Test Design (CSV + coverage audit in one pass)

## Inputs
prd.md · spec.md · exploration.md · constitution.md · CLAUDE.md sections 5 and 6

## Output
deliverables/03-test-design/test_design.csv — header byte-exact, as you just quoted.

## Derivation rules

1. Derive cases from the Gherkin in prd.md. One Scenario = at least one case.
   A Scenario Outline expands to one case per Examples row — do not collapse them.

2. TC_ID format TC_ADM_<sub>_<nnn>, e.g. TC_ADM_USR_001. Sub codes:
   USR (User Management) JOB ORG QUA NAT BRD CFG NAV (cross-cutting/navigation).
   No duplicates. Number sequentially within each sub.

3. Type is one of: Functional | Validation | Negative | Boundary | UI/UX | Navigation |
   Accessibility | Regression.  Priority is P0-P3, justified by business impact.

4. Test_Steps: numbered, in domain language, using \n inside a quoted cell.
   Expected_Result: the EXACT observed wording from exploration.md where M2 recorded it —
   quoted verbatim. Never paraphrase a validation message or toast; the paraphrase becomes
   a false failure in M5.

5. Test_Data uses the e2e_ prefix with a unique suffix. No dependency on seeded records.

## The two mandated columns — this is what the assignment grades

**valid in scope** = Yes / No — is this case executable, in UI scope, on this demo today?
Set No when: blocked by a known defect that makes it un-executable · out of UI scope ·
global blast radius on the shared demo (Configuration > Modules, Maintenance > Purge) ·
not present on build 5.9. scope_reason is mandatory when No, and must name the BUG/FIND id
or the specific constraint. Never write a vague reason like "not applicable".

**needs automation** = Yes / No — is it worth automating?
Set No for: colour-picker and visual-judgement checks · one-off branding uploads ·
exploratory/UX cases · anything M2's section 9 flagged as non-deterministic on the shared
demo. automation_reason is mandatory when No, and should lift the justification directly
from exploration.md section 9 where one exists.
Every Yes gets an Automation_ID equal to its TC_ID — this becomes the M5 test title prefix.

## Known defects — the critical rule
For BUG-001 (Nationalities delete succeeds and silently nulls the employee field) and
BUG-002 (Corporate Branding unsupported-type message), and any other confirmed defect:
write the case with the ACTUAL observed behaviour as Expected_Result, put the bug id in
Linked_Bug, and keep valid in scope = Yes if it is executable.
Do NOT write the desired-but-absent behaviour as the expected result. Constitution
Article V: never encode buggy behaviour as correct, and never assert a behaviour the
product does not have.

## Depth required per CRUD screen
create · mandatory-empty · duplicate · boundary length · invalid format · edit · cancel ·
delete-confirm · delete-cancel ·
```

**Produced:** deliverables/03-test-design/test_design.csv — first pass.

**Improved prompt:**

```
Gate G2 approved. Begin Milestone 3.

# MILESTONE 3 — UI Test Design (CSV + coverage audit)

Inputs, output, derivation rules 1–5, the two mandated columns and the known-defects rule: as in the original M3 brief. The changes below are binding.

## Traceability
Story_ID must be a US-nn-yy id from spec.md. A case with no story means a missing requirement: stop and propose the story; never use a FIND or BUG id as the Story_ID.

## Cases whose expected result has not been observed
If exploration.md did not record the outcome, write the Expected_Result from the PRD, mark it "TO CONFIRM (M4)", and decide "needs automation" on value (repeatable, deterministic, high value), not on whether it has been observed yet. M4 resolves the marker; do not use "not observed" as an automation_reason.

## Capacity — decide the automation volume now
A full run at workers: 2 takes about 40–60 minutes, and Gate G5 needs 3 consecutive green runs after every healing cycle. Add an automation_wave column (W1 / W2 / blank for No):
- W1 is what this cycle builds, sized to the capacity above (target 45–55).
- Every P0 case is W1, always.
- One reference implementation per repeated CRUD family in W1; the siblings go to W2 as data.
- W2 is scheduled, not descoped: every W2 row stays "needs automation = Yes" with an Automation_ID.

## Depth required per CRUD screen
create · mandatory-empty · duplicate · boundary length · invalid format · edit · cancel · delete-confirm · delete-cancel · search match · search no-match · reset · pagination.

Then run /coverage in full (see #27) and stop at G3.
```

**What the improvement fixes:** Did not cap automation volume, which produced 136 candidates that could not be built and verified in one cycle (#26); gave no rule for cases whose expected result had not been observed yet, so 44 were marked "No" for that reason and stayed so after M4 observed all of them (scope_review.xlsx). The archived text of this prompt also stops mid-list.

---
### #24 — 2026-09-23T15:08:44Z — Gate G3

**Purpose:** Pre-sign-off structural verification of the CSV

```
Before I sign off G3, run these structural checks on the CSV and report the raw numbers:

1. Total data rows (excluding header), and the header byte-compared against CLAUDE.md §6.
2. Counts: valid in scope Yes vs No · needs automation Yes vs No.
3. Any row where valid in scope = No and scope_reason is empty, or needs automation = No
   and automation_reason is empty — list the TC_IDs. Expect zero.
4. Any row where needs automation = Yes and Automation_ID is empty. Expect zero.
5. Duplicate TC_IDs. Expect zero.
6. The set of US ids referenced in Story_ID, diffed against the US ids in prd.md —
   report any story with no case.
7. Rows carrying a Linked_Bug, with their TC_ID and bug id.
8. Confirm the file parses cleanly as RFC-4180 (no ragged rows).

Then paste the first 3 data rows in full so I can eyeball the quoting and \n handling.
Report and stop.
```

**Produced:** Row counts, header byte-check, missing-reason check, duplicate-id check, orphan-story check reported.

**Improved prompt:**

```
Before I sign off G3, run these checks on the CSV and report the raw numbers:

1. Data rows; header byte-compared with CLAUDE.md §6.
2. valid in scope Yes/No; needs automation Yes/No; automation_wave W1/W2.
3. Rows with a "No" and an empty reason; rows with "Yes" and no Automation_ID; duplicate TC_IDs. Expect zero each.
4. Story_ID values that are not US ids in spec.md (orphans). Expect zero.
5. P0 rows not in W1. Expect zero.
6. W1 size against capacity: W1 count × average minutes per test, compared with the time for 3 consecutive green runs.
7. Rows with a Linked_Bug, with TC_ID and bug id.
8. RFC-4180 parse: ragged rows. Expect zero.

Then paste the first 3 data rows in full so I can check quoting. Report and stop.
```

**What the improvement fixes:** Checked structure but not whether the automation set was executable within the gate budget; that surfaced only through the separate count request (#25) and the restructure (#26).

---
### #25 — 2026-09-23T15:14:23Z — Gate G3

**Purpose:** Request the exact scope/automation counts by sub-module

```
One number before I sign off: report the exact counts —
valid in scope Yes / No, and needs automation Yes / No.
Then the breakdown of needs automation = Yes by sub-module (USR, JOB, ORG, QUA, NAT,
BRD, CFG, NAV). Just the numbers.
```

**Produced:** valid-in-scope and needs-automation breakdown reported.

**Improved prompt:**

```
Report the exact counts: valid in scope Yes / No, needs automation Yes / No, and needs automation = Yes by sub-module (USR, JOB, ORG, QUA, NAT, BRD, CFG, NAV). Also state whether the Yes count fits the G5 run budget. Just the numbers.
```

**What the improvement fixes:** No downstream problem; this is the question that exposed the 136. It is folded into #24's improved checks.

---
### #26 — 2026-09-23T15:24:29Z — Gate G3

**Purpose:** The W1/W2 restructure prompt: split needs-automation into two scheduled waves instead of cutting scope

```
Do not sign off G3 yet — 136 automation candidates is not executable within this cycle.
A full suite run against the shared demo at workers=2 takes roughly 40-60 minutes, and
G5 requires 3 consecutive green runs after every healing cycle. Restructure, don't cut.

## Task: split needs automation into two waves, in the CSV itself

Add ONE new column at the end: `automation_wave` with values W1 / W2 / (empty for No).
Do not change the `needs automation` values — every current Yes stays Yes. The assignment
requires scripts for the needs-automation set, and W2 remains part of that set, scheduled
rather than dropped.

### Wave 1 — build now, target 45-55 cases
Select by these rules, in order:
1. Every P0 case.
2. For the five Qualifications screens (Skills, Education, Licenses, Languages,
   Memberships): they share one CRUD contract. Put ONE screen's full CRUD set in W1 as the
   reference implementation, and the equivalent cases for the other four screens in W2 —
   they will be driven by the same page object and a data-driven loop, so W2 becomes
   parameters, not new code.
3. Same rule for the five Job screens (Job Titles, Pay Grades, Employment Status,
   Job Categories, Work Shifts): one full reference implementation in W1.
4. Keep in W1: login and navigation happy paths, the two known-defect cases carrying
   Linked_Bug, and at least one negative and one boundary case per sub-module.
5. Anything M2 flagged as slow, fragile, or upload/file-dialog heavy goes to W2.

### Wave 2 — everything else
Mostly the parameterised siblings of W1 cases. Add a short note per W2 row saying which
W1 Automation_ID it reuses, so M5 can implement it as extra data rather than extra code.

## Then report
- W1 and W2 counts, and W1 broken down by sub-module
- How many W2 cases are pure parameter variants of a W1 case (the reuse ratio)
- Confirm every needs automation = Yes still has a wave assigned and an Automation_ID
- Confirm no valid in scope or needs automation value changed

Then update deliverables/03-test-design/test_design_coverage.md with a short
"Execution sequencing" section explaining the two-wave decision and why W2 is scheduled
rather than descoped.

Report and stop at G3.
```

**Produced:** New automation_wave column (W1/W2); Wave 1 selection rule applied; test_design_coverage.md's "Execution sequencing" section added.

**Improved prompt:**

```
Do not sign off G3 yet: 136 automation candidates cannot be built and verified in this cycle (a full run takes 40–60 minutes; G5 needs 3 consecutive green runs after every healing cycle). Restructure, don't cut.

Add automation_wave (W1 / W2 / blank for No) at the end. No "needs automation" value changes.

Wave 1, target 45–55, selected in order:
1. Every P0 case. This is a standing invariant, not a one-off selection: whenever a Priority changes later, every P0 row must still be W1, and promoting a case to P0 includes automating it.
2. One full reference CRUD set per repeated family (Qualifications: one of five screens; Job: one of five); the siblings go to W2.
3. Login/navigation happy paths, every Linked_Bug case, and one negative and one boundary case per sub-module.
4. Anything M2 flagged as slow, fragile or file-dialog heavy goes to W2.
Each W2 row notes which W1 Automation_ID it reuses.

Report W1/W2 counts, W1 by sub-module, the reuse ratio with today's date (it changes as rows move), and confirm every Yes has a wave and an Automation_ID. Add an "Execution sequencing" section to test_design_coverage.md, including the P0 invariant. Stop at G3.
```

**What the improvement fixes:** Applied "every P0 case" once, at selection time, instead of as a standing rule; when priorities were revised after G5, 5 P0 cases, including the BUG-003 guard, were found still in Wave 2 (test_design_coverage.md §8.5, commit c81f972).

---
### #27 — 2026-09-23T15:40:33Z — Gate G3

**Purpose:** Enforce that /coverage actually runs as a real audit, not just a wave-split report

```
One thing left before G3. You flagged it yourself: /coverage has not actually run.

Read .claude/commands/coverage.md and execute it in full against
deliverables/03-test-design/test_design.csv .

It must do the real audit, not just report the wave split:
- structural validation (header byte-exact, no duplicate TC_ID, RFC-4180 parse,
  every No has a reason, every needs automation = Yes has an Automation_ID)
- forward matrix Story -> TC_IDs, with each story classified Full / Partial / None
- reverse matrix TC_ID -> Story, flagging orphan cases with no story
- the per-CRUD-screen depth check: create, mandatory-empty, duplicate, boundary length,
  edit, delete-confirm, delete-cancel, search match, search no-match, reset, pagination —
  report any missing cell per screen
- headline metrics: story coverage %, scenario coverage %, automation coverage %

Write the full audit into deliverables/03-test-design/test_design_coverage.md, keeping
the existing "Execution sequencing" section. Replace the note saying the audit had not
been run.

Fix every gap it finds by adding the missing cases (assign them TC_IDs, wave, and
Automation_ID per the same rules), then re-run /coverage until it reports no unjustified
gaps.

Per the command's own rule: fail loudly. Partial is never reported as Full. If a gap is
genuinely justified, say why in the row rather than closing it silently.

Report the audit verdict, the number of cases added, the three metrics, and the new
total row count. Then stop at G3.
```

**Produced:** test_design_coverage.md — full structural validation, forward/reverse matrices, CRUD depth check, headline metrics; gaps found and closed.

**Improved prompt:**

```
/coverage has not actually run. Read .claude/commands/coverage.md and execute it in full against test_design.csv:
- structural validation (header, duplicates, RFC-4180, reasons, Automation_IDs)
- forward matrix Story → TC_IDs with Full / Partial / None
- reverse matrix TC_ID → Story. Every orphan is a gap to close, never a justified exception: mint the missing story (in prd.md and spec.md, from exploration.md only) or correct the Story_ID
- the per-CRUD-screen depth check (create, mandatory-empty, duplicate, boundary, edit, delete-confirm, delete-cancel, search match, search no-match, reset, pagination)
- story, scenario and automation coverage %

Write it into test_design_coverage.md, keep "Execution sequencing", close every gap, and re-run until nothing unjustified remains. Partial is never reported as Full. Report the verdict, cases added, orphans (must be 0), the three metrics and the row count. Stop at G3.
```

**What the improvement fixes:** Let orphans be "justified", so the two LDAP rows tracing to FIND-005 passed G3 and stayed orphans until US-07-08 (commit 23c3cd9).

---

## M4 — Execution & Reporting

### #28 — 2026-09-23T16:06:05Z — Gate G3→G4 `[partial]`

**Purpose:** Milestone 4 kickoff: the manual execution rules (zero assumptions, uncertainty handling, defect discipline)

```
Gate G3 approved. Begin Milestone 4.

# MILESTONE 4 — Manual UI Execution & HTML Bug Report

## Scope
Execute ONLY rows where `valid in scope = Yes` (186 cases), manually through the UI.
Ignore automation_wave — that governs M5.

## Inputs
test_design.csv · prd.md · exploration.md · CLAUDE.md sections 5 and 6 · constitution.md

## Output
deliverables/04-execution/agent_execution_report.html — single self-contained file,
inline CSS/JS, no CDN. Evidence in deliverables/04-execution/evidence/ .

## RULE 1 — ZERO ASSUMPTIONS, ZERO INVENTION
This overrides everything else in this prompt.

- Record only what you actually observe on screen. Never infer an outcome from how the
  feature "should" work or from how it behaved on a similar screen.
- Never invent: message wording, field limits, record counts, timings, or behaviour you
  did not see. Quote observed text verbatim.
- Never mark a case Pass because it "probably" passes. If you could not complete it,
  it is Blocked with the reason.
- If the UI does something you do not understand, that is an OBSERVATION to record, not
  a gap to fill with a guess.
- Never edit Expected_Result to make a case pass. The CSV came from the PRD and from M2's
  verbatim observations. If a case looks mis-written, mark it Blocked and log it as an
  open question — do not rewrite it.

## RULE 2 — HOW TO HANDLE UNCERTAINTY (read this carefully)
You will hit ambiguous cases. Do NOT stop and ask me each time — with 186 cases that would
stall the milestone. Instead:

For each uncertainty, record a row in an OPEN QUESTIONS register with:
  OQ id · TC_ID · what was ambiguous · what you observed · the two or more readings ·
  which reading you provisionally applied, and why · what would settle it
Mark the case status as Blocked or Pass/Fail-provisional accordingly, and flag it in the
report so nothing ambiguous is buried as a clean result.

Then bring me the whole register in one batch when the milestone ends. I will rule on all
of them at once and you will apply the rulings.

STOP AND ASK IMMEDIATELY — before acting — only for these:
  a) an action that could damage the shared demo or affect other users (anything touching
     the Admin account, Modules toggles, Maintenance Purge, global config, or deleting a
     record you did not create)
  b) anything that would require violating the constitution to proceed
  c) a case that cannot be executed without changing test data or expectations in a way
     that alters what is being verified
  d) the demo being down, reset, or behaving so differently from M2 that the CSV's
     premises no longer hold

## RULE 3 — DEFECT DISCIPLINE
Finding real bugs IS the deliverable. The demo has genuine defects.

1. Any divergence between Expected_Result and actual behaviour is a DEFECT — never
   "the test case needs adjusting".
2. Every Fail raises BUG-nnn with: title, severity (Critical/High/Medium/Low) justified by
   user impact, sub-module, preconditions, numbered steps, expected, actual, screenshot,
   and reproducibility as x/3 attempts.
3. Continue numbering from exploration.md. Before raising a new bug, check it is not the
   same defect as an existing one — link rather than duplicate.
4. Cases carrying Linked_Bug (BUG-001, BUG-002) assert ACTUAL buggy behaviour. If they
   behave as recorded, they PASS; the defect is still reported in the bug section. If they
   now behave differently, raise that as a change.
5. Back-propagate every new bug into exploration.md so the register stays single-source.
6. Inconsistent failures go in the flakiness appendix with their attempt pattern, not in
   the bug register.
7. Do not pad. One honest bug with evidence beats
```

**Produced:** The M4 execution brief that Milestone 4 ran under.

**Notes:** [partial] — the recovered message cuts off mid-sentence at the end of Rule 3 ("One honest bug with evidence beats…"). Rule 4 (reusable HTML-report output) and the session-management section are known to have existed (see #29's "All Rules from the M4 prompt remain in force", which references Rule 4 directly) but are not recoverable from this transcript entry.

**Improved prompt:**

```
Gate G3 approved. Begin Milestone 4.

# MILESTONE 4 — Manual UI Execution & HTML Report

Scope, inputs, output and Rules 1–3: as in the original M4 brief. The additions below are binding.

## Execution mode — read first
Strictly sequential: one agent, one browser, no concurrent batches, at any point. The demo and the browser are shared state; parallel batches corrupt each other's results.

## Checkpointing
Create deliverables/04-execution/PROGRESS.md before the first case. After EVERY case, append its result (TC_ID, status, verbatim actual, evidence) to the batch's results file and update PROGRESS.md with the next TC_ID. Nothing is held only in context.

## Evidence field
Each case's evidence is one of: a file path under evidence/, or exactly one of these reasons — "Not required (Pass, no defect)", "Not applicable (Blocked before observation)", "Not captured — <why>". Screenshots are required for every Fail and every defect, including a defect found during a passing case.

## Known defects
Cases with a Linked_Bug assert the actual buggy behaviour and PASS if it still behaves as recorded; the defect stays in the bug section. A new bug found on a case gets that case's Linked_Bug in the CSV.

## RULE 4 — Reusable output
The HTML report is a template plus a separate data object; no module names, counts, filter options or bug ids hardcoded in the markup.

Start with a damage check of any screen a previous attempt touched, then NAV_001.
```

**What the improvement fixes:** Did not forbid concurrent agents or require checkpointing, so the first attempt ran two batches that collided on one shared browser and had to be discarded (#29); it also left the evidence field free-form, so 17 cells hold the text "Not required" where a file is expected (test_cases_manual_vs_automation.xlsx).

---
### #29 — 2026-09-23T20:12:35Z — Gate G3→G4

**Purpose:** Resume prompt after a session limit: M4 restarted from scratch after a two-batch concurrency collision

```
Resume Milestone 4.

Context: M1-M3 signed off. test_design.csv has 203 rows, 186 valid in scope = Yes.
The previous M4 attempt ran two concurrent batches, they collided on the single shared
Playwright browser, Batch 2 was killed mid delete-confirmation, and the session limit hit
before any damage check or test execution completed. Treat M4 as NOT STARTED.

Read CLAUDE.md, .specify/memory/constitution.md, deliverables/03-test-design/test_design.csv,
deliverables/02-exploration/exploration.md.

## STEP 1 — Damage check (do this before any test case)
The earlier run was killed mid delete-confirmation on the shared demo. Verify nothing was
deleted that we did not create:
- Visit the screens that run had reached and confirm record counts and contents look intact
- Confirm no non-e2e_ record appears to be missing
- Confirm no leftover e2e_ records from that run remain; delete any you find
If you cannot rule out a deletion, say so plainly and name the screen. Do not reassure me
on an assumption.
Report this before executing anything.

## STEP 2 — Execution mode
Strictly sequential. One agent, one browser, no concurrency at any point in M4 or M5.
Work in sub-module order: NAV, USR, JOB, ORG, QUA, NAT, BRD, CFG.

## STEP 3 — Execute
All 186 `valid in scope = Yes` cases, manually through the UI. We have time; do this
properly rather than sampling.

All Rules from the M4 prompt remain in force:

RULE 1 — ZERO ASSUMPTIONS. Record only what you actually observe. Never invent message
wording, limits, counts or behaviour. Never mark Pass because it "probably" passes —
if you could not complete it, it is Blocked with the reason. Never edit Expected_Result
to make a case pass.

RULE 2 — UNCERTAINTY. Do not stop and ask on each ambiguity. Log it in an Open Questions
register (OQ id, TC_ID, what was ambiguous, what you observed, the competing readings,
which you provisionally applied and why, what would settle it) and continue. Bring me the
whole register at the end. STOP AND ASK IMMEDIATELY only for: an action that could damage
the shared demo or affect other users; anything requiring a constitution violation; a case
that cannot run without altering what is being verified; or the demo being down or reset.

RULE 3 — DEFECT DISCIPLINE. Any divergence from Expected_Result is a DEFECT, never "the
case needs adjusting". Every Fail raises BUG-nnn with title, severity justified by user
impact, sub-module, preconditions, numbered steps, expected, actual, screenshot, and x/3
reproducibility. Continue numbering from exploration.md; link rather than duplicate.
Cases carrying Linked_Bug assert actual buggy behaviour — they PASS if they behave as
recorded, and the defect still appears in the bug section. Back-propagate every new bug
into exploration.md. Inconsistent failures go to the flakiness appendix, not the bug
register. Do not pad.

RULE 4 — REUSABLE OUTPUT. The HTML report must be a template plus a separate data object,
not markup with results baked in. No hardcoded "Admin", sub-module names, counts or bug
ids in the layout, headings, filters or CSS — filters and headings derive from the data.
State at the end exactly what a future module would need to change to reuse it.

## Concurrent users
Another real user ("manda user") was observed on the shared demo during the earlier
attempt. Record counts and list contents can change under you at any time. Never assert on
a record you did not create in that same case. If a failure could be caused by concurrent
mutation, retry once; if it then passes, log it in the flakiness appendix rather than
raising a bug. Add an environment note recording that concurrent third-party activity was
observed.

## Safety
Constitution VI: e2e_ prefix with a unique suffix, clean up what you create, never delete
records you did not create, never touch the Admin account, Modules toggles or Maintenance
Purge.

## Output
deliverables/04-execution/agent_execution_report.html — single self-contained file, inline
CSS/JS, no CDN, opens offline. Evidence in deliverables/04-execution/evidence/ .
Sections: run metadata · executive summary with donut · filterable results table · bug
cards · traceability matrix · Open Questions register · flakiness appendix.

## Session management
This will span multiple sessions. At the end of each sub-module:
1. Write results so far into the report — never hold results only in context
2. Append a progress line to deliverables/04-execution/PROGRESS.md recording the last
   TC_ID completed, the sub-module, cumulative pass/fail/blocked counts, and the next
   TC_ID to run
3. If you are near a session limit, stop cleanly at that boundary and tell me exactly
   where you stopped

That PROGRESS.md file is how we resume without losing work. Create it now, before STEP 1.

Start with STEP 1 and report the damage check before executing any case.
```

**Produced:** A damage-check-first restart of M4, PROGRESS.md created as the resume mechanism, execution restarted at TC_ADM_NAV_001.

**Improved prompt:**

```
Resume Milestone 4. Treat it as NOT STARTED: the previous attempt ran two concurrent batches that collided on the shared browser.

Read CLAUDE.md, the constitution, test_design.csv and exploration.md.

STEP 1 — Damage check before any case: visit every screen that run reached; confirm no non-e2e_ record is missing and delete leftover e2e_ records. If you cannot rule out a deletion, name the screen. Report this first.
STEP 2 — Execution mode: strictly sequential, one agent, one browser, for the rest of M4 and all of M5.
STEP 3 — Execute all 186 valid-in-scope cases in order NAV, USR, JOB, ORG, QUA, NAT, BRD, CFG. Rules 1–4 remain in force.

Concurrent users: another real user is active on the demo. Never assert on a record you did not create in the same case; if a failure could be concurrent mutation, retry once and log it as flakiness if it then passes.

Checkpointing: after EVERY case, write its result to the batch results file and update PROGRESS.md (last TC_ID, cumulative pass/fail/blocked, next TC_ID). If a batch ends without its results on disk, its work counts as not executed. Near a session limit, stop at a case boundary and say where.

Create PROGRESS.md now, then report the damage check.
```

**What the improvement fixes:** Required results to be written at the end of each sub-module, not after each case; the Branding/Configuration batch was later killed mid-sub-module having written nothing, and all 22 of its cases had to be re-run (M4 PROGRESS, 2026-09-24 11:00).

---
### #30 — 2026-09-23T21:28:33Z — Gate G3→G4

**Purpose:** Resume prompt: continue M4 from the last completed TC_ID

```
Resume M4. Read deliverables/04-execution/PROGRESS.md and continue sequentially from the
next TC_ID recorded there. All Rules 1-4 remain in force.
```

**Produced:** M4 execution continued from PROGRESS.md's recorded checkpoint.

**Improved prompt:**

```
Resume M4. Do NOT re-execute any case that already has a recorded result.

1. Read deliverables/04-execution/PROGRESS.md and the batch result files. Report in two lines: cases completed so far and the next TC_ID.
2. If the previous session ended in the middle of a case, run a damage check of that screen first (no non-owned record missing, no leftover e2e_ data).
3. Continue sequentially from the next TC_ID, one browser. Rules 1–4 remain in force.
```

**What the improvement fixes:** Said "continue" but not "do not re-execute completed cases" or "reconcile state first"; the next resume (#31) had to add both.

---
### #31 — 2026-09-24T11:00:33Z — Gate G3→G4

**Purpose:** Resume prompt after another session boundary

```
Resume M4. Do NOT re-execute anything already completed.

Read deliverables/04-execution/PROGRESS.md, take the "next TC_ID" recorded there, and
continue from that case forward. Every case already marked with a result stays as is.

Just tell me the count completed so far and the next TC_ID, then keep going.
All Rules 1-4 remain in force.
```

**Produced:** M4 execution continued without re-running completed cases.

**Improved prompt:**

```
Resume M4. Do NOT re-execute anything already completed.

1. Read PROGRESS.md and every batch results file. Any batch that has no results file on disk counts as not executed, however far it got; its cases run again from the start.
2. Damage check every screen that batch could have touched, verified live rather than assumed: for global screens (Corporate Branding, Email Configuration, Localization, Modules) confirm the saved state is still the default.
3. Report the count completed and the next TC_ID, then continue sequentially, one browser. Rules 1–4 remain in force.
```

**What the improvement fixes:** Did not ask for a damage check or say how to treat a batch that left no results; the lost Branding/Configuration batch was handled correctly only because the agent chose to (M4 PROGRESS, 2026-09-24 11:00).

---
### #32 — 2026-09-24T11:40:53Z — Gate G4

**Purpose:** Post-execution cleanup: assign final BUG-nnn numbers, formalize FIND-008, build the HTML report, and flag the CFG_003/004 question for a ruling

```
Go ahead with items 2-4 now.

2. Assign final BUG-nnn numbers to all 5 NEWBUG-* findings, continuing the numbering from
   exploration.md, and back-propagate each into exploration.md per Rule 3.5. Before
   assigning, check each against the existing register so we link rather than duplicate.

3. OQ-BRDCFG-2 (Social Media Authentication Provider URL has no format validation):
   formalize it as FIND-008. It is the same class as FIND-006, it was directly observed,
   and a narrative-only note would be lost when the report is read on its own. Keep it as
   a finding, not a bug — no requirement in prd.md asserts that validation exists.

4. Build agent_execution_report.html per Rule 4: template plus a separate data object,
   no hardcoded module names, counts, filter options or bug ids in the markup. Assemble it
   from all batch result files plus PROGRESS.md. It must open offline with zero network
   requests.

On CFG_003/004: restate the decision you need from me in full — the TC_IDs, what each case
expects, what you actually observed, the competing readings, and which you would apply.
Your earlier message was cut off on my side and I will not rule on it blind.

Also report, alongside the above: total executed of 186, pass/fail/blocked counts, and the
full Open Questions register so I can rule on everything in one pass.
```

**Produced:** BUG-003..006 numbered and back-propagated; FIND-008 formalized; agent_execution_report.html built as template + data object.

**Improved prompt:**

```
Go ahead with items 2–4.

2. Assign final BUG-nnn numbers to the 5 NEWBUG findings, continuing from exploration.md, checking each against the register to link rather than duplicate, and back-propagate each into exploration.md. For each new bug, set Linked_Bug on the case that found it in test_design.csv, including a defect found during a passing case; if a bug has no covering case, propose one.
3. Formalise OQ-BRDCFG-2 as FIND-008 (same class as FIND-006; a finding, not a bug).
4. Build agent_execution_report.html per Rule 4 from the batch result files plus PROGRESS.md; it must open offline with zero network requests.

On CFG_003/004, restate the decision you need in full: TC_IDs, what each expects, what you observed, the competing readings, and your recommendation.

Also report executed of 186, pass/fail/blocked, and the full Open Questions register.
```

**What the improvement fixes:** Numbered the new bugs but did not ask for them to be linked back into test_design.csv; BUG-004, BUG-005 and BUG-006 still have no Linked_Bug row (challenges_and_resolutions.xlsx, Defect sheet).

---
### #33 — 2026-09-24T12:03:39Z — Gate G4

**Purpose:** The CFG_003/004 ruling: accept both as permanently Blocked, with the exact environment-constraint wording to record

```
Ruling on CFG_003/004: accept both as permanently Blocked for this cycle. Do not seek or
grant a permission escalation.

Record this reason in the report: "Environment constraint: Save on a global-config screen
would risk persisting state on a shared public instance (Constitution VI.3). CFG_004 in
particular types a non-numeric value into SMTP Port, and FIND-006 establishes there is no
format validation there — Save would likely persist a broken email configuration. Same
class as the Modules toggles already marked valid in scope = No in M3. Executable on a
private instance." Note it as an environment limitation, not a coverage gap.

Not attempting a workaround was correct. Never route around a tool-level denial in this
project.

OQ resolutions all confirmed as stated.

Now finalize G4 in one pass — do all of this without stopping to ask:

1. BUG-005 and BUG-006 were raised but only 2 cases Failed. For each, state in one line
   which TC_ID covers that behaviour and what result it got. If a case covers it and
   passed, quote its Expected_Result and say why it passed despite the defect. If no case
   covers it, say "incidental discovery, no case exists" and propose the TC_ID and title
   that should. Change no results to fit.

2. Apply the CFG ruling text to the report.

3. Confirm exploration.md carries all 6 bugs and 8 findings with M4 provenance marked.

4. Report final tallies: executed / pass / fail / blocked, bugs by severity, and confirm
   the report opens offline.

Then stop at G4.
```

**Produced:** CFG_003/CFG_004 marked Blocked with the ruling text recorded in the report; BUG-005/006 TC_ID mapping resolved; final tallies confirmed.

**Improved prompt:**

```
Ruling on CFG_003/004: accept both as permanently Blocked for this cycle; no permission escalation. Record in the report: "Environment constraint: Save on a global-config screen would risk persisting state on a shared public instance (Constitution VI.3). CFG_004 types a non-numeric value into SMTP Port, and FIND-006 shows there is no format validation there. Executable on a private instance." It is an environment limitation, not a coverage gap. Never route around a tool-level denial.

Make the standing rules durable: add to CLAUDE.md (and the constitution changelog) the two rules this milestone has relied on but never written down — (1) never route around a tool-level denial; (2) the known-defect guard: a case with a Linked_Bug asserts the actual behaviour and passes while the bug exists. Cite them by their new section numbers from now on.

Then finalise G4 in one pass: map BUG-005/006 to their covering TC_ID and result (or "incidental discovery, no case exists" plus a proposed case), apply the ruling text, confirm exploration.md carries all bugs and findings with M4 provenance, and report the final tallies. Stop at G4.
```

**What the improvement fixes:** Rulings lived only in prompts: the known-defect-guard practice from #28 Rule 3.4 was never written into CLAUDE.md, so later artifacts justified it by citing a "CLAUDE.md §6.4" that does not exist (challenges_and_resolutions.xlsx, CH-37).

---

## M4 → M5 — Gate G4 / Milestone 5 Kickoff

### #34 — 2026-09-24T12:18:18Z — Gate G4

**Purpose:** Gate G4 approval and the Milestone 5 kickoff (full build-order brief: foundation → page objects/tests → review/run/heal)

```
Gate G4 approved. Begin Milestone 5.

Note: your BUG-005/006 answer was truncated on my side. Restate it in ONE line each at the
start of your next reply (which TC_ID covers it and what result it got, or "incidental
discovery, no case exists"), then carry on with M5 — do not stop for my response on it.

# MILESTONE 5 — Playwright Automation & Self-Healing

## Scope of this build
Implement automation_wave = W1 only (47 cases). W2 stays in the CSV as needs automation =
Yes and is implemented as data on the same page objects if time allows — it is scheduled,
not descoped.

## Execution mode
Strictly sequential. One browser, no concurrent agents, at any point in this milestone.

## Inputs
test_design.csv (W1 rows) · exploration.md (locator risk register — this is your locator
source of truth, it holds the real class names observed on build 5.9) · CLAUDE.md sections
4 and 5 · constitution.md Article III and IV · plan.md

## Build order — do not deviate
Components exist before page objects. Page objects exist before tests.

### Phase 1 — foundation
1. src/utils/fieldFactory.ts — label-anchored resolution (`field`, `dropdown`,
   `autocomplete`), plus waitForIdle()
2. src/components/ — OxdDropdown, OxdAutocomplete, OxdToast, OxdTable, OxdDialog,
   OxdCheckbox, OxdDatePicker, OxdFileUpload. These are the ONLY place raw oxd- selectors
   may appear. Build them from the observed class names in exploration.md, not from the
   predictions in CLAUDE.md section 5.2 — where they differ, the observation wins, and say
   so in a comment.
3. src/pages/base/BasePage.ts + LoginPage.ts
4. src/fixtures/ — auth (worker-scoped, real UI login, re-auth once on redirect to
   /auth/login), page (navigates, normalises sidebar to expanded), data (creates
   e2e_-prefixed entities, guarantees teardown in reverse order even on failure)
5. playwright.config.ts — workers 2, retries 1, timeout 90s, expect 10s, action 15s,
   navigation 30s, trace on-first-retry, video retain-on-failure, screenshot
   only-on-failure, baseURL set. No networkidle anywhere.

Report at the end of Phase 1 and stop for my go-ahead before Phase 2.

### Phase 2 — page objects and tests
6. src/pages/admin/ — one page object per screen. Behaviour methods only, zero assertions,
   zero raw oxd- selectors.
7. tests/admin/ — one test per W1 TC_ID. Test title starts with its Automation_ID.
   Assertions live here, and use the VERBATIM message wording recorded in exploration.md
   and in the CSV's Expected_Result. Never paraphrase an observed string.

### Phase 3 — review, run, heal
8. Run /code-review. Fix every Blocker and Major before running the suite.
9. Run the suite. Triage every failure with /heal.
10. Achieve 3 consecutive full green runs.

## Known defects — binding
Cases carrying Linked_Bug assert the ACTUAL observed behaviour, including BUG-001
(Nationalities delete silently nulls the employee field) and BUG-002. Never write the
desired-but-absent behaviour as the expectation. Never "fix" a PRODUCT_BUG failure — file
it, test.fixme() with the bug id, and report it as a product failure.

## Module-agnostic requirement
Nothing under src/utils, src/components, src/fixtures or src/pages/base may mention Admin
or any Admin screen. Swapping modules must require only new pages and new tests. If you
find yourself wanting an Admin-specific constant in a shared file, that is a framework gap
— solve it generically and say so.

## Shared-demo safety
Constitution VI: e2e_ prefix with unique suffix, UI-driven teardown, never delete records
you did not create, never touch the Admin account, Modules toggles or Maintenance Purge.
Another real user was observed on the demo during M4 — never assert on a record the test
did not create in that same test.

## Zero assumptions still applies
If a locator or a message string is not recorded in exploration.md, do not invent it.
Open the screen, observe it, and record what you used. Never write an assertion against a
string you have not seen.

## Session management
Append progress to deliverables/05-automation/PROGRESS.md after each phase and after each
page object: what was built, what runs green, what is next. Stop cleanly at a phase or
file boundary if you approach a session limit and say exactly where you stopped.

Start with Phase 1. Report when the foundation is built and stop before Phase 2.
```

**Produced:** M5 scope fixed to Wave 1 (47 cases); Phase 1/2/3 build order specified.

**Improved prompt:**

```
Gate G4 approved. Begin Milestone 5.

# MILESTONE 5 — Playwright Automation & Self-Healing

Scope (W1 only; W2 scheduled, not descoped), execution mode (strictly sequential, one browser), inputs, build order (Phases 1–3), module-agnostic requirement, shared-demo safety and zero-assumption rules: as in the original M5 brief. The changes below are binding.

## Before Phase 2 — fix the build list
Derive the W1 list per screen from test_design.csv, sum it, and confirm it equals the W1 total. Build from that list, and at the end of Phase 2 run a set difference between W1 Automation_IDs and test titles; both directions must be empty.

## Known defects — one rule
A case with a Linked_Bug asserts the product's ACTUAL behaviour, labelled KNOWN DEFECT with the bug id, and passes while the bug exists (CLAUDE.md §5.4 as amended). test.fixme() is only for a case that cannot complete a run. Never write the desired-but-absent behaviour as the expectation.

## Runs
Keep the raw output of every official full-suite run under deliverables/05-automation/runs/<date>/ (JSON results, list output, failure screenshots). A test that passes only on retry is a healing candidate, not a pass.

Start with Phase 1 and stop before Phase 2.
```

**What the improvement fixes:** Gave two rules for defects in one paragraph (assert actual behaviour for Linked_Bug cases; test.fixme() for a PRODUCT_BUG failure) without saying which governs a newly found deterministic defect, and it did not ask for the per-screen Wave 1 list to be checked against the 47 total, so 2 cases went unbuilt until #38 (TC_ADM_JOB_023, TC_ADM_JOB_049).

---

## M5 — Automation

### #35 — 2026-09-24T13:49:41Z — Gate G4

**Purpose:** Phase 1 approval plus two required fixes (reconcile plan.md, remove the hardcoded "Admin" credential) before Phase 2 begins

```
Phase 1 approved. Two fixes first, then Phase 2.

## Fix 1 — reconcile plan.md
You flagged it correctly: plan.md is still the pre-G2 version (root pages/, old TC naming).
Leaving it stale means the next module's cycle reads a document that contradicts the
working layout. Update it in place to match what actually got built:
- src/ layout as implemented
- the component inventory you actually created, including OxdRadioGroup which was not in
  the original plan
- chromium-only, with your reason recorded (no other browser was observed in M2 or M4)
- the waitForIdle timeout decision and why a longer element-state timeout was the correct
  fix rather than a sleep
Do not weaken any standard. Report what changed.

## Fix 2 — the 'Admin' hit
Move the default username out of the shared code entirely. A credential is configuration,
not framework. Read it from env with a fallback (e.g. process.env.ORANGEHRM_USER) so
grep -rn "Admin" src/utils src/components src/fixtures src/pages/base returns zero.

## Then Phase 2 — page objects and tests

Build order: all W1 page objects first, then the tests.

### Page objects — src/pages/admin/
One per screen. Behaviour methods only (createUser, searchByUsername, deleteByName),
zero expect, zero raw oxd- selectors — every control goes through a component wrapper.
Locators are readonly lazy fields, never resolved in the constructor. A page object may
return another page object; it never imports a test or a fixture.

### Tests — tests/admin/
One test per W1 TC_ID (47). Title starts with the Automation_ID, e.g.
test('TC_ADM_USR_001 - add a valid ESS system user', ...).

Binding rules:
- Assertions use the VERBATIM strings recorded in exploration.md and the CSV's
  Expected_Result. Never paraphrase an observed message. If a string is not recorded
  anywhere, open the screen, observe it, record it in PROGRESS.md, then assert it — do
  not invent it.
- Cases carrying Linked_Bug assert the ACTUAL buggy behaviour (BUG-001 through BUG-006).
  Never write the desired-but-absent behaviour as the expectation.
- Every test creates its own e2e_-prefixed data through the data fixture and depends on
  no seeded record. Another real user is active on this demo — never assert on a record
  the test did not create in that same test.
- Banned: waitForTimeout, networkidle, .first() to dodge strict mode, conditional
  assertions, try/catch that swallows a failure, positional XPath.

### Sequencing
Build in this order and append to PROGRESS.md after each screen's page object + its tests:
USR, JOB, QUA, NAT, ORG, BRD, CFG, NAV.

Run each screen's tests as you finish it rather than saving all 47 to the end — a failure
found now is cheaper than a failure found across eight screens at once. Strictly
sequential, one browser, no concurrent agents.

Do not start Phase 3 (/code-review, full runs, /heal) — stop at the end of Phase 2 and
report: files created, tests passing per screen, any locator that differed from
exploration.md's register, and anything you had to observe live because it was not
recorded.

Stop cleanly at a screen boundary if you approach a session limit.
```

**Produced:** plan.md reconciled to the as-built src/ layout; ORANGEHRM_USER moved to env config.

**Improved prompt:**

```
Phase 1 approved. Two fixes, then Phase 2.

Fix 1 — reconcile plan.md in place with what was built (src/ layout, the actual component inventory including OxdRadioGroup, chromium-only with the reason, the waitForIdle timeout decision). Weaken no standard.
Fix 2 — move the default username out of shared code into env config with a fallback, so grep -rn "Admin" in src/utils, src/components, src/fixtures and src/pages/base returns nothing.

Phase 2 — page objects then tests, screen by screen (USR, JOB, QUA, NAT, ORG, BRD, CFG, NAV). Before starting, list each screen's W1 TC_IDs from the CSV and confirm the sum is 47.
- Page objects: behaviour only, zero expect, zero raw oxd- selectors, readonly lazy locators.
- Tests: one per W1 TC_ID, title starts with the Automation_ID; assertions use verbatim strings from exploration.md or the CSV. If a string is not recorded (for example a toast for an operation M2 did not exercise), observe it live, record it in PROGRESS.md, then assert it.
- Cases whose CSV row carries a Linked_Bug (check the CSV; do not assume which) assert the actual behaviour.
- Banned: waitForTimeout, networkidle, .first() to silence strict mode, conditional assertions, swallowed errors, positional XPath, "text is not empty" assertions.
Run each screen's tests as you finish it; append to PROGRESS.md after each screen. At the end, run the W1-vs-tests set difference and report it. Do not start Phase 3.
```

**What the improvement fixes:** Said Linked_Bug cases covered "BUG-001 through BUG-006", but only BUG-001 and BUG-002 carried a Linked_Bug then; and it asked for no per-screen count check, so the 45-of-47 gap survived Phase 2.

---
### #36 — 2026-09-24T19:32:23Z — Gate G4

**Purpose:** Resume prompt after a session limit: take stock of Phase 2 before continuing

```
Resume Phase 2 of Milestone 5. Do NOT rebuild or re-create anything that already exists.

First, take stock before writing any code:
1. Read deliverables/05-automation/PROGRESS.md
2. List what actually exists on disk: src/pages/admin/ and tests/admin/
3. Report in a short table: which screens have a page object, which have tests, and which
   tests have been run green so far

Then continue from exactly where that leaves off. If a file was left half-written when the
session cut, finish that file rather than starting it over.

All Phase 2 rules remain in force:
- Page objects: behaviour only, zero expect, zero raw oxd- selectors, readonly lazy locators
- Tests: one per W1 TC_ID, title starts with the Automation_ID
- Assertions use the VERBATIM strings from exploration.md and the CSV. Never paraphrase an
  observed message. If a string is not recorded, observe it live, record it in PROGRESS.md,
  then assert it — never invent it
- Cases with Linked_Bug assert the ACTUAL buggy behaviour, not the desired behaviour
- Every test creates its own e2e_ data and asserts on nothing it did not create
- Banned: waitForTimeout, networkidle, .first() to dodge strict mode, conditional
  assertions, swallowed failures, positional XPath
- Screen order: USR, JOB, QUA, NAT, ORG, BRD, CFG, NAV
- Run each screen's tests as you finish that screen, before moving to the next
- Append to PROGRESS.md after each screen
- Strictly sequential, one browser

Do not start Phase 3. Stop at the end of Phase 2, or cleanly at a screen boundary if you
approach the limit — and say exactly where you stopped.
```

**Produced:** Phase 2 continued screen-by-screen from its actual on-disk state.

**Improved prompt:**

```
Resume Phase 2 of Milestone 5. Do NOT rebuild or re-create anything that already exists.

Take stock first:
1. Read PROGRESS.md.
2. List what exists in src/pages/admin/ and tests/admin/.
3. Run a set difference between W1 Automation_IDs in test_design.csv and the TC ids in test titles. Report: screens with page objects, tests per screen, which are green, and which W1 ids have no test yet.

Continue from there; finish any half-written file rather than restarting it. All Phase 2 rules remain in force (see #35). Stop at the end of Phase 2 or at a screen boundary, and say where.
```

**What the improvement fixes:** Took stock of what existed but not of what was missing against the Wave 1 list, so the 2 unbuilt cases were not noticed until #38.

---
### #37 — 2026-09-24T20:21:17Z — Gate G4

**Purpose:** Resume prompt after another session boundary (shorter restatement of #36)

```
Resume Phase 2 of Milestone 5. Do NOT rebuild anything that exists.

Read deliverables/05-automation/PROGRESS.md, then list what's actually on disk in
src/pages/admin/ and tests/admin/. Report which screens have page objects, which have
tests, and which tests are green. Continue from there.

All Phase 2 rules stay in force. Screen order: USR, JOB, QUA, NAT, ORG, BRD, CFG, NAV.
Run each screen's tests as you finish it. Append to PROGRESS.md after each screen.
Strictly sequential, one browser. Do not start Phase 3.
```

**Produced:** Phase 2 continued.

**Notes:** Near-duplicate of #36 — sent again after a further session interruption.

**Improved prompt:**

```
Resume Phase 2 of Milestone 5. Do NOT rebuild anything that exists.

Read PROGRESS.md, list what is on disk in src/pages/admin/ and tests/admin/, and run the W1-vs-test-title set difference. Report screens with page objects, tests, green tests, and missing W1 ids. Continue from there under the Phase 2 rules (#35). Strictly sequential, one browser. Do not start Phase 3.
```

**What the improvement fixes:** A near-duplicate of #36 after a further interruption; same gap (no check against the Wave 1 list).

---
### #38 — 2026-09-24T21:58:16Z — Gate G4

**Purpose:** The gap-accounting and back-propagation prompt: account for W1's 45-of-47 shortfall and correct 4 categories of stale information in earlier artifacts

```
Phase 2 looks strong. Two things before Phase 3.

## 1. Account for the gap: W1 is 47, you built 45
Name the 2 missing TC_IDs and their status. If they are TC_ADM_CFG_003/004 (ruled
permanently Blocked in M4 as an environment limitation), that is correct and expected —
but it must be explicit, not implied. For each missing case:
- confirm the TC_ID and why it has no test
- confirm it is recorded as such in PROGRESS.md
- confirm nothing in test_design.csv still claims an Automation_ID that does not exist
Any W1 case dropped for any other reason needs to be named now, not discovered at G5.

## 2. Back-propagate the live corrections
Four observations invalidate what earlier artifacts state. Leaving them stale means the
next module inherits wrong information:

a) exploration.md — add the two newly-discovered oxd components (.oxd-switch-wrapper
   toggle, and the .oxd-tree-node-wrapper/-content/-toggle tree structure) to the locator
   risk register, plus the four locator corrections you listed (icon-glyph accessible
   names, labelledContainer scoping, table header sharing .oxd-table-row, Username search
   being exact-match only). Mark them M5-sourced.

b) test_design.csv — correct the stale Expected_Result wording where you observed
   different strings live:
   - edit-save toasts are "Successfully Updated", not "Successfully Saved" (USR, JOB, QUA)
   - TC_ADM_NAV_008's breadcrumb is two segments
   - BUG-002's current symptom is silent failure with no message
   - Locations' Country field is mandatory
   Quote the verbatim observed string in each corrected cell. Do not change any
   valid in scope or needs automation value.

c) The Username exact-match discovery invalidated the original bulk-delete test design.
   State plainly what you did: was that case rewritten, dropped, or replaced? If its
   design changed, the CSV row must reflect the new design.

d) exploration.md — update BUG-002's entry with the M5 re-observation, same provenance
   treatment as the M4 update.

Report what changed in each file, then stop. Do not start Phase 3 yet.
```

**Produced:** The 2 missing TC_IDs (Pay Grades, Work Shifts) were built to close the gap; exploration.md's locator register and test_design.csv both corrected with live-observed values.

**Improved prompt:**

```
Phase 2 looks strong. Two things before Phase 3.

## 1. Account for the W1 gap
Run a set difference between every automation_wave = W1 Automation_ID in test_design.csv and every TC id referenced in tests/admin/*.spec.ts. Report both directions. For each missing id: why it has no test, and build it unless there is a recorded reason not to. Do not assume which ids they are.

## 2. Back-propagate the live corrections
a) exploration.md — add the newly found oxd components and the M5 locator corrections to the locator register, marked M5-sourced.
b) test_design.csv — sweep EVERY Expected_Result that quotes or implies a message against what you observed live, for every operation (create, edit, delete single, delete bulk), not only the ones already noticed. Quote the verbatim string in each corrected cell. Where a test currently asserts only that a message exists, replace it with the verbatim string. Change no valid in scope or needs automation value.
c) State what happened to the bulk-delete design after the exact-match Username finding; the CSV row must describe the design that was built.
d) exploration.md — update BUG-002 with the M5 re-observation.

Report what changed in each file, then stop.
```

**What the improvement fixes:** Suggested the answer ("if they are TC_ADM_CFG_003/004…") instead of asking for a set difference, and they were JOB_023 and JOB_049; its list of strings to correct also missed the delete toasts, leaving 5 tests asserting only that the toast text was not empty until 2026-09-26.

---
### #39 — 2026-09-25T10:41:30Z — Gate G4→G5

**Purpose:** Resume Milestone 5, begin Phase 3: the full /code-review → 3 runs → /heal → healing_process.md brief

```
Resume Milestone 5 — begin Phase 3.

Context: Phase 1 and 2 are complete. 47/47 W1 tests exist and pass, verified in a combined
run. test_design.csv, exploration.md and PROGRESS.md have been back-propagated with the
live corrections. Do NOT rebuild or re-verify Phase 2 work.

First, confirm state from disk in three lines: file counts in src/pages/admin/ and
tests/admin/, and the last entry in deliverables/05-automation/PROGRESS.md.

Then Phase 3, in this order:

## Step 1 — /code-review
Read .claude/commands/code-review.md and run it in full against everything under src/ and
tests/. Write the findings to deliverables/05-automation/code_review.md.

Pay particular attention to the clauses this build is most likely to have drifted on:
- raw oxd- selectors outside src/components/ (you caught yourself doing this once in
  PayGradesPage — check whether it happened anywhere else)
- any expect or assertion inside a page object
- module-specific knowledge in src/utils, src/components, src/fixtures, src/pages/base
- the forced click in OxdTimePicker and the longer waitForIdle timeout: both were
  deliberate, evidence-backed decisions. Confirm each is documented in the code with its
  reason, so a future reader does not mistake them for shortcuts.
- banned patterns: waitForTimeout, networkidle, .first() to dodge strict mode, conditional
  assertions, swallowed failures, positional XPath

Fix every Blocker and Major before moving on. Report the verdict and what you changed.

## Step 2 — full suite runs
Run the complete 47-test suite three times consecutively, strictly sequential, one browser.
Record each run's result and duration.

A test that only passes on retry is NOT a pass — it is a healing candidate. Report any test
that needed a retry in any of the three runs, even if the run finished green overall.

## Step 3 — /heal on every failure
For each failure, read .claude/commands/heal.md and follow it exactly: capture, reproduce
3x, classify into one root-cause class, diagnose, fix at the lowest correct layer, verify
with 3 consecutive green, log the entry.

Binding: a PRODUCT_BUG is never healed — file it, test.fixme() with the bug id, report it
as a product failure. Forbidden heals: waitForTimeout, timeout inflation without a named
readiness signal, force:true to punch through an overlay, .first() to dodge strict mode,
in-test retry loops, weakening or deleting an assertion.

## Step 4 — healing_process.md
Write deliverables/05-automation/healing_process.md as a real experiment log, not a summary.

It must include every failure encountered across the WHOLE of Milestone 5, not only Phase 3
— including the ones already solved in Phases 1 and 2. Those are the most valuable entries
in the document and they are currently only in PROGRESS.md. At minimum:
- the waitForIdle dashboard-widget timeout (Phase 1)
- the invented openUserMenu selector caught before it ran (Phase 1)
- the unscoped breadcrumb query (Phase 1)
- the positional XPath removed from OxdFileUpload (Phase 1)
- the listContainer fix during USR (Phase 2)
- the labelledContainer scoping fix (Phase 2)
- icon-glyph accessible names breaking exact matching (Phase 2)
- the table header sharing .oxd-table-row (Phase 2)
- Username search being exact-match only, and the USR_022 redesign it forced (Phase 2)
- the OxdTimePicker AM/PM radio inversion (Phase 2)

Each entry in the format from heal.md: id, timestamp, test, symptom, raw error, attempts,
hypothesis, root cause class with the evidence that proves it, fix layer, the change,
verification, prevention rule. Close with the summary table by root-cause class,
quarantined tests, and residual risk.

## Session management
Append to PROGRESS.md after each step. Stop cleanly at a step boundary if you approach the
limit and say exactly where you stopped.

Report at the end: the /code-review verdict, the three run results with durations, every
heal entry by root-cause class, any test left fixme'd with its bug id, and confirmation
that every W1 Automation_ID maps to a passing or explicitly-fixme'd test.

Then stop at Gate G5.
```

**Produced:** code_review.md (APPROVED), 3 official full-suite runs, healing_process.md (22 entries), Gate G5 reached.

**Improved prompt:**

```
Resume Milestone 5 — begin Phase 3. Do NOT rebuild or re-verify Phase 2 work. Confirm state from disk in three lines first.

## Step 1 — /code-review
Run .claude/commands/code-review.md in full, including every search pattern in its "Search patterns" section, over ALL of src/ and tests/ (test files included). Report which patterns were run and every hit with its verdict. Also confirm the deliberate decisions (OxdTimePicker forced click, waitForIdle timeout) are documented in code. Fix every Blocker and Major.

## Step 2 — three consecutive full runs
Strictly sequential, one browser. For each run keep the raw output under deliverables/05-automation/runs/<date-time>/: JSON results, list output, and failure screenshots (test-results/ is overwritten by the next run). Read the raw results, not only the summary: any test that needed a retry is a healing candidate.

## Step 3 — /heal every failure
Follow heal.md exactly. Each healing entry's timestamp and raw error come from the retained run output, cited by path.

## Step 4 — healing_process.md
A full experiment log covering the whole of M5 (Phases 1–3), in heal.md's format, with the root-cause summary, quarantine and residual-risk sections.

Append to PROGRESS.md after each step. Report the review verdict, the three runs with durations and retries, every heal entry, and the W1-vs-tests set difference. Stop at Gate G5.
```

**What the improvement fixes:** Listed what to check but not how, and scoped the raw-selector check by example ("you caught yourself … in PayGradesPage"), so the review searched page objects only and missed test files; it also did not ask for raw run output to be kept, so a healing entry's timestamp later matched no run (HEAL-027, fixed 2026-09-26).

---

## Post-G5 — Final Deliverables

### #40 — 2026-09-25T11:44:11Z — Gate G5

**Purpose:** Final-milestone request: build the two missing assignment deliverables (implementation summary workbook, solution-flow HTML)

```
Gate G5 approved. Milestone 5 is complete.

# FINAL MILESTONE — Deliverables A and B

The assignment lists 7 deliverables (a-g). Five exist. Two do not yet:
  a. an Excel sheet summarising how each milestone was implemented
  b. a flowchart / sequence diagram as an HTML file showing how the reusable solution
     works for each milestone

Build both from what actually happened in this project. Zero invention: every number,
file path and decision must come from the artifacts on disk. If something cannot be
sourced, leave it out rather than estimating.

## Deliverable A — deliverables/00-summary/implementation_summary.xlsx

Read /mnt/skills/public/xlsx/SKILL.md first if available, then build the workbook.

Sheet 1 "Milestone Summary" — one row per milestone M1-M5:
Milestone · Objective · Inputs · Process followed · Output artifact + path · Gate ·
Key decisions taken · Issues encountered and how they were resolved · Evidence of
completion. Write the process column as what was actually done, not as a plan.

Sheet 2 "Artifacts" — every deliverable: name, path, format, milestone, size or row
count, and one line on what it contains.

Sheet 3 "Metrics" — the real figures: 12 modules specified, 33 Admin stories, 203 test
cases, 186 valid in scope, 136 needs automation, W1 47 / W2 89, 186/186 executed,
182 pass / 2 fail / 2 blocked, 6 bugs by severity, 8 findings, 22 healing entries by
root-cause class, 47/47 automated tests green, the three run durations. Pull each from
its source file — do not retype from memory.

Sheet 4 "Defects" — BUG-001 to BUG-006: id, title, sub-module, severity, status,
milestone discovered, linked TC_IDs, and whether it is asserted in automation.

Sheet 5 "Decisions & Deviations" — the judgement calls, each with its rationale:
the two-wave W1/W2 split and why W2 is scheduled not descoped · CFG_003/004 ruled
permanently blocked as an environment limitation · chromium-only and why · the 7 M2
corrections back-propagated into the PRD · the M5 corrections back-propagated into the
CSV · the deliberate UI-only scope with API deferred · execution performed in VS Code
with Claude Code. State each as a decision with a reason, not as an apology.

## Deliverable B — deliverables/00-summary/solution_flow.html

A single self-contained HTML file, inline CSS and SVG, no CDN, opens offline, responsive,
and readable in both light and dark colour schemes.

It must show the REUSABLE pipeline, not a one-off narrative:

1. End-to-end pipeline diagram — M1 through M5 with the gate between each, showing each
   milestone's input artifact and output artifact, and the fact that a gate cannot be
   passed until the prior artifact satisfies its Definition of Done.
2. A per-milestone detail panel — for each, the inputs, the steps, the commands used
   (/coverage, /analyze, /code-review, /heal) and the artifact produced.
3. The feedback loops, which are the part that makes this a pipeline rather than a
   checklist: M2 observations correcting M1's PRD; M5 observations correcting M3's CSV
   and M2's locator register; /heal feeding prevention rules back into the framework.
4. The framework layer diagram — test -> fixture -> page object -> component -> util,
   with the dependency rule (arrows point downward only) and a note that everything below
   src/pages/ is module-agnostic.
5. A "reuse for a new module" panel — what changes (a new spec, new page objects, new
   tests) versus what is reused unchanged (constitution, plan, the four commands, all
   components, fixtures, utils, the HTML report template), and the /new-module command
   that runs the cycle.

Make the diagrams actual SVG, not ASCII art in a <pre>. Label every node with the real
artifact name and path.

## Then verify
- [ ] Both files exist at deliverables/00-summary/
- [ ] The HTML opens offline with zero network requests — measure it, do not assume
- [ ] Every figure in the workbook traces to a file on disk; list any you could not source
- [ ] No invented numbers anywhere

Report what you built, then present both files.
```

**Produced:** deliverables/00-summary/implementation_summary.xlsx and solution_flow.html.

**Improved prompt:**

```
Gate G5 approved. Build deliverables (a) and (b) from what is on disk.

(a) deliverables/00-summary/implementation_summary.xlsx — sheets Milestone Summary, Artifacts, Metrics, Defects, Decisions & Deviations (columns as in the original brief).
- Compute every figure from its source file with a script at build time (test_design.csv, the M4 report data, healing_process.md, the retained run output). Do not type any number from this prompt or from memory.
- Next to each metric, record its source file and the date it was computed.
- Keep the build script so the workbook can be regenerated when a figure changes.

(b) deliverables/00-summary/solution_flow.html — self-contained, offline, light and dark, real SVG: the pipeline with gates, per-milestone panels, the feedback loops, the framework layers, and the reuse-for-a-new-module panel.

Verify: both files exist; the HTML makes zero network requests (measured); every figure traces to a source; list anything you could not source. Record in final_review.md that any later change to a figure must be cascaded to both files.
```

**What the improvement fixes:** Hard-coded the current figures in the prompt (33 stories, W1 47 / W2 89, 22 healing entries), which went stale in the workbook with each later change and had to be cascaded by hand (final_review.md; commits c81f972, 23c3cd9).

---
### #41 — 2026-09-25T12:36:43Z — Gate G5

**Purpose:** Create the reusable /new-module command and reference it (not a missing-command note) from solution_flow.html

```
Create .claude/commands/new-module.md with exactly this content, then update
solution_flow.html's reuse panel to reference it as an existing command rather than a
missing one.

---
name: new-module
description: Run the full SpecKit QA cycle for a new module, reusing everything built for Admin.
argument-hint: <MODULE_CODE> <Module Name>   e.g. PIM PIM  |  LEV Leave
---

# /new-module — Run the pipeline for $1 ($2)

## Reused unchanged — DO NOT rewrite any of these
- `.specify/memory/constitution.md` — same rules, same gates G1-G5
- `.specify/specs/001-admin-ui/plan.md` — same stack, layers, report schema
- `.claude/commands/analyze|coverage|code-review|heal` — module-agnostic already
- `src/components/`, `src/fixtures/`, `src/utils/`, `src/pages/base/` — the framework.
  Constitution III.10 forbids module-specific knowledge here. If $1 appears to need a
  change in these, that is a FRAMEWORK GAP: fix it generically so every module benefits,
  and record it. Never add a `$1`-specific branch to a shared file.
- `deliverables/04-execution/agent_execution_report.html` — template plus data object;
  only the data changes.

## Created new
- `.specify/specs/00N-$1-ui/spec.md` (N = next free number)
- `src/pages/$1/`
- `tests/$1/`
- deliverables suffixed for this module

## Procedure — same five gates, shortened by reuse

### M1 — Promote the PRD chapter
`deliverables/01-prd/prd.md` already specifies $2 at Tier 3. Do NOT write a new PRD.
Promote its chapter to Tier 1 in place: full field inventory tables, module business rules
referencing existing BR-nn ids, stories `US-$1-nn-yy` with inline Tier 1 Gherkin (happy
path, mandatory-empty, duplicate, boundary, invalid format, cancel, delete-confirm,
delete-cancel, empty search, pagination, plus every workflow state transition). Change its
QA cycle marker to ACTIVE CYCLE. Update the Appendix A traceability matrix. Preserve every
existing id. Mirror new ids into the new spec.md. TO CONFIRM markers for anything
unverified. **Gate G1.**

### M2 — Exploration
Read `deliverables/02-exploration/exploration.md` FIRST: its locator risk register already
records how oxd components behave on this build, including the M5 corrections. Confirm
they hold on $2's screens and record only deltas plus whatever is new. Answer every new
TO CONFIRM. Zero automation code.
Output: `exploration-$1.md` + `evidence-$1/` **Gate G2.**

### M3 — Test design
Same CSV header, byte-exact, including `valid in scope`, `needs automation` and
`automation_wave`. TC ids `TC_$1_<sub>_nnn`. Every No carries a reason. Run /coverage.
Output: `test_design-$1.csv` **Gate G3.**

### M4 — Manual execution + HTML report
Execute only `valid in scope = Yes`. Reuse the report template unchanged — only the
injected data object changes.
Output: `agent_execution_report-$1.html` **Gate G4.**

### M5 — Automation
Write ONLY `src/pages/$1/` and `tests/$1/`. Everything below `src/pages/` exists — import
it. Before writing a page object, check whether an existing component wrapper covers the
control; build a new wrapper only for a genuinely new oxd primitive, and build it
generically. Run /code-review, then /heal on every failure. 3 consecutive green runs.
Output: the suite + `healing_process-$1.md` **Gate G5.**

## Reuse report — produce this at the end
| Asset | Reused as-is | Extended | Newly created |
State lines written new versus reused, and name any framework gap found. If more than a
handful of lines had to change below `src/pages/`, the architecture has leaked — say so
explicitly rather than quietly patching it.

## Rules
Announce each gate, verify its DoD, stop for sign-off. UI only. Strictly sequential, one
browser. Shared-demo safety: e2e_ prefix, self-cleanup, never touch records you did not
create.

---

After creating it, update solution_flow.html's reuse panel: replace the note saying
/new-module does not exist with the command and what it does. Re-verify the HTML still
opens offline with zero network requests.

Then present all seven deliverables (a-g) with their paths.


IMPORTANT: Only CREATE the file and update the HTML. Do NOT execute /new-module or start
any module cycle. No module work happens now.
```

**Produced:** .claude/commands/new-module.md; solution_flow.html's reuse panel updated.

**Improved prompt:**

```
Create .claude/commands/new-module.md with the content of the original prompt, with these amendments, then update solution_flow.html's reuse panel to reference it.

- Replace "Constitution III.10" with "Constitution Article IV.1 (module-agnostic rule)". Check every other section reference against the actual documents before writing.
- M1: apply the "always unverified until observed" list (every message, limit, validation rule, mandatory field) and build the screen inventory from the live menu, one story per screen.
- M2: fill the per-screen completeness matrix (create/edit/delete/bulk-delete toasts, mandatory fields, search semantics, breadcrumb) for every screen.
- M3: Story_ID must be a US id (no orphans); every P0 case is Wave 1; size Wave 1 to the run budget; do not mark a case "No" only because its outcome is unobserved.
- M4: strictly sequential, one browser; checkpoint after every case; fixed evidence reasons.
- M5: check the Wave 1 list against test titles by set difference; keep raw output of every official run under runs/; known-defect guards per CLAUDE.md §5.4.
- Resume rule for every milestone: reconcile from disk, damage-check, never re-execute completed work.

Only create the file and update the HTML. Do not run /new-module. Then present deliverables (a)–(g) with their paths.
```

**What the improvement fixes:** Cited a non-existent "Constitution III.10" (the rule is Article IV.1), which is now inside new-module.md, and carried none of the lessons learned after it: a per-operation observation checklist, P0 in the first wave, raw run output, orphans fixed with stories, and resume rules.

---
### #42 — 2026-09-25T13:10:54Z — Gate G5

**Purpose:** Fix a gap in deliverable (g): add the missing automated-suite HTML execution report

```
Deliverable (g) is missing its HTML execution report. The assignment requires:
"automation scripts AND execution html report AND healing/fixing process."

We have the scripts and healing_process.md, but no HTML report for the automated run —
only the manual M4 report exists.

Do this:
1. Run the full 47-test suite once more, strictly sequential, one browser, with the HTML
   reporter enabled.
2. Copy the generated Playwright HTML report into
   deliverables/05-automation/automation_execution_report.html
   It must be self-contained and open offline — if Playwright's output is a folder with
   assets, either inline them into a single file or keep the folder and say so explicitly.
3. Verify it opens offline and shows all 47 tests with their results and durations.
4. If the report does not include the bug context, add a short HTML section at the top
   listing the product defects asserted by the suite (BUG-001, BUG-002) and their TC_IDs,
   so the report carries the same defect visibility the manual report has.
5. Update implementation_summary.xlsx (Artifacts sheet) and solution_flow.html to include
   this new file.

Report the path and confirm it opens offline.
```

**Produced:** deliverables/05-automation/automation_execution_report.html (Playwright's own HTML reporter output from a 47/47 green run, with a known-defects banner prepended); xlsx/HTML summaries updated to reference it.

**Improved prompt:**

```
Deliverable (g) needs an HTML report of the automated run.

1. Run the full W1 suite once, strictly sequential, one browser, with the JSON reporter and a step reporter writing to deliverables/05-automation/runs/<date-time>/, plus the list output.
2. Build deliverables/05-automation/automation_execution_report.html as a template plus an embedded data object generated from that retained output (same design as the M4 report): run metadata, pass / fail / flaky counts, per-test status with retries and duration, steps, the healing summary, and the known-defect section generated from the CSV's Linked_Bug column (not hand-listed).
3. Verify it opens offline with zero network requests and shows every W1 test.
4. Update implementation_summary.xlsx and solution_flow.html to reference it.

Report the path, the run's raw-output folder, and the result.
```

**What the improvement fixes:** Asked for Playwright's own HTML output with a hand-written bug banner listing BUG-001 and BUG-002; the report was later rebuilt as a data-driven template from retained JSON output, and the banner had to grow when BUG-003 got a guard.

---
### #43 — 2026-09-25T13:33:54Z — Gate G5

**Purpose:** Create this prompts archive itself

```
Create a prompts archive. Two files, same content, different formats.

## 1. deliverables/00-summary/prompts_used.md

Every prompt that drove this project, in chronological order, grouped by milestone.
For each: the milestone/gate, the purpose in one line, the VERBATIM prompt text in a
fenced block, and one line on what it produced.

Include the corrective and resume prompts too — the pipeline-reconciliation prompt, the
M2 back-propagation prompt, the W1/W2 restructure, the CFG_003/004 ruling, the resume
prompts after session limits. Those show how the process self-corrected and are more
interesting than the happy path.

Source them from this conversation's actual history. Do not paraphrase, do not tidy them
up, and do not invent a prompt that was never sent. If a prompt is only partially
recoverable, include what you have and mark it `[partial]`.

Add a short intro explaining the structure: CLAUDE.md is the standing system prompt,
.specify/ holds the governing documents, .claude/commands/ holds the reusable commands,
and these are the per-milestone driving prompts.

## 2. deliverables/00-summary/prompts_used.xlsx

Same content as a workbook so it can be read outside the repo:
Sheet "Prompts" — columns: # · Milestone · Gate · Purpose · Prompt text (full) · Output
produced · Notes
Sheet "Commands" — the six commands in .claude/commands/ that are ours (analyze,
coverage, code-review, heal, new-module) plus CLAUDE.md: name, purpose, when it runs in
the pipeline, output artifact.

Keep the full prompt text in the cell — do not truncate. Set wrap text and sensible
column widths so it is readable.

Report both paths when done.
```

**Produced:** deliverables/00-summary/prompts_used.md and prompts_used.xlsx.

**Improved prompt:**

```
Create a prompts archive in two identical formats: deliverables/00-summary/prompts_used.md and prompts_used.xlsx (sheets Prompts and Commands, columns as before).

Source every prompt from the session transcripts; no paraphrase, no tidying, nothing invented. Exclude system-generated compaction summaries and say how many you excluded.

For each prompt, check that the recovered text ends cleanly. If it stops mid-sentence or mid-list, mark it [partial] and note what is missing, as for any unrecoverable prompt. Report the list of prompts checked this way.

After writing both files, verify they are identical: same prompt count, same text in each cell and fenced block (compare programmatically), and report the result.
```

**What the improvement fixes:** Asked for [partial] marking but not for a check that each recovered prompt ends cleanly; #23 stops mid-list ("delete-confirm · delete-cancel ·") without the marker that #28 carries.

---

## Reusable prompt library

The improved prompts with this project's specifics removed, one per pipeline stage, so the set can drive any module. Placeholders in {{DOUBLE_BRACES}} are filled per module (for example {{MODULE}} = "PIM", {{MODULE_CODE}} = "PIM").

### L-00 — Setup — Workspace and tooling setup before Milestone 1

**Parameters:** {{MODULE}}, {{MODULE_CODE}}, {{TARGET_URL}}

**Built from (original prompts):** #1, #2, #9–#16

```
Act as the Principal QA Architect for a UI-only QA cycle on {{MODULE}} at {{TARGET_URL}}.

1. Create CLAUDE.md at the workspace root with the content I paste below, verbatim. It governs everything else.
2. Create the SpecKit workspace strictly to CLAUDE.md's five-milestone model and src/ layout: .specify/memory/constitution.md, .specify/specs/<NNN>-{{MODULE_CODE}}-ui/ (spec.md, plan.md, tasks.md), and only our commands in .claude/commands/. Generate no stock templates.
3. Set up the browser in one pass: .mcp.json with @playwright/mcp and "--browser chromium", then "npx playwright install chromium". Tell me to restart the session.
4. After the restart: log in through the form at {{TARGET_URL}} and report the footer build string and the post-login heading, verbatim. If the browser does not work, report the error and stop.

Write no test code in this step. List every file created.
```

---

### L-01 — M1 — Product Requirements Document with an assertion-grade chapter for the module under test

**Parameters:** {{MODULE}}, {{MODULE_CODE}}, {{TARGET_URL}}, {{OTHER_MODULES}}

**Built from (original prompts):** #3, #4, #5, #6

```
# MILESTONE 1 — Product Requirements Document (Gate G1)

Read the constitution, spec.md and tasks.md (Milestone 1 and its DoD). List every existing id; ids are immutable.

Scope: product scope is the whole application; QA cycle scope is {{MODULE}} only. {{MODULE}} is Tier 1 (exhaustive, assertion-grade); {{OTHER_MODULES}} are Tier 3 and carry "QA CYCLE: not in current cycle — specification only". UI only; API deferred by decision.

Always unverified until observed — never state as fact, mark "TO CONFIRM (M2)" and add to Open Questions:
every message, toast and empty-state string · every numeric rule, length, minimum, maximum and format · every validation rule, including password-style policies · which fields are mandatory · delete behaviour on referenced data · file type and size limits. Describe the capability; mark the specifics.

Screen inventory: open the live navigation for each {{MODULE}} sub-module and list what is there. Every screen gets at least one US story with Tier 1 Gherkin (happy path, mandatory-empty, duplicate, boundary, invalid format, cancel, delete-confirm, delete-cancel, empty search, pagination). Gherkin is domain language, never selectors.

Output: deliverables/01-prd/prd.md (update the existing chapter in place if the PRD exists). Mirror new ids into spec.md.

DoD: ids preserved · screen → story mapping complete · zero unmarked messages, limits or validation rules · TO CONFIRM count equals Open Questions count · prd.md/spec.md parity diff exits 0.
Report the checklist and counts, then stop at G1.
```

---

### L-02 — M2 — Manual UI exploration, with a completeness matrix for every screen

**Parameters:** {{MODULE}}, {{TARGET_URL}}, {{BUILD}}, {{CREDENTIALS}}, {{OBSERVE_ONLY_SCREENS}}

**Built from (original prompts):** #17

```
# MILESTONE 2 — UI Exploration & Findings (Gate G2)

You are exploring {{TARGET_URL}} ({{BUILD}}) manually, logged in through the form as {{CREDENTIALS}}. Record only what you observe in this session. Zero automation code; zero API calls or stubbing. Strictly sequential, one browser.

Shared-demo safety: create only e2e_-prefixed records with a unique suffix and delete them; never delete what you did not create; {{OBSERVE_ONLY_SCREENS}} are observe-only; revert any global setting you change in the same visit.

For every {{MODULE}} screen, including screens that only get a confirmatory pass:
1. Navigation path, full field inventory (control type, mandatory — confirmed by submitting empty), buttons, default state, empty-state text, screenshot.
2. The completeness matrix, verbatim or "not applicable — <reason>", no blanks: create success · edit success · delete single · delete bulk · mandatory-empty (message per field) · duplicate · boundary length at and beyond the limit.
3. Search semantics for every filter (exact, prefix or contains), and the breadcrumb segment by segment.

Also: answer every TO CONFIRM from the PRD; findings (FIND-nnn); bugs (BUG-nnn: severity by user impact, numbered steps, expected with the US/BR id, actual, x/5 reproducibility, evidence); the locator risk register using the class names and accessible names actually observed; flakiness log; automation readiness and executability per screen. Any screen in the menu that the PRD lacks is a finding with a proposed story.

Output: deliverables/02-exploration/exploration.md and evidence/. Report the DoD and counts, then stop at G2.
```

---

### L-03 — G2 — Back-propagate exploration into the PRD and spec, then verify the gate

**Parameters:** {{MODULE}}

**Built from (original prompts):** #18, #19, #20, #22

```
Before G2 sign-off, back-propagate Milestone 2 into prd.md and spec.md:
a) Every requirement M2 contradicted: correct it to the observed behaviour, quoting the recorded wording; remove anything invented.
b) Every confirmed defect in a scenario: assert the ACTUAL behaviour, annotated KNOWN DEFECT: BUG-nnn.
c) Every resolved TO CONFIRM: replace with the observed fact; keep unresolved ones with a reason.
d) Every screen or behaviour M2 found that the PRD lacks: add it and mint a story from exploration.md only. No test case may later trace to a finding id.
e) Keep prd.md and spec.md identical on ids; add an "M2 corrections" audit table to the PRD's Open Questions section.

Then verify: parity diff (exit code); exploration.md and evidence/ present; zero .spec.ts in the repo; only our commands in .claude/commands/. List anything that should be deleted; delete nothing without a separate instruction.
Report the counts of requirements corrected and added, then stop at G2.
```

---

### L-04 — M3 — Test design CSV, sized to capacity, with the coverage audit

**Parameters:** {{MODULE}}, {{MODULE_CODE}}, {{SUB_CODES}}, {{RUN_MINUTES}}, {{GATE_RUNS}}

**Built from (original prompts):** #23–#27

```
# MILESTONE 3 — UI Test Design (Gate G3)

Output: deliverables/03-test-design/test_design.csv with CLAUDE.md §6's exact header plus automation_wave.

- Derive cases from the Gherkin: one per Scenario, one per Examples row. TC_ID TC_{{MODULE_CODE}}_<sub>_<nnn>, sub codes {{SUB_CODES}}.
- Story_ID is a US id from spec.md. A case with no story is a missing requirement: propose the story; never use a finding id.
- Expected_Result quotes exploration.md verbatim. If the outcome was not observed, write it from the PRD, mark "TO CONFIRM (M4)", and decide automation on value, not on observation.
- valid in scope = No only for: blocked by a defect that prevents execution · outside UI scope · global blast radius on the shared demo · not present on this build. needs automation = No for visual judgement, colour pickers, non-deterministic or low-value cases. Every No has a specific reason.
- Known defects: Expected_Result states the actual behaviour, Linked_Bug set, valid in scope stays Yes if executable.
- Capacity: a full run takes {{RUN_MINUTES}} and G5 needs {{GATE_RUNS}} consecutive green runs per healing cycle. Size Wave 1 to fit. Every P0 case is W1, always. One reference CRUD set per repeated family in W1, siblings in W2 as data. W2 is scheduled, not descoped.
- Depth per CRUD screen: create, mandatory-empty, duplicate, boundary, invalid format, edit, cancel, delete-confirm, delete-cancel, search match, search no-match, reset, pagination.

Then run /coverage in full; every orphan is fixed with a story, never justified. Report counts (in scope, needs automation, W1/W2, P0 outside W1 = 0, orphans = 0), coverage metrics and the first 3 rows. Stop at G3.
```

---

### L-05 — M4 — Manual execution of every in-scope case, with the HTML report

**Parameters:** {{MODULE}}, {{IN_SCOPE_COUNT}}, {{SUB_ORDER}}

**Built from (original prompts):** #28, #29, #32, #33

```
# MILESTONE 4 — Manual UI Execution & HTML Report (Gate G4)

Execute the {{IN_SCOPE_COUNT}} rows with valid in scope = Yes, manually through the UI, in the order {{SUB_ORDER}}.

Execution mode: strictly sequential, one agent, one browser. Before the first case, create PROGRESS.md and damage-check any screen a previous attempt touched.

Rule 1 — zero assumptions: record only what you observe; never mark Pass on a guess (Blocked, with the reason); never edit Expected_Result to make a case pass.
Rule 2 — uncertainty: log an Open Questions row and continue; stop immediately only for an action that could damage the shared demo, a constitution violation, a case that cannot run without changing what it verifies, or the demo being down or reset.
Rule 3 — defects: any divergence is a defect (BUG-nnn: severity by user impact, steps, expected, actual, screenshot, x/3), numbered from exploration.md, linked not duplicated, back-propagated, and set as Linked_Bug on the case that found it. Linked_Bug cases assert the actual behaviour and pass while the bug exists.
Rule 4 — reusable output: the report is a template plus a data object; nothing module-specific in the markup.

Checkpoint after EVERY case: results file plus PROGRESS.md (last TC_ID, counts, next TC_ID). Work not on disk counts as not executed.
Evidence per case: a file path, or exactly one of "Not required (Pass, no defect)", "Not applicable (Blocked before observation)", "Not captured — <why>". Never route around a tool-level denial; bring it to me.

Output: deliverables/04-execution/agent_execution_report.html, offline, evidence in evidence/. Report tallies and the Open Questions register; stop at G4.
```

---

### L-06 — M5 — Build the Page Object Model suite for Wave 1

**Parameters:** {{MODULE}}, {{MODULE_CODE}}, {{SCREEN_ORDER}}

**Built from (original prompts):** #34, #35, #38

```
# MILESTONE 5 — Playwright Automation, build phases (Gate G5)

Scope: automation_wave = W1 only; W2 stays scheduled. Strictly sequential, one browser.

Phase 1 (only if the framework does not exist yet): utils/fieldFactory (label-anchored by the <label> element), components for every oxd primitive (the only place raw oxd- selectors live), base pages, fixtures (real UI login, re-auth on redirect, e2e_ data with guaranteed teardown), config (workers 2, retries 1, no networkidle). If it exists, reuse it unchanged; a module-specific need below src/pages/ is a framework gap to solve generically.

Phase 2: derive each screen's W1 list from the CSV and confirm the sum equals the W1 total. Build in {{SCREEN_ORDER}}: page objects under src/pages/{{MODULE_CODE}}/ (behaviour only, no expect, no raw oxd-), then one test per W1 TC_ID under tests/{{MODULE_CODE}}/, titled with its Automation_ID.
- Assertions use verbatim observed strings; if a string was never recorded, observe it live, record it, then assert it. No "text is not empty" assertions.
- Linked_Bug cases assert the actual behaviour, labelled KNOWN DEFECT (CLAUDE.md §5.4).
- Banned: waitForTimeout, networkidle, .first() to silence strict mode, conditional assertions, swallowed errors, positional XPath.
Run each screen's tests when it is done; append to PROGRESS.md per screen.

End of Phase 2: set difference between W1 Automation_IDs and test titles, both directions empty; back-propagate every live correction into exploration.md and the CSV (sweep every quoted message, for every operation). Stop before Phase 3.
```

---

### L-07 — M5 — Review, three official runs with retained output, and healing

**Parameters:** {{MODULE}}, {{MODULE_CODE}}

**Built from (original prompts):** #39, #42

```
# MILESTONE 5 — Review, run, heal (Gate G5)

Confirm state from disk in three lines; do not rebuild Phase 2.

1. /code-review over ALL of src/ and tests/, running every search pattern in code-review.md; report the patterns run and every hit with its verdict. Fix every Blocker and Major.
2. Three consecutive full runs, strictly sequential, one browser. Keep each run's raw output under deliverables/05-automation/runs/<date-time>/ (JSON, step output, list output, failure screenshots). Read the raw results: a retry-only pass is a healing candidate.
3. /heal every failure per heal.md; each entry cites the retained run output for its timestamp and raw error. ENV_INSTABILITY: record, do not patch; no timeout inflation without a named readiness signal.
4. healing_process.md: the whole milestone's experiment log with the root-cause summary.
5. automation_execution_report.html: template plus data generated from the retained output, known-defect section generated from Linked_Bug.

Report the verdict, the runs (duration, retries), heal entries by class, and the W1-vs-tests set difference. Stop at G5.
```

---

### L-08 — Any — Resume a milestone after an interruption

**Parameters:** {{MILESTONE}}, {{PROGRESS_FILE}}

**Built from (original prompts):** #29, #30, #31, #36, #37

```
Resume {{MILESTONE}}. Do NOT re-execute or rebuild anything already completed.

1. Read {{PROGRESS_FILE}} and every result file; list what exists on disk. Report in two lines: what is complete and what is next.
2. Any batch or file with no results on disk counts as not done, however far it got.
3. If the interruption happened mid-action on the shared demo, damage-check that screen live (no non-owned record missing, no leftover e2e_ data, global settings still at their saved state) before anything else.
4. For build milestones, run a set difference between what should exist and what does, and report the gaps.
5. Continue from the next item under all standing rules. Strictly sequential, one browser. Stop at a clean boundary and say where.
```

---

### L-09 — Any gate — Gate verification and cascading changed figures

**Parameters:** {{GATE}}, {{MODULE_CODE}}

**Built from (original prompts):** #7, #19, #24, #40

```
Verify Gate {{GATE}} from disk and report raw output:
1. The milestone's DoD from tasks.md, line by line.
2. prd.md/spec.md id parity (US- and EPIC- ids): the diff and its exit code.
3. For the CSV: header byte-exact, no duplicate TC_IDs, no No without a reason, no Yes without an Automation_ID, no orphan Story_IDs, no P0 outside Wave 1.
4. For the suite: W1-vs-test-title set difference, both directions.
5. Figures: for every figure this gate changed, list every artifact that shows it and update them in the same change; leave historical run records as written.
Report and stop for sign-off.
```

---

### L-10 — Post-G5 — Summary deliverables built from the sources

**Parameters:** {{MODULE}}

**Built from (original prompts):** #40, #42, #43

```
Build the summary deliverables from what is on disk, with no typed-in numbers:
- implementation_summary.xlsx (milestone summary, artifacts, metrics, defects, decisions): every figure computed by a kept build script from its source file, with the source and computation date beside it.
- solution_flow.html: self-contained, offline, light and dark, SVG diagrams of the pipeline, gates, feedback loops, framework layers and the reuse path.
- prompts archive (.md and .xlsx, identical): every prompt from the transcripts verbatim; any that ends mid-sentence marked [partial]; both formats compared programmatically.
Verify offline behaviour (zero network requests, measured) and list anything that could not be sourced.
```

---
