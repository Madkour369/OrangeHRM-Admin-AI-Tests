# Specification — OrangeHRM Web UI (Feature 001: Admin Module)

Produced under Constitution v1.0 · Scope: **UI only** · Target:
`https://opensource-demo.orangehrmlive.com/`

Status: **M2 exploration complete** for both scenarios previously marked *observation
scenario* (Work Shift overnight ordering, Nationality in-use deletion) — both are now
asserted scenarios below, one of them (Nationalities) annotated as a known defect
(BUG-001). See `deliverables/02-exploration/exploration.md` and
`deliverables/01-prd/prd.md` §13.1 for the full audit trail.

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

(See Constitution Article I for the binding version of this rule.)

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
    # spec.md previously asserted a message "Your password must contain minimum 1
    # upper-case letter" for this input, and the length message was wrongly stated as
    # "at least 8 characters". M2 exploration confirmed the real minimum is 7 characters
    # and that no upper-case requirement exists at all. The invented scenario is removed,
    # not merely relaxed.

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

  Scenario: Work shift overnight time ordering is rejected (ASSERTED — resolved M2, OQ-02)
    When I create a work shift From "06:00 PM" To "09:00 AM"
    Then the exact inline error "To time should be after from time" is displayed under To
    And "Duration Per Day" shows "0.00"
    And Save is blocked; no record is created
```

> Resolved by manual exploration (`deliverables/02-exploration/exploration.md` §2.2). This
> build has no overnight-shift support; From must be earlier than To, same day. No longer
> an observation scenario.

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

All five screens follow the shared CRUD contract above. Screen-specific stories:

- **US-04-01 Skills** — fields: Name*, Description. Description accepts long text; a
  saved description must be retained in full when the record is reopened for editing.
- **US-04-02 Education** — fields: Level*. Level is this screen's business key (there is
  no separate Name field) — the shared contract's duplicate-rejection case applies to
  Level specifically.
- **US-04-03 Licenses** — fields: Name*. Shared CRUD contract only; no screen-specific
  scenario beyond it.
- **US-04-04 Languages** — fields: Name*. Shared CRUD contract only; no screen-specific
  scenario beyond it.
- **US-04-05 Memberships** — fields: Name*. Bulk delete from the list must reduce the
  displayed record count by exactly the number of records removed.

```gherkin
  Scenario: US-04-01 — Skill description is retained in full on edit
    When I create a Skill with a 400-character Description
    Then the record saves
    And reopening it for editing shows the full 400-character Description unchanged

  Scenario: US-04-02 — Level is the business key for Education
    Given an Education record already exists for a given Level
    When I attempt to create another Education record with the same Level
    Then a duplicate/"Already exists" error is displayed
    And no second record is created

  Scenario: US-04-05 — Bulk delete updates the record count
    Given at least two "e2e_" Membership records exist
    When I select them and use "Delete Selected" and confirm
    Then both are removed
    And the displayed record count decreases by exactly the number deleted
```

---

### EPIC-ADM-05 — Nationalities

- **US-05-01 Nationalities CRUD** — fields: Name*. Follows the shared CRUD contract.
  Additionally:

```gherkin
  Scenario: US-05-01 — Deleting a Nationality already assigned to an employee — KNOWN DEFECT: BUG-001
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
    # BR-11. Do NOT rewrite this scenario to assert the desired BR-11-compliant
    # behaviour — M3 must assert what the product does today and link the test to
    # BUG-001 (e.g. test.fixme, or an explicit known-defect assertion).
```

> Resolved by manual exploration (Open Question OQ-03 in `deliverables/01-prd/prd.md`).
> No longer an observation scenario — reproduced 2/2 in
> `deliverables/02-exploration/exploration.md` §2.5, filed as **BUG-001** (High).

---

### EPIC-ADM-06 — Corporate Branding

**US-06-01** Upload client logo / login banner / login page background; reset to default.
**US-06-02** Change primary, secondary and text colours; observe live preview.
**US-06-03** Social media link fields validate URL format.

```gherkin
  Scenario: Upload a logo of an unsupported type shows the WRONG message — KNOWN DEFECT: BUG-002 (corrected M2)
    When I attach a small ".txt" file (well under 1MB) to "Client Logo"
    Then the message "Attachment Size Exceeded" is displayed and no upload occurs
    # This is the PRODUCT'S ACTUAL BEHAVIOUR. spec.md previously asserted "a file-type
    # validation error" — that message does not exist on this build; the console shows
    # "The source image cannot be decoded." as the real cause. See
    # deliverables/02-exploration/exploration.md §2.6 and §5.

  Scenario: Oversized image is rejected (confirmed M2)
    When I attach a 1.2MB image to "Client Logo" (limit is 1MB)
    Then the message "Attachment Size Exceeded" is displayed

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
