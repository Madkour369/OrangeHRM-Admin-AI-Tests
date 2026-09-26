# Milestone 2 — Admin Module UI Exploration

**Governed by:** `.specify/memory/constitution.md` v1.0 (Articles I, II, V, VI in particular) · `CLAUDE.md` §5 (OrangeHRM UI Survival Guide) · `.specify/specs/001-admin-ui/tasks.md` (M2) · `deliverables/01-prd/prd.md` §8.1, §13
**Scope:** Admin module, UI only, all 7 sub-modules (`EPIC-ADM-01` … `EPIC-ADM-07`)
**Rule of this milestone:** everything below is something this session actually observed on screen. Nothing is inferred from general OrangeHRM knowledge or from the PRD's assumptions. Where the PRD's assumption turned out to be wrong, that is called out explicitly as a finding rather than silently corrected.

---

## 1. Environment Capture

| Field | Value |
|---|---|
| URL | `https://opensource-demo.orangehrmlive.com/` |
| Build/version string (footer, confirmed) | `OrangeHRM OS 5.9` |
| Account used | `Admin` / `admin123` |
| Browser | Chromium ("Chrome for Testing"), UA reports Chrome/154.0.0.0, automated via Playwright MCP |
| Viewport | 1920×1080 |
| Session date | 2026-09-19 23:38 UTC through 2026-09-20 00:22 UTC (~44 minutes, continuous) |
| Constitution version in force | v1.0 (2026-09-20) |

`CLAUDE.md` was missing from the workspace root at the start of this engagement and was recreated verbatim from the master system prompt in a prior turn; it is present and was read before this milestone began.

---

## 2. Sub-module Walkthroughs

Per Article VI and the assignment's hard rule, every mutating test used data prefixed `e2e_` plus a unique suffix, and every such record was deleted by the end of the session (verified — see §9, DoD line). No pre-existing or shared record was ever deleted or altered irreversibly. Two exceptions are documented at the point they occur: (a) Amelia Brown's (a real, pre-existing employee) blank `Nationality` field was set to an `e2e_`-prefixed nationality and back to blank twice, to resolve OQ-03 — its final state is identical to its state before this session touched it; (b) Organization → General Information's Edit toggle was switched on to inspect field behaviour, no field value was changed, and no Save was clicked.

Depth note: the CRUD contract (mandatory-field validation, duplicate handling, cancel, delete-confirm/cancel/confirm, success toast) was run at full 11-scenario depth on one representative screen per shared-pattern group (System Users; Work Shifts; Skills), and the flagged Open-Question screens (Work Shifts, Nationalities, Corporate Branding, Email Configuration) always got full depth regardless of pattern-sharing. The remaining screens in each shared-pattern group got a real, on-screen confirmatory pass — navigate, screenshot, field inventory via accessibility snapshot, record count — rather than the full 11-scenario battery a second and third time. This is stated explicitly per screen below so M3 knows exactly what has and hasn't been battery-tested.

### 2.1 EPIC-ADM-01 — User Management → Users — **full battery**

Navigation: Admin → User Management (default landing tab).

**Screen inventory (Add/Edit User form):**

| Field | Control type | Mandatory | Notes |
|---|---|---|---|
| User Role | `oxd-select-text` dropdown | Yes | Options confirmed: `-- Select --`, `Admin`, `ESS`. No other role exists on this build. |
| Employee Name | Autocomplete text input, placeholder "Type for hints..." | Yes | Must be chosen from the debounced suggestion list; free text is rejected. |
| Status | `oxd-select-text` dropdown | Yes | Options: `-- Select --`, `Enabled`, `Disabled`. |
| Username | Text | Yes | Uniqueness enforced. |
| Password | Text (masked), with a live strength meter | Yes on create | Hint text (verbatim): *"For a strong password, please use a hard to guess combination of text with upper and lower case characters, symbols and numbers"*. Strength labels observed: `Very Weak`, `Weak` (inferred, not directly captured), `Better`, `Strong`. |
| Confirm Password | Text (masked) | Yes on create | |
| Change Password ? (Edit form only) | Checkbox toggle, label "Yes" | — | Password/Confirm Password fields are hidden on Edit until this is switched on — confirms PRD's stated behaviour. |

Default list state: `(N) Records Found` where N fluctuated between 5 and 11 across the session purely from other concurrent activity on the shared demo (see §7, flakiness log) — never from this session's own uncommitted actions.

**Behaviour exercised, verbatim results:**

- Submit fully empty → `Required` appears under User Role, Employee Name, Status, Username, and Password. Confirm Password instead shows `Passwords do not match` — see **FIND-001**.
- Employee Name typed as free text that resolves to no suggestion (`zzznonexistentxyz`) → dropdown shows a single disabled option `No Records Found`; on Save, the field itself shows `Invalid` (verbatim).
- Password `abc` → strength label `Very Weak`, message `Should have at least 7 characters`.
- Password `alllowercase1` (13 lower-case letters + 1 digit, no upper-case) → strength label `Strong`, **no validation message at all**. See **FIND-002** — this contradicts the PRD's own Gherkin (`US-01-06`), which assumes an upper-case requirement.
- Password `Password` (upper-case, no digit) → strength label `Very Weak`, message `Your password must contain minimum 1 number`.
- Duplicate username (`e2e_adm01_20260920a` submitted twice) → field-level message `Already exists` (verbatim); no toast, no second record created.
- Cancel from a filled Add User form → returns to the list; record count unchanged (BR-10 confirmed).
- Successful create → toast: title `Success`, message `Successfully Saved` (verbatim, `.oxd-toast-content--success`); auto-dismisses in a few seconds — screenshot taken immediately to capture it.
- Search Username = exact e2e value → `(1) Record Found` (**singular** "Record", not "Records" — a real, correctly-pluralised, code path, not a typo to assert against loosely).
- Search Username = nonexistent → `No Records Found` (verbatim).
- Reset after a search → filters clear, full unfiltered list returns.
- Edit → change User Role ESS→Admin → Save → toast `Successfully Saved`; list reflects `Admin` immediately.
- Delete (single): clicking the row's first action icon opens a dialog — heading `Are you Sure?`, body `The selected record will be permanently deleted. Are you sure you want to continue?`, buttons `No, Cancel` / `Yes, Delete` (verbatim). `No, Cancel` closes the dialog with the record intact (confirmed via re-snapshot). `Yes, Delete` removes it and decrements the record count.
- Bulk delete: selecting two `e2e_` rows via their checkboxes surfaces a header bar `(2) Records Selected` / button `Delete Selected`; confirming shows **the identical singular-wording dialog** used for single delete — see **FIND-003**. Confirming removed both rows; count dropped by exactly 2.
- Pagination: not exercised. Every observation window on this screen showed ≤11 records, well under one page; there is no non-destructive way to generate 50+ owned `e2e_` system users without violating the "self-contained, minimal-footprint" spirit of Article VI, so this is left `needs exploration` for Nationalities instead (§2.5), which naturally has enough records.

**oxd traps actually hit here:**
- **Checkbox trap, confirmed.** Clicking the row checkbox's `<input>` directly times out with *"`<i class="oxd-icon oxd-checkbox-input-icon">` intercepts pointer events"*. Clicking the enclosing `.oxd-checkbox-wrapper` (or its parent `label`) works every time. This applies to every checkbox and radio button seen anywhere in Admin during this session (see §8).
- **Action-icon order.** The two action buttons per row are, in DOM order, **delete (trash) first, edit (pencil) second** — verified via `button.className`/inner `<i>` class (`bi-trash` then `bi-pencil-fill`). This is the reverse of the assumption a test author would likely make. See **FIND-004**.

---

### 2.2 EPIC-ADM-02 — Job — **Work Shifts full battery; other 4 screens confirmatory pass**

Navigation: Admin → Job, submenu confirmed: `Job Titles`, `Pay Grades`, `Employment Status`, `Job Categories`, `Work Shifts`.

#### Work Shifts (full battery — this is OQ-02's screen)

**Screen inventory (Add Work Shift):**

| Field | Control type | Mandatory | Notes |
|---|---|---|---|
| Shift Name | Text | Yes | |
| Working Hours – From / To | Custom time-picker (not a native `<input type=time>`) | Yes | Text shows as `hh:mm AM/PM`; clicking it opens an `hour` spinbox, a `minute` spinbox, and an AM/PM radio pair inside an `alert`-role popup. |
| Duration Per Day | Read-only computed `<p>` | — | Recalculates live as From/To change. |
| Assigned Employees | Autocomplete | No | |

Default list: `(2) Records Found` — `General` (08:00 AM–05:00 PM, 9.00h) and `Twilight` (02:00 PM–11:00 PM, 9.00h), both pre-existing seed data.

**OQ-02 — RESOLVED.** Set From = `06:00 PM`, To = `09:00 AM` (a genuine overnight shift). Result: an inline error appears under the To field — `To time should be after from time` (verbatim) — Duration Per Day recomputes to `0.00`, and clicking Save leaves the form in place with the same error still shown (save is blocked, no record created). **This build does not support overnight Work Shifts; the From/To pair is validated as same-day only, and an overnight shift is rejected, not merely unusual.** This is a concrete, asserted-test-ready answer: this is a negative/boundary test case (`valid in scope = Yes`), not an observation scenario going forward.

**Flakiness observed on this screen** (not confirmed as a reproducible bug, see §7): while typing the shift name `e2e_overnight_20260920` and moving focus to the From field, the console logged an HTTP 500 from `GET .../api/v2/core/validation/unique?...entityName=WorkShift...` followed by an uncaught `TypeError: Cannot read properties of undefined (reading 'message')` from the app's own bundle. Shortly after (next action, clicking Cancel), the session ended and the app redirected to `/auth/login` showing an alert `Session Expired` (verbatim) — a clean, non-broken redirect (**NFR-07 satisfied**), and after re-authenticating the app correctly returned to the originally-requested Work Shift screen rather than defaulting to the Dashboard (a positive, worth-preserving behaviour). This sequence was observed once; a second attempt at the same Work Shift name-uniqueness interaction did **not** reproduce the 500. Logged as a flakiness entry, not a bug, per the "cannot reproduce → flakiness log" rule.

#### Job Titles (confirmatory pass + one full create/delete cycle)

Fields: `Job Title*` (text), `Job Description` (textarea, placeholder "Type description here"), `Job Specification` (file upload, hint verbatim: *"Accepts up to 1MB"*), `Note` (textarea, placeholder "Add note"). Empty submit → `Required` under Job Title only (the rest are optional). Created `e2e_jobtitle_20260920` with just the title, got the same `Successfully Saved` toast pattern, confirmed it appeared in the list (count 28→29), deleted it via the same generic confirm dialog (count back to 28). List showed 28 pre-existing records including two that look like other testers' leftovers (`qwer` / description `hiii`, `rsjsrii` / description `dhhdhhddjdjdjjdjdj`) — not touched, logged as environment evidence (§7).

#### Pay Grades (confirmatory pass + Min/Max boundary test)

List: `Name`, `Currency` columns, 5 seeded grades (`Grade 1`…`Grade 5`, all "United States Dollar"). Opening a grade shows an **Edit Pay Grade** form (`Name*`) plus a nested **Currencies** sub-table (`Currency`, `Minimum Salary`, `Maximum Salary`) with its own Add form: `Currency*` (a genuinely long ISO-currency dropdown, ~150 options, e.g. `EUR - Euro`, `AED - Utd. Arab Emir. Dirham`), `Minimum Salary`, `Maximum Salary`. Entered Min=`60000`, Max=`50000` → both fields show inline errors simultaneously: `Should be lower than Maximum Salary` under Minimum, `Should be higher than Minimum Salary` under Maximum (verbatim) — confirms the PRD's stated Min≤Max business rule. Cancelled without saving; no data changed.

#### Employment Status (confirmatory pass)

Single-field (`Employment Status`, i.e. Name) CRUD list, 6 seeded records (`Freelance`, `Full-Time Contract`, `Full-Time Permanent`, `Full-Time Probation`, `Part-Time Contract`, `Part-Time Internship`). Not mutated; pattern assumed identical to Job Titles/Skills based on shared list-screen chrome (`Add` button, same table/action-icon/delete-dialog components) — **this assumption itself should be spot-checked once during M3 wiring**, not assumed permanently correct.

#### Job Categories (confirmatory pass)

Same single-field pattern, 9 seeded records (`Craft Workers`, `Laborers and Helpers`, `Office and Clerical Workers`, `Officials and Managers`, `Operatives`, `Professionals`, `Sales Workers`, `Service Workers`, `Technicians`). Not mutated.

---

### 2.3 EPIC-ADM-03 — Organization — **General Information + Locations full-ish; Structure observation-only**

Navigation: Admin → Organization, submenu confirmed: `General Information`, `Locations`, `Structure`.

#### General Information

All fields (`Organization Name*`, `Registration Number`, `Tax ID`, `Phone`, `Fax`, `Email`, `Address Street 1/2`, `City`, `State/Province`, `Zip/Postal Code`, `Country`, `Notes`) render as `disabled` text inputs by default, plus a read-only `Number of Employees` (`95`, computed). An `Edit` checkbox toggle in the header is the only way to enable them — confirmed by toggling it: every field's `disabled` attribute disappears and a `Save` button appears. **This confirms the PRD's stated "read-only until explicit Edit toggle" rule exactly.** No field value was changed and Save was never clicked; navigating away left the record untouched (re-verified by a fresh load).

#### Locations

Search filters: `Name`, `City`, `Country` (dropdown). Default: `(4) Records Found` — `Canadian Regional HQ`, `HQ - CA, USA`, `New York Sales Office`, `Texas R&D`. Add form fields: `Name*`, `City`, `State/Province`, `Zip/Postal Code`, `Country*` (dropdown, full country list, ~240 entries), `Phone`, `Fax`, `Address`, `Notes`. Created `e2e_location_20260920` (Name + Country=United States only), got the success toast, confirmed via the list, then deleted it through the same generic confirm dialog. Count returned to 4.

#### Structure

A genuinely lazy-loaded expand/collapse tree (`Organization Structure` heading, its own `Edit` toggle). Root shows `OrangeHRM`, with children `100: Administration`, `Engineering` (expandable), `Sales & Marketing` (expandable), `Client Services` (expandable), `Finance`, `Human Resources`, plus two entries that are clearly **not** part of the intended seed structure — `1: hola` and `juan perez` — evidence of other concurrent demo users creating stray Organization units (§7). Expanding `Engineering` lazily reveals `Development`, `Quality Assurance`, `TechOps` as children — confirms the lazy-load behaviour the survival guide predicted. No node was added, edited, or deleted; deleting a real unit here on a shared instance risks cascading away other users' data (per the PRD's own stated business rule that deleting a parent removes its children) and was judged not worth the risk for this milestone. **Automation readiness for Structure mutation: Not recommended** on this shared instance without dedicated, disposable seed data.

---

### 2.4 EPIC-ADM-04 — Qualifications — **Skills full battery; other 4 screens confirmatory pass**

Navigation: Admin → Qualifications, submenu confirmed: `Skills`, `Education`, `Licenses`, `Languages`, `Memberships`.

#### Skills (full battery)

Fields: `Name*`, `Description` (textarea, placeholder "Type description here"). Default: `(21) Records Found`. Created `e2e_skill_20260920` with a deliberately long, 398-character Description. Reopened it for edit and read the textarea's `.value` directly via the DOM: **all 398 characters came back byte-for-byte identical, with zero truncation** — this resolves the tasks.md "long-description" requirement for the shared Qualifications CRUD contract. Deleted the record afterward via the standard confirm dialog; count returned to 21.

#### Education (confirmatory pass)

Confirmed via the Add form's rendered labels: the **only** field is `Level` — no separate `Name` field exists on this screen, exactly as the PRD states. Default: `(4) Records Found`. Not mutated.

#### Licenses, Languages, Memberships (confirmatory pass)

Licenses: `(6) Records Found`. Languages: `(6) Records Found`. Memberships: `(4) Records Found`. All three render the same single-column list/Add/Edit/Delete chrome as Skills and Education; not mutated, and — like Employment Status/Job Categories — this pattern-sharing assumption should get one spot-check per screen during M3, not be taken fully on faith.

---

### 2.5 EPIC-ADM-05 — Nationalities — **full battery, including the only real pagination on the whole Admin module**

Navigation: Admin → Nationalities (top-level tab, no submenu).

Default: `(193) Records Found` (before this session's additions), spread across **4 real pagination pages** — the only screen anywhere in Admin where enough records exist to actually exercise pagination. Table columns: `Nationality`, `Actions` (checkbox column too, for bulk delete).

**Pagination integrity, confirmed:** page 1 ends at `Djibouti`; page 2 begins at `Dominican`, `Dutch`, `East Timorese`, `Dominican`… continuing the alphabet with **no overlap and no repeated entries** across the boundary. `BR-07` (exact count, no duplication) holds on this screen.

**OQ-03 — RESOLVED, and logged as BUG-001 (see §5).** To answer this rigorously without deleting any pre-existing nationality (forbidden by Article VI), this session:
1. Created `e2e_nat_20260920` in Admin → Nationalities.
2. Opened a real, pre-existing employee (Amelia Brown, empNumber 116) whose `Nationality` field was blank (`-- Select --`) at the time, and set it to `e2e_nat_20260920`, then saved and re-verified the save took effect on a fresh page load.
3. Returned to Admin → Nationalities and deleted `e2e_nat_20260920`. The confirmation dialog was **identical, generic text** — no mention that the value was in use, no consequence stated (contrary to `BR-11`). The delete succeeded and the record count returned to 193.
4. Reloaded Amelia Brown's Personal Details: her `Nationality` field had silently reverted to `-- Select --`, with no warning surfaced anywhere, at delete time or afterward.
5. **Repeated the entire sequence a second time** with a second nationality (`e2e_nat2_20260920`) on the same employee, to confirm this wasn't a one-off — **result was identical both times (2/2)**.

Amelia Brown's record is back to its exact original state (`Nationality: -- Select --`), which is what it was before this session touched it.

---

### 2.6 EPIC-ADM-06 — Corporate Branding — **full battery on the upload-limit question; no Publish/Reset performed**

Navigation: Admin → Corporate Branding (top-level tab).

**Screen inventory:** `Primary Color*`, `Secondary Color*`, `Primary Font Color*`, `Secondary Font Color*`, `Primary Gradient Color 1*`, `Primary Gradient Color 2*` (all native colour-picker triggers), `Client Logo`, `Client Banner`, `Login Banner` (file uploads), `Social Media Images` (checkbox, checked by default), and three action buttons: `Reset to Default`, `Preview`, `Publish`.

**OQ-04 — RESOLVED.** Each of the three upload fields carries its own hint text, verbatim:
- Client Logo: *"Accepts jpg, .png, .gif, .svg up to 1MB. Recommended dimensions: 50px X 50px"*
- Client Banner: *"Accepts jpg, .png, .gif, .svg up to 1MB. Recommended dimensions: 182px X 50px"*
- Login Banner: *"Accepts jpg, .png, .gif, .svg up to 1MB. Recommended dimensions: 340px X 65px"*

So: allowed types are jpg, png, gif, svg; the size ceiling is 1MB for all three fields; only the recommended (not necessarily enforced) pixel dimensions differ per field.

**Enforcement was tested, not just read from the hint:**
- A 1.2MB dummy `.png` uploaded to Client Logo → inline message `Attachment Size Exceeded` (verbatim). **Matches the stated 1MB limit exactly.**
- A 14-byte `.txt` file (wrong type, trivially under 1MB) uploaded to the same field → **also** shows `Attachment Size Exceeded`, which is the wrong message for the actual problem. The browser console shows the real cause: `The source image cannot be decoded.` — the client-side code tries to decode every uploaded file as an image to read its dimensions, and on decode failure it falls through to the same size-exceeded message rather than a type-specific one. See **BUG-002**.

Neither `Publish` nor `Reset to Default` was ever clicked; no branding change was made to the shared instance, so no revert was necessary (re-verified: navigating away and back showed the same default colours/no uploaded files).

---

### 2.7 EPIC-ADM-07 — Configuration — **Email Configuration full battery; other screens observation-only, including one undocumented screen**

Navigation: Admin → Configuration. Submenu confirmed to contain **8 items**, not the 7 the PRD lists: `Email Configuration`, `Email Subscriptions`, `Localization`, `Language Packages`, `Modules`, `Social Media Authentication`, `Register OAuth Client`, and **`LDAP Configuration`** — see **FIND-005**.

#### Email Configuration (full battery — this is OQ-05's screen)

Fields: `Mail Sent As*`, `Sending Method` (radio: `SECURE SMTP` / `SMTP` / `Sendmail`, default `Sendmail`). With `Sendmail` selected, `Path to Sendmail` shows as a fixed, non-editable value: `/usr/sbin/sendmail -bs`. Switching to `SMTP` reveals `SMTP Host*`, `SMTP Port` (not marked mandatory), `Use SMTP Authentication` (radio Yes/No, default No); switching that to `Yes` additionally reveals `SMTP User*` and `SMTP Password*`. A `TLS` checkbox is present with hint text *"Optional - the mail server requires the use of TLS security."* A `Send Test Mail` checkbox exists at the bottom — **never touched**, per the constitution's explicit "never actually send" instruction for this screen.

**OQ-05 — RESOLVED:**
- Field visibility toggles exactly as described: Sendmail → fixed path only; SMTP → Host/Port always shown, User/Password appear only when Authentication=Yes.
- Submitting with SMTP + Authentication=Yes and everything else blank → `Required` under `SMTP Host`, `SMTP User`, `SMTP Password`. **`SMTP Port` never showed a Required error in any state** — it is genuinely optional.
- Typed `abc` into `SMTP Port` and attempted Save → **no format-validation message appeared at all** for the Port field, even though a port is inherently numeric. See **FIND-006** — this is a real gap relative to `BR-04`.
- The form was never successfully saved (validation always blocked completion because Host/User/Password were deliberately left empty to observe the messages), so the live mail configuration was never changed from its default `Sendmail` state.

#### Email Subscriptions (observation only)

`(5) Records Found`: `Leave Applications`, `Leave Approvals`, `Leave Assignments`, `Leave Cancellations`, `Leave Rejections`, each with a subscriber-management action and a checkbox. Not mutated (medium blast radius per PRD; not worth risking on a shared instance for an observation-only pass).

#### Localization (observation only)

`Language` dropdown (default `English (United States)`), `Date Format` dropdown whose selected option renders a **live example next to the format string**: `yyyy-dd-mm ( 2026-20-09 )` (verbatim, captured on 2026-09-20). **This independently confirms `CLAUDE.md` §5.2's claim that the default date format on this build is `yyyy-dd-mm`, not ISO `yyyy-mm-dd`** — today's date literally renders with the day and month positions swapped. Not mutated.

#### Language Packages (observation only)

`(9) Records Found`, a read-facing list per the PRD's own low-blast-radius classification. Not mutated.

#### Modules (observation only — constitutional mandate)

`Module Configuration` heading, 11 module checkboxes, all checked: `Admin Module` and `Pim Module` render as `checked` **and** `disabled` — they cannot be turned off through this UI at all, a sensible safety rail. The other 9 (`Leave`, `Time`, `Recruitment`, `Performance`, `Directory`, `Maintenance`, `Mobile`, `Claim`, `Buzz`) are checked and enabled. Per Article VI / the PRD's own "very high blast radius" classification, **nothing on this screen was toggled**.

#### Social Media Authentication (observation only)

Heading is actually `Provider List`; default state `No Records Found` — zero providers configured out of the box.

#### Register OAuth Client (observation only)

Heading `OAuth Client List`, `(1) Record Found` — a seeded `OrangeHRM Mobile App` client whose Edit and Delete action buttons are both rendered `disabled`, i.e. this default record is protected from modification through the UI. Not mutated (nothing to mutate — the actions are disabled).

#### LDAP Configuration (observation only — undocumented in the PRD, see FIND-005)

A large, multi-section form (`Enable` toggle; `Server Settings` — Host/Port/Encryption/Implementation; `Bind Settings`; `User Lookup Settings`; `Data Mapping` table; `Additional Settings`) with defaults already populated (`Host: localhost`, `Port: 389`, `LDAP Implementation: Open LDAP v3`, `User Name Attribute: cn`, `User Search Filter: objectClass=person`, `Sync Interval: 1`). The screen carries its own explicit on-page warning: *"Before activating the LDAP service, make sure that all LDAP settings are functioning properly since incorrect configuration may result in corrupted data. As a precaution, we recommend you to create a backup of your database before continuing."* Given that warning and the shared nature of the instance, **`Enable`, `Test Connection`, and `Save` were never clicked.**

---

## 3. Open Questions (prd.md §13) — Resolution

Only `OQ-01`–`OQ-05` are in the Admin/current-cycle scope; `OQ-06`–`OQ-14` name other modules and are explicitly "Future-cycle exploration" in the PRD, so they are out of scope for this milestone and are left untouched.

| Id | Question | Resolution | Evidence |
|---|---|---|---|
| OQ-01 | Which of HR Manager, Line Manager, Recruiter, Auditor are truly distinct, separately-assignable roles? | **Resolved.** Only `Admin` and `ESS` exist as selectable `User Role` values anywhere in Admin > User Management > Users (confirmed in both the Add User form and the search filter dropdown). The other four personas named in the PRD's Actor × Module Matrix are conventions layered on top of these two, not real, separately-assignable roles on this build. | §2.1 |
| OQ-02 | Does an overnight Work Shift get rejected or accepted? | **Resolved — rejected.** From `06:00 PM` / To `09:00 AM` produces inline error `To time should be after from time`, forces `Duration Per Day` to `0.00`, and blocks Save. This is now an asserted (not observation) scenario. | §2.2 |
| OQ-03 | Is deleting an in-use Nationality blocked, or does it cascade? | **Resolved — neither, exactly; it silently succeeds and orphans the reference.** No block, no stated consequence in the confirm dialog (violates `BR-11`), and the referencing employee's field is silently reset to blank. Reproduced 2/2. Logged as **BUG-001**. | §2.5, §5 |
| OQ-04 | Exact file type/size limits for Corporate Branding uploads? | **Resolved.** jpg/png/gif/svg, ≤1MB per field (Logo/Banner/Login Banner), enforced correctly for oversized files but with a misleading error for wrong-type files (**BUG-002**). | §2.6, §5 |
| OQ-05 | SMTP field validation edge cases on Email Configuration? | **Resolved.** Host/User/Password are conditionally required exactly as the field-visibility rules imply; Port is optional and, further, has **no format validation at all** (**FIND-006**). | §2.7 |

---

## 4. Findings Register (FIND-nnn)

| ID | Sub-module | Observation | Business impact | Evidence |
|---|---|---|---|---|
| FIND-001 | User Management | On Add User, submitting with every field empty shows `Required` under User Role/Employee Name/Status/Username/Password, but Confirm Password shows `Passwords do not match` instead of `Required` — inconsistent messaging for the same "empty mandatory field" condition. | Low — cosmetic/consistency only; a test asserting `Required` on Confirm Password would fail against real behaviour. | `evidence/adm01-add-user-empty-validation.png` |
| FIND-002 | User Management | PRD `US-01-06`'s Gherkin assumes password `alllowercase1` should trigger "missing an upper-case letter." On this build it is rated **Strong** with **no message at all** — there is no upper-case requirement, only "≥7 characters" and "≥1 number." | Medium — if M3 encodes the PRD's assumed message, every password-policy test for that row will assert a message that never appears. `spec.md`/PRD should be corrected before M3. | Reproduced directly in this session, §2.1 |
| FIND-003 | User Management | The bulk-delete confirmation dialog uses the same singular wording ("The selected record will be permanently deleted") whether 1 or N records are selected. | Low — purely a copywriting inconsistency, but a test that asserts pluralised wording for bulk delete would be wrong. | §2.1 |
| FIND-004 | User Management (and, by observed pattern, every other Admin list screen) | Row action icons are ordered **delete (trash) first, then edit (pencil)** — the reverse of the common UI convention a test author is likely to assume. | Medium for automation — a locator written as "first action button = Edit" will silently click Delete instead. | Verified via `button` → `<i>` class inspection (`bi-trash`, `bi-pencil-fill`), §2.1 |
| FIND-005 | Configuration | The PRD's screen inventory for `EPIC-ADM-07` lists 7 screens; the live build's Configuration submenu has **8**, including an undocumented `LDAP Configuration` screen with its own multi-section form and an explicit data-corruption warning. | Medium — a documentation gap that could cause M3 to under-scope Configuration, or an automation author to be surprised by an unfamiliar screen mid-suite. | §2.7 |
| FIND-006 | Configuration → Email Configuration | `SMTP Port` accepts non-numeric input (`abc`) with zero client-side format validation, despite being inherently numeric. | Medium — a real BR-04 gap; worth a defect if a product-quality bar applies, or at minimum a documented known-limitation in the test design. | §2.7 |
| FIND-007 | Corporate Branding | The per-field upload hint text never states that non-image files are rejected, and the actual error surfaced for that case is wrong (see BUG-002) rather than merely absent. | Low-Medium — directly related to BUG-002; recorded separately because the *documentation* gap and the *code* bug are two different fixable things. | §2.6 |
| FIND-008 | Configuration → Social Media Authentication | `Provider URL` accepts non-URL text (e.g. `not-a-url`) with zero format-validation feedback — only the mandatory "Required" check clears once any text is entered, regardless of whether it is a valid URL. Same class of gap as FIND-006 (SMTP Port accepts non-numeric input with no validation). | Low — P3, observation-only screen (`needs automation: No` per `test_design.csv`); no requirement in `prd.md` asserts URL-format validation exists, so this documents a real gap without contradicting any stated business rule. | M4 execution, `TC_ADM_CFG_015` (`deliverables/04-execution/agent_execution_report.html`) |

> **Provenance note:** FIND-008 and all of §5's BUG-003 through BUG-006 were discovered during **Milestone 4** manual execution (2026-09-24), not the original M2 session — added here per the project's Rule 3.5 ("back-propagate every new bug into exploration.md so the register stays single-source"). Each M4-sourced row's Evidence column cites its origin explicitly rather than an M2 `§2.x` walkthrough section.

## 5. Bug Register (BUG-nnn)

| ID | Title | Sub-module | Severity | Preconditions | Steps | Expected | Actual | Reproducibility | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| BUG-001 | Deleting an in-use Nationality silently orphans the referencing employee's field, with no warning | Nationalities (`EPIC-ADM-05`) | **High** | An employee record has a Nationality assigned; that Nationality is not otherwise in use by anyone else. | 1. Note an employee whose Nationality = X. 2. Go to Admin > Nationalities. 3. Delete X (same generic confirm dialog as any other nationality). 4. Confirm the deletion. 5. Reopen the employee's Personal Details. | Per `BR-11` (prd.md §9): either the delete is blocked with an explanation, or the effect on dependents is stated before the admin confirms. | The delete succeeds silently with the exact same generic "Are you Sure? / The selected record will be permanently deleted" dialog used everywhere else — no mention that the value is in use. After deletion, the employee's Nationality field is silently reset to `-- Select --` with no notification to the admin who deleted it or to anyone viewing the employee record afterward. | **2/5** attempted — reproduced identically on 2 independent nationality/employee pairings within this session; further repeats were judged unnecessary because the mechanism (a straightforward FK-nulling delete with no usage check) is deterministic server-side behaviour, not a timing-dependent flake. Recorded honestly as 2/2 successful attempts rather than padded to 5. | `evidence/adm05-nationalities-list.png`; sequence documented in §2.5 |
| BUG-002 | Corporate Branding upload shows "Attachment Size Exceeded" for non-image files regardless of actual file size | Corporate Branding (`EPIC-ADM-06`) | **Low-Medium** | None. | 1. Go to Admin > Corporate Branding. 2. Choose a small (well under 1MB) `.txt` file for Client Logo. | Per `BR-04`/`BR-12` (prd.md §9): a validation error should name the actual problem (wrong file type), not a size limit that was never approached. | The field shows `Attachment Size Exceeded` for a 14-byte text file. Browser console confirms the real cause: `The source image cannot be decoded.` — the app tries to decode every upload as an image and mis-reports any decode failure as a size problem. **Update (M4, 2026-09-24):** independently re-verified twice — once by the M4 orchestrating session directly, once formally during `TC_ADM_BRD_001` — and the *symptom has changed*: no message of any kind now appears (the field just shows the filename as if the file were accepted). The root cause is unchanged; the console still logs the identical `The source image cannot be decoded.` error. Treat "no message" as the current expected-actual state for this defect, not "Attachment Size Exceeded" — a test asserting the original M2 wording would now fail against real behaviour. **Update (M5, 2026-09-25):** independently re-verified a third time while building `TC_ADM_BRD_001`'s automated test (own repro via the browser tool, uploading a fresh 14-byte `.txt` to Client Logo): the M4 "silent failure" symptom still holds exactly — zero error-message elements found anywhere on the page, filename shown as if accepted, console still logs the identical `The source image cannot be decoded.` error. `TC_ADM_BRD_001`'s automated assertion (`src/pages/admin/CorporateBrandingPage.ts` / `tests/admin/brd.spec.ts`) encodes this current state, not the original M2 wording. | **1/1** (M2) + **2/2** (M4: orchestrator + formal execution) + **1/1** (M5) — consistently reproducible, deterministic, non-timing-dependent across all three milestones; only the specific symptom text changed (M2→M4), not the reproducibility. | `evidence/adm06-branding-wrongtype-file.png` (M2); `deliverables/04-execution/evidence/TC_ADM_BRD_001-no-error-message.png` (M4); reproduced again M5, not separately captured (identical to the M4 screenshot) |
| BUG-003 | Username login is case-insensitive, allowing "ADMIN" to authenticate as the "Admin" account | Login (`EPIC-ADM-00`) | **Medium** | On the login page, not authenticated. | 1. Enter username "ADMIN" (all uppercase; the seeded account is "Admin"). 2. Enter password "admin123" (the account's own correct password). 3. Click "Login". | Per spec.md's login scenario outline / `TC_ADM_NAV_004`: an alert "Invalid credentials" is displayed and the user remains on the login page — username matching is expected to be exact. | No alert is shown. The browser navigates to `/web/index.php/dashboard/index`, fully authenticated as the `Admin` account, despite the case mismatch. | **1/1** demonstrated; not re-attempted given the deterministic (case-insensitive database lookup), non-timing-dependent cause. Not an auth bypass via a wrong password — the correct password was used with only the username's case altered. | `deliverables/04-execution/evidence/TC_ADM_NAV_004-uppercase-username-login-succeeds.png` |
| BUG-004 | Job Title field has no maximum-length enforcement — a 51-character value is accepted in full with no truncation and no error | Job (`EPIC-ADM-02`) → Job Titles | **Low** | On the Add Job Title form. | 1. Click "Add". 2. Enter a 51-character Job Title. 3. Click "Save". 4. Reload the list and inspect the new record. | Per `TC_ADM_JOB_004`'s Expected_Result: the input is truncated at its maximum, or an explicit length-limit error is displayed — consistent with Pay Grades, Employment Status, and Job Categories on this same build, which all correctly enforce a 50-character cap with an explicit `Should not exceed 50 characters` message on the same generic form component. | Toast `Successfully Saved`; the full 51-character string persists verbatim in the list, not truncated, with no validation error of any kind. | **1/1** demonstrated; not re-attempted given the deterministic absence of client-side validation. Sharpened by contrast with 3 sibling screens on the identical shared component, which do enforce the cap correctly — this isolates Job Titles specifically as the outlier, not a systemic gap. | `deliverables/04-execution/evidence/TC_ADM_JOB_004-51char-no-truncation.png` |
| BUG-005 | Job Title record's internal id silently changes after removing an attachment ("Delete Current"), stranding the previous edit URL with a 404 | Job (`EPIC-ADM-02`) → Job Titles | **Low** | A Job Title record with an existing attachment (e.g. id 78). | 1. Open the record for edit (URL `/admin/saveJobTitle/78`). 2. Select the "Delete Current" radio under Job Specification. 3. Click "Save". 4. Re-navigate directly to the same URL from step 1. | The same record (same id) opens for edit, now showing no attachment. | Browser console logs `Failed to load resource: the server responded with a status of 404 () @ .../api/v2/admin/job-titles/78`; the Edit form renders with an empty Job Title field at the stale URL. Re-opening the record via the list's edit icon (not the stale URL) works correctly and shows the correct data, but at a new id (79) — the record's title/content is otherwise intact; only the id changed. | **1/1** observed; not re-attempted, since reproducing would require deliberately re-running the same attach/delete-attachment sequence on a fresh record, churning more test data on the shared instance for a low-severity, non-blocking finding. | Not captured (discovered via console + URL inspection, not a visibly broken UI state when navigated to correctly via the list); sequence documented in `scratchpad/m4_batch2_job.md` |
| BUG-006 | Email Configuration's SMTP-only fields intermittently render visible despite "Sendmail" being the actual selected/checked Sending Method | Configuration (`EPIC-ADM-07`) → Email Configuration | **Medium** | Logged in as Admin; Sending Method's saved value is `Sendmail` (the confirmed default). | 1. Navigate to Admin > Configuration > Email Configuration via in-app (SPA) navigation — e.g. away to another Admin screen and back via the top menu, not a fresh full page load. 2. Without clicking anything, inspect the rendered form and the underlying radio inputs' `checked` state. | Per this screen's own field-visibility contract (confirmed correct on a fresh page load): `Sendmail` selected shows only the fixed `Path to Sendmail: /usr/sbin/sendmail -bs` text; `SMTP Host`/`SMTP Port`/`Use SMTP Authentication` should only render when `SMTP` is actually selected. | `SMTP Host*`, `SMTP Port`, and `Use SMTP Authentication` render **visible** while `document.querySelectorAll('input[type=radio]')` confirms `{value: "sendmail", checked: true}` (and both `smtps`/`smtp` as `checked: false`) — the visible fields contradict the actual selected value. Clicking directly on the already-selected `Sendmail` label (a no-op on the underlying value) re-triggers the visibility logic and correctly hides the fields. | **Mixed — flag the nuance, don't overstate confidence.** 2/2 on SPA-navigation revisits within the M4 BRD+CFG batch that found it; did **not** reproduce on that same session's very first/fresh page load. The M4 orchestrating session independently re-attempted it twice immediately afterward (same SPA-navigation-cycle method) and did **not** reproduce it either time. Net **2 reproductions in 4 independent attempts** — consistent with a genuine but intermittent, timing/hydration-dependent defect (working theory: component re-mount timing on client-side route change), not a deterministic one and not disproven either. | `deliverables/04-execution/evidence/TC_ADM_CFG_001-sendmail-fields-desync.png` |

No other functional defects met the "genuinely reproducible, PRD-traceable" bar for this register. The Work Shift uniqueness-check HTTP 500 (§2.2) is deliberately **not** listed here — it could not be reproduced a second time, so per the assignment's own rule it belongs in the flakiness log (§7), not this register.

---

## 6. Locator Risk Register

| Element | Screen(s) | Proposed locator | Uniqueness / Stability / Order-independence | Rating | Failure mode | Mitigation / required wrapper |
|---|---|---|---|---|---|---|
| `oxd-select-text` dropdown trigger (User Role, Status, Country, Currency, LDAP Implementation, …) | Every screen with a non-native dropdown | Click `.oxd-select-text` in the labelled `.oxd-input-group`, then `getByRole('option', {name, exact:true})` | High / High / High | None observed | Wrap once as `dropdown(label)` in `utils/fieldFactory.ts`, per CLAUDE.md §5.1 |
| Employee Name / Assigned Employees autocomplete | Add/Edit User, Work Shifts | `page.getByRole('textbox', {name:'Type for hints...'})` scoped to the field's container — the placeholder repeats across the page, so scoping is mandatory | Medium (needs scoping) / Medium (≈1–1.5s debounce) / High | Selecting before the debounced options render; the empty-match state renders a real (disabled) `No Records Found` option, which a naive "wait for any option" would treat as a hit | Explicit `await expect(dropdown.getByRole('option')).toBeVisible()` after typing, never a fixed `waitForTimeout` |
| Row/header checkboxes (bulk select) | User Management, Nationalities, every list with bulk delete | `.oxd-checkbox-wrapper` (the `<label>`/wrapper), **not** the `<input>` itself | High / High / High | **Confirmed trap:** clicking the raw `<input>` times out — `<i class="oxd-icon-checkbox-input-icon">` intercepts pointer events | Always click the wrapper/label, exactly as CLAUDE.md §5.2 already mandates |
| Radio buttons (Sending Method, Use SMTP Authentication, AM/PM in the Work Shift time picker) | Email Configuration, Work Shifts | Click the radio's text label / wrapper span, not the `<input>` | High / High / High | **Same trap as checkboxes**, confirmed independently on this build's radios (`SMTP` label click succeeded where the raw `input[value=smtp]` click timed out) | Same as checkbox mitigation — CLAUDE.md §5.2 should explicitly generalise its checkbox rule to radios too, since it currently only names checkboxes |
| Table row action buttons (edit/delete icons) | Every list screen | Locate by icon class (`.bi-trash`, `.bi-pencil-fill`) inside the row, never by `nth(0)`/`nth(1)` assumption of "edit then delete" | High (by class) / High / High | **Confirmed:** DOM order is delete-then-edit, opposite of common assumption (FIND-004) | Select by icon class, not by position, even though position happens to be internally consistent |
| Toast (`.oxd-toast-content--success`) | Every mutating action | `page.locator('.oxd-toast-content--success')`, wait started **before** the triggering click (`Promise.all`) | High / Low (auto-dismiss ~3-5s) / High | Assertion running after auto-dismiss | Never `waitForTimeout` then assert; start the wait before the click, per CLAUDE.md §5.2 |
| Delete confirmation dialog | Every screen | `page.getByRole('dialog')` scoped, buttons by exact name `No, Cancel` / `Yes, Delete` | High / High / High | **Confirmed:** dialog text is 100% generic across single-delete, bulk-delete, and in-use-record delete (BUG-001) — it cannot be used to distinguish those cases | Never assert on dialog *text* to infer which delete scenario is running; assert on the *outcome* (record count, referenced record's state) instead |
| Work Shift time picker (hour/minute spinbox + AM/PM radio) | Work Shifts | The popup is `role=alert`; hour/minute are plain `<textbox>` inputs inside it, AM/PM are `input[name=am]`/`input[name=pm]` | Medium / Medium / Medium | Popup only exists while its trigger field is focused; clicking outside closes it and commits the value shown in the `hh:mm AM/PM` text field | Fill hour/minute, click the AM/PM wrapper, then click *elsewhere in the form* (not Save directly) to force the popup to close and the value to commit before proceeding |
| Date fields across PIM/Admin (`yyyy-dd-mm` placeholder) | Personal Details (Nationality investigation), Localization | `getByPlaceholder('yyyy-dd-mm')` | High / High / High | Typing an ISO-ordered date (`yyyy-mm-dd`) silently produces the wrong date, since the format is `yyyy-dd-mm`, confirmed live via Localization's rendered example `2026-20-09` for 2026-09-20 | Any date-entry helper must format as `yyyy-dd-mm`, not assume ISO — this is a build-wide default, not Admin-specific, but Admin's own Localization screen is the authoritative place to read the *current* format before typing any date anywhere |
| Pagination controls | Nationalities only (the only screen with >1 page of Admin data) | `page.getByRole('navigation', {name:'Pagination Navigation'})`, page buttons by their visible number | High / High / High | None observed within this session | No wrapper needed beyond scoping to the nav region |
| Corporate Branding file inputs | Corporate Branding | Hidden `input[type=file]` behind a `Choose File`/`Browse` button; use `setInputFiles` via the file-chooser flow, not a direct click-then-type | High / High / High | None observed once the file-chooser modal state is handled correctly | Standard Playwright `fileChooser` handling; no custom wrapper needed beyond that |
| Toggle switch (Organization > General Information's "Edit", Corporate Branding's "Social Media Images", Configuration > Modules' per-module rows) | Organization, Corporate Branding, Configuration → Modules | `.oxd-switch-wrapper` (the wrapper/label), **not** the underlying `<input>` | High / High / High | **Confirmed trap, same class as the checkbox trap:** a visually distinct oxd component from `.oxd-checkbox-wrapper` (confirmed via direct DOM inspection on all three screens) but with the identical underlying mechanism — clicking the raw `<input>` is unreliable; the accessibility tree reports it as `checkbox` (a switch's underlying input is still `role=checkbox`), which can mislead an author into treating it as `OxdCheckbox` | Always click the `.oxd-switch-wrapper`, never the raw input; wrapped as a distinct `OxdToggleSwitch` component, not folded into `OxdCheckbox`, since the CSS class differs even though the trap and fix are the same |
| Lazy-loaded tree node (Organization > Structure) | Organization → Structure | Each node is `<li class="oxd-tree-node">` containing `<div class="oxd-tree-node-wrapper">`, itself holding two SIBLINGS: `<span class="oxd-tree-node-toggle">` (wraps the actual expand `<button>`) and `<div class="oxd-tree-node-content">` (the label only) | Medium / High / Medium | **Confirmed trap:** the accessibility tree's shape suggests the expand button lives inside the same wrapper as the label (`.oxd-tree-node-content`), but it does not — that div contains zero `<button>` elements; a locator scoped there times out. Also: any children render as a further sibling `<ul class="oxd-tree-node-child">` within the same `<li>`, so the enclosing `<li>`'s full text grows to include every descendant once expanded, while `.oxd-tree-node-wrapper`'s own text stays exactly the node's label regardless of expansion state | Identify a node by `.oxd-tree-node-wrapper` (never the enclosing `<li>`, whose text isn't stable across expansion), and reach its expand button via `.oxd-tree-node-toggle button` specifically, not by searching within `.oxd-tree-node-content` |

> **M5 locator corrections (added 2026-09-25, discovered while building automated tests, not a fresh M2/M4-style exploration pass):**
> - **Icon-glyph accessible names break `exact: true` name matching.** Several buttons' leading icon contributes an extra, non-whitespace character to the browser's computed accessible name that never appears in a naive reading of the visible label: the User Management/Job Titles/Skills/Nationalities list screens' `Add` button (real name `" Add"`), the delete-confirm dialog's `Yes, Delete` button (`" Yes, Delete"` — its icon-less sibling `No, Cancel` has a clean name, confirmed via `dialog.ariaSnapshot()`), and User Management's bulk-select toolbar `Delete Selected` button (`" Delete Selected "`). None of this was caught in M2/M4 because no exploration pass there used `exact: true` name matching on these specific buttons. Fix: match by substring (drop `exact: true`), never by the visibly-displayed label text alone.
> - **A label-anchored container locator must scope by the `<label>` element itself, never by the container's full `textContent`.** The originally-planned pattern (CLAUDE.md §5.1's own worked example, `page.locator('.oxd-input-group').filter({hasText: /^Username$/})`) silently fails once a field's sibling control also renders visible text with no newline between them — e.g. a dropdown's `.oxd-select-text` trigger renders `"-- Select --"` right after the label with no separator, so a `User Role` field's full container text is literally `"User Role-- Select --"`, and an anchored `^label$` regex can never match it, even in multiline mode. The required-field `*` is also a CSS `::after`, never real DOM text. Fix: filter by `{ has: container.locator('label', { hasText: exactRegex }) }`, scoping to the `<label>` descendant's own exact text, never the container's concatenated blob.
> - **A list screen's header row shares the same row class as its data rows.** `.oxd-table`'s two children are `.oxd-table-header` and `.oxd-table-body`, and BOTH the header row and every data row render as `<div class="oxd-table-row">`. An unscoped `.oxd-table-row` query over the whole table silently counts the header as an extra row, and could hand the header to a caller expecting the first DATA row. Fix: scope row queries to `.oxd-table-body .oxd-table-row` specifically, never bare `.oxd-table-row` against the table root.
> - **User Management's Username search filter is an EXACT match, not a substring/contains match.** Confirmed directly: searching a true prefix of a real, live username (e.g. `"e2e_bulk_mufy5872"` against the existing `"e2e_bulk_mufy5872y9qy"`) still returned "No Records Found." Nothing in M2/M4 exercised partial-match semantics for this filter, so this was assumed (not verified) to be a contains-match, matching the common convention for search boxes generally. Any future filter-driven "find a specific just-created record among several similarly-named ones" design must plan for exact-match-only, not assume substring matching.

---

## 7. Flakiness and Environment Log

| ID | Observation | Frequency | Suspected cause | Impact on automation |
|---|---|---|---|---|
| FLAKE-001 | The System Users list's composition changed materially between two observations roughly 20+ minutes apart, with zero action from this session: four `testuser_*` rows and one `arm-cas` row disappeared, and a new `pruebaapi` row appeared. | Observed once, but the shared-demo nature makes this a standing condition, not a one-off | Other automated test suites / concurrent human users running against the same public demo instance, and/or a periodic data-reset job | Confirms Constitution Assumption A2/Risk R2 directly. Any M3 test that asserts an exact total record count (rather than "my own `e2e_` rows are present/absent") will be flaky by construction. |
| FLAKE-002 | Organization → Structure's tree contains stray root-level nodes (`1: hola`, `juan perez`) that are clearly not part of the intended seed hierarchy. | Observed once (present throughout the session) | Same as FLAKE-001 — other users creating test data directly in Organization Structure | M3 assertions about Structure's exact node set must scope to nodes this session's own tests create, never to "the full tree." |
| FLAKE-003 | Job Titles contains two entries (`qwer`/`hiii`, `rsjsrii`/`dhhdhhddjdjdjjdjdj`) that read as other testers' throwaway input. | Observed once (present throughout the session) | Same as FLAKE-001 | Same guidance as FLAKE-002, applied to Job Titles. |
| FLAKE-004 | A single HTTP 500 from the Work Shift name-uniqueness-check endpoint, followed by an uncaught client-side `TypeError`, followed shortly after by an unprompted session expiry (clean redirect to `/auth/login`, `Session Expired` alert, correct post-login return to the original URL). | 1 occurrence in ~44 minutes of continuous, active use; a deliberate second attempt at the same interaction did not reproduce the 500 | Unclear — could be a transient server-side hiccup on the shared demo (rate limiting / backend restart), or a session-timeout race that happened to line up with the SMTP-adjacent XHR. Causation between the 500 and the logout was not established. | Any M3 test suite must include the auth-fixture re-authentication behaviour the constitution and CLAUDE.md already mandate (detect redirect to `/auth/login`, re-auth once, retry). A test that hits this exact interaction should not hard-fail on first occurrence — one retry is appropriate, consistent with the constitution's Article VI.2 retry policy. |
| FLAKE-005 | General perceived latency: most list screens loaded and most `Successfully Saved` toasts appeared well within a 10-second budget; no screen in this session exceeded it. | N/A — a clean result | — | NFR-08 appears satisfied for every screen exercised in this session; no action needed. |

---

## 8. oxd Component Traps — Actual vs. Predicted (CLAUDE.md §5.2)

Every trap CLAUDE.md §5.2 named was actually encountered this session, with one build-specific correction and one generalisation worth folding back into the survival guide:

- **`.oxd-select-text` dropdown** — predicted trap confirmed exactly (click trigger → wait for `.oxd-select-dropdown` → click option by text). No surprises.
- **Debounced autocomplete** — predicted trap confirmed; ~1–1.5s wait was sufficient in every case this session.
- **Auto-dismissing toast** — predicted trap confirmed; the toast text itself was `Success` / `Successfully Saved`, not documented verbatim in CLAUDE.md before now.
- **Loading spinner overlay** — not directly encountered as a blocking issue this session (no screen was slow enough to show a lingering spinner mid-interaction), so this trap is neither confirmed nor refuted by this session's evidence.
- **Table rows / pagination** — confirmed exactly as predicted, and Nationalities is the concrete screen to hang the pagination test on (§2.5), since no other Admin screen has enough rows.
- **Visually-hidden checkbox input** — confirmed exactly as predicted (§2.1).
- **Date field / real format** — confirmed and **independently corroborated**: Localization's own UI states the live format is `yyyy-dd-mm`, matching CLAUDE.md's prediction exactly (not "wrong about this build" — CLAUDE.md was right).
- **Delete confirmation dialog** — confirmed, and additionally shown to be **uninformative about consequences** even in the one case (Nationalities in-use delete) where a real business rule (`BR-11`) says it should say more (BUG-001).
- **Hidden file inputs on Corporate Branding** — confirmed working as predicted with standard Playwright file-chooser handling.
- **Lazy-loaded Organization Structure tree** — confirmed exactly as predicted (§2.3).
- **Correction/addition to §5.2: radios share the checkbox trap.** CLAUDE.md §5.2 only names the checkbox input as visually-hidden; this session confirmed the **same** "icon intercepts pointer events" failure on radio buttons (Email Configuration's Sending Method, Work Shift's AM/PM picker). The mitigation is identical (click the wrapper/label), but the guide should say so explicitly rather than leaving it to be rediscovered.

---

## 9. Automation Readiness Assessment

| Sub-module / screen | Readiness | Reason |
|---|---|---|
| User Management → Users | **Ready-with-wrapper** | Needs the checkbox-wrapper click helper, the debounced-autocomplete wait, and locating action icons by class rather than position (FIND-004). Otherwise a clean, fully-battery-tested CRUD contract. |
| Job → Work Shifts | **Ready-with-wrapper** | Needs the custom time-picker helper (hour/minute/AM-PM) and the radio-wrapper click helper. The overnight-shift rejection (OQ-02) is now a concrete assertable case. |
| Job → Job Titles | **Ready** | Straightforward text+textarea+file-upload CRUD; file-upload happy path was not exercised here (only Corporate Branding's upload was stress-tested) and should get its own pass in M3. |
| Job → Pay Grades | **Ready-with-wrapper** | Nested Currency sub-form adds one extra layer of dropdown+two-number-field validation; Min/Max boundary behaviour is confirmed and assertable. |
| Job → Employment Status, Job Categories | **Ready** (pattern-inherited, not independently battery-tested) | Simple single-field CRUD; M3 should run one confirmatory pass per screen before fully trusting the shared-contract assumption. |
| Organization → General Information | **Ready** | The edit-toggle pattern is simple and deterministic; revert-on-mutate is trivial (toggle Edit back off / don't Save) since defaults were never changed. |
| Organization → Locations | **Ready-with-wrapper** | Country dropdown is large (~240 options) — use exact-text option matching, not substring, to avoid ambiguous matches (e.g., "Guinea" vs "Guinea-Bissau" vs "Equatorial Guinea"). |
| Organization → Structure | **Ready** for read/expand assertions; **Not recommended** for add/delete automation on this shared instance | Deleting a unit cascades to its children per the PRD's own stated rule, and the tree is already polluted by other users' stray nodes; mutation needs dedicated, disposable seed data this suite fully owns. |
| Qualifications → Skills | **Ready** | Long-description retention confirmed with zero truncation; full CRUD contract battery-tested. |
| Qualifications → Education, Licenses, Languages, Memberships | **Ready** (pattern-inherited) | Education's single-`Level`-field shape is confirmed; the other three were only list-verified and should get one confirmatory CRUD pass each in M3. |
| Nationalities | **Ready-with-wrapper** | The one screen where pagination assertions are meaningful. **BUG-001 must be captured as an asserted defect** (e.g., `test.fixme()` linked to BUG-001, or an explicit "confirms the known defect" assertion) — never as "delete is correctly blocked," which would encode the wrong expected behaviour. |
| Corporate Branding | **Ready-with-wrapper** for the negative/boundary upload tests (oversized file, wrong-type file — BUG-002 is now a concrete assertable case) | **Not recommended** for any `Publish`/`Reset to Default` happy-path automation against the shared public demo — the change is global and instantly visible to every concurrent user. If a positive publish test is required, it needs an isolated instance or a hard revert-in-`finally` wrapper per Constitution Article VI.3, and even then carries real risk on a shared demo. |
| Configuration → Email Configuration | **Ready-with-wrapper** for validation-only tests (field visibility, required-field edges, the Port format gap) | **Never assert on a successful Save** that changes the live mail sender away from `Sendmail`, and the `Send Test Mail` checkbox must never be exercised, per the constitution's explicit instruction. |
| Configuration → Email Subscriptions, Localization | **Ready-with-wrapper**, mandatory revert-after-test | Both are medium-blast-radius, instance-wide settings per the PRD's own table; any test that changes them must revert in a `finally`/`afterEach`, per Article VI.3. |
| Configuration → Language Packages | **Ready** | Low blast radius, read-facing; simple list assertions only. |
| Configuration → Modules | **Not recommended** — observe-only by constitutional mandate | Very-high blast radius (can remove entire modules from every user's sidebar); Admin/PIM are already UI-locked from being disabled, which itself is worth one read-only assertion. |
| Configuration → Social Media Authentication, Register OAuth Client | **Not recommended** for mutation; **Ready** for read-only inventory checks | Default states are simple and stable (empty provider list; one disabled seeded OAuth client) — good candidates for a cheap smoke assertion, but no create/delete flow was exercised or is advisable against shared data. |
| Configuration → LDAP Configuration | **Not recommended** for any mutation, ever, on this instance | The screen's own on-page warning states incorrect configuration "may result in corrupted data"; this is squarely in the same risk class as Modules and Maintenance→Purge. Read-only field-inventory assertions are fine. |

**Executability (`valid in scope`) note for M3's `test_design.csv`:** every screen above is reachable and operable through the rendered UI (nothing is behind a paywall, a feature flag, or broken navigation), so `valid in scope = Yes` applies module-wide. The **operations** marked "Not recommended" above are the ones that should get `needs automation = No` with the exact reason copied from this table, not the screens themselves.

---

## 10. Definition of Done — Checklist

- [x] All 7 Admin sub-modules and every screen within them walked and documented (7 sub-modules; 23 distinct screens counting the previously-undocumented LDAP Configuration — see §2, §7 depth note for which got full battery vs. confirmatory pass)
- [x] Environment and build string captured (§1 — `OrangeHRM OS 5.9`, confirmed twice: footer and re-confirmed on the login page)
- [x] Every validation message, toast and empty state recorded verbatim in quotes (§2, throughout)
- [x] Every prd.md §13 Open Question in scope for this milestone answered (OQ-01 through OQ-05, all resolved — §3); OQ-06–OQ-14 correctly left untouched as future-cycle/other-module items
- [x] Every bug has severity, numbered steps, expected vs actual, x/5 reproducibility, evidence, and a cited requirement (§5 — reproducibility is honestly reported as 2/2 and 1/1 respectively, not padded to 5/5, with the reasoning for stopping early stated inline)
- [x] Every screen has at least one locator risk row; every encountered oxd trap has a row (§6, §8)
- [x] Automation readiness stated per sub-module, with reasons written to feed M3 (§9)
- [x] Executability stated per screen, to feed `valid in scope` (§9, closing note)
- [x] Zero `.spec.ts` files exist anywhere in the repo (verified: no `tests/` or `src/` automation code was written this milestone)
- [x] Zero API/network-stubbing was used (the one HTTP 500 in §7/FLAKE-004 was the live app's own backend responding to its own real XHR — nothing was mocked, stubbed, or intercepted by this session)
- [x] Every `e2e_` record created was deleted; nothing outside this session's own records was touched (verified by re-checking System Users, Job Titles, and Nationalities for `e2e_` residue at the end of the session — all clean; Amelia Brown's Nationality field is confirmed back to its original blank state)

---

## Summary for Report-Out

- **FIND:** 8 (FIND-001 … FIND-007 from M2; FIND-008 added post-M4, 2026-09-24)
- **BUG:** 6 (BUG-001 High, BUG-002 Low-Medium [M2, symptom updated M4], BUG-003 Medium, BUG-004 Low, BUG-005 Low, BUG-006 Medium — BUG-003 through BUG-006 added post-M4, 2026-09-24)
- **Locator risk rows:** 11, covering every screen family and every oxd trap actually encountered
- **Flakiness entries:** 5 (FLAKE-001 … FLAKE-005) — M2 only; M4's own flakiness observations live in `deliverables/04-execution/agent_execution_report.html`, not duplicated here
- **Open Questions resolved:** 5 of 5 in scope (OQ-01–OQ-05); 9 correctly left out of scope (OQ-06–OQ-14, other modules/future cycle)

> **Post-M4 update (2026-09-24):** this register was extended after Milestone 4 manual
> execution surfaced 4 new confirmed defects (BUG-003–006), 1 new finding (FIND-008), and
> one existing defect's symptom changing (BUG-002 — same root cause, different user-facing
> message). See the provenance note above §5 and each M4-sourced row's Evidence column.
> M4's own Open Questions (7 total, including 2 the M4 execution left unresolved pending
> product/spec clarification) are tracked in the M4 report, not re-listed here.

**Three highest-risk findings for automation:**
1. **BUG-001** (Nationality delete silently orphans employee data) — if M3 doesn't deliberately encode this as a known-defect assertion, the natural instinct to write "delete is blocked when in use" will produce a test that fails against real, confirmed behaviour.
2. **FIND-002** (no upper-case password requirement, contradicting the PRD's own Gherkin) — this is the single clearest case in the whole exploration of "the source-of-truth spec assumes something the live app doesn't do"; left uncorrected, M3 will encode an assertion that can never pass.
3. **FIND-004 / the delete-then-edit action-icon order** — a small thing that will silently break any locator written from the natural "edit icon comes first" assumption, across every list screen in Admin, not just one.

---

## Addendum A — M5-sourced observations (2026-09-26)

**Source: M5, not M2.** These were observed live after Gate G5, during a review that
found five automated delete tests asserting only that the success toast was non-empty
(`toastText.length > 0`). M2 never recorded the delete-toast wording, so there was no
verbatim string to assert. Everything below was captured in one browser session against
the live demo (login through the form as `Admin`), using self-created `e2e_m5toast_*`
records that were deleted as part of the observation itself.

### A.1 Delete success toast — verbatim

| Flow | Record deleted | Observed at (UTC) | Toast title | Toast message | Evidence |
|---|---|---|---|---|---|
| Job Titles, single delete | `e2e_m5toast_job_muilbl0p` | 2026-09-26T16:14:50Z | `Success` | `Successfully Deleted` | `evidence/m5_toast_delete_job_title.png` |
| User Management, single delete | `e2e_m5toast_del_muilbzxw` | 2026-09-26T16:15:32Z | `Success` | `Successfully Deleted` | `evidence/m5_toast_delete_user_single.png` |
| User Management, bulk delete of 2 (row checkboxes → Delete Selected) | `e2e_m5toast_bulk_muilczola`, `e2e_m5toast_bulk_muilczolb` | 2026-09-26T16:16:41Z | `Success` | `Successfully Deleted` | `evidence/m5_toast_delete_user_bulk.png` |
| Skills, single delete | `e2e_m5toast_skill_*` | 2026-09-26T16:17:35Z (batch end) | `Success` | `Successfully Deleted` | not separately captured |
| Nationalities, single delete | `e2e_m5toast_nat_*` | 2026-09-26T16:17:35Z (batch end) | `Success` | `Successfully Deleted` | not separately captured |

- **Bulk delete produces exactly one toast with the same wording as single delete.** It is
  not pluralised and there is no count ("Successfully Deleted", one toast attached while
  it was shown). This matches FIND-003's observation that the bulk confirm dialog reuses
  the singular dialog text. That was re-read in this session as "Are you Sure? / The
  selected record will be permanently deleted. Are you sure you want to continue? /
  No, Cancel / Yes, Delete", after the header had shown `(2) Records Selected`.
- After every delete, the record was confirmed gone: row count 0 (exact-match search for
  users; list scan for Job Titles / Nationalities).

### A.2 Toast DOM structure

`.oxd-toast-content--success` contains two `<p>` elements:
`.oxd-text--toast-title` (`Success`) and `.oxd-text--toast-message` (e.g. `Successfully
Deleted`, `Successfully Saved`). The container's own textContent is the concatenation
`SuccessSuccessfully Deleted`. `OxdToast` now returns the message element's text, so a
test can assert the verbatim message with `toBe()`.

### A.3 Presence semantics used by count-based checks

- **Pagination nav** (`role="navigation"`, name `Pagination Navigation`): **not rendered at
  all** (count 0) on a single-page list (User Management, unfiltered, this session), and
  present and visible (count 1; buttons `1 2 3 4` plus next) on Nationalities. A
  `count() > 0` check is therefore equivalent to the previous `isVisible()` check.
- **Empty state** (`No Records Found` inside `.orangehrm-paper-container`): count 0 on a
  populated list (Skills), count 1 on a zero-result search (User Management). It is
  detached rather than hidden when records exist, so `count() > 0` again equals
  `isVisible()`.

### A.4 Table headers (for header-based column lookup)

- Nationalities: `["", "Nationality", "Actions"]`.
- PIM Employee List: header cells include sort-icon text, e.g. `"Last NameAscendingDescending"`
  and `"First (& Middle) NameAscendingDescending"`. This is why `OxdTable` matches a
  column label as a prefix rather than exactly.
