# Test Design Coverage — /coverage Audit

Executed per `.claude/commands/coverage.md` against `deliverables/03-test-design/test_design.csv`
(203 rows) and `.specify/specs/001-admin-ui/spec.md` at Gate G3. This replaces the earlier
placeholder note that the audit had not been run. Five structural/content gaps were found and
closed (new cases added, one Type mis-tag corrected); the remaining eight `Partial` story
verdicts are explained as justified, not silently closed, per the command's rule.

> **Re-run 2026-09-26 (after `US-07-08` was added).** M2 finding FIND-005 had recorded an
> undocumented LDAP Configuration screen, and its two cases (`TC_ADM_CFG_018`/`019`) traced
> to that finding id because no story existed. The screen is now specified as `US-07-08`
> in prd.md and spec.md, and both rows point at it. Re-run results, checked mechanically:
> prd.md/spec.md id parity holds (34 `US-` ids and 8 `EPIC-ADM-` ids in each, none on only
> one side). Structure is unchanged and clean. **Orphans: 0.** Forward matrix: 25 Full /
> 9 Partial / 0 None of 34, and every one of the 33 pre-existing story rows matched this
> document exactly. Scenario coverage: 170/170. Every W1 `Automation_ID` (52) has exactly
> one test title, with none unimplemented and no orphan tests. Figures below are updated to match.

> **Who decides `valid in scope` and `needs automation`.** These two assignment-mandated
> columns exist so a human can check whether the AI understood the requirements. The
> intended workflow is: the AI produces suggested values with a reason for every `No`, and
> the human reviews and ratifies them. The values in `test_design.csv` are the AI's
> suggestions. The human review runs through
> [`scope_review.xlsx`](scope_review.xlsx): each case shows the AI suggestion and reason
> beside blank cells for the human's own decision, with the decision criteria and the 17
> current out-of-scope cases as worked examples.
> **Status (2026-09-26): review pending.** The worksheet has been issued unfilled and
> `test_design.csv` is unchanged. When the filled sheet comes back, the human's decisions
> will be reconciled into the CSV, the agreement rate recorded here, and this status
> changed to ratified.

## 1. Structural validation

| Check | Result |
|---|---|
| Header byte-exact match to CLAUDE.md §6 (first 18 columns) | **PASS** |
| Column 19 is `automation_wave` (approved addition, prior turn) | **PASS** |
| Duplicate `TC_ID`s | **0** (one collision found and fixed during this audit — see §5) |
| RFC-4180 parse (ragged rows) | **0 ragged rows**, parses cleanly |
| Every `valid in scope = No` has non-empty `scope_reason` | **PASS**, 0 missing |
| Every `needs automation = No` has non-empty `automation_reason` | **PASS**, 0 missing |
| Every `needs automation = Yes` has an `Automation_ID` | **PASS**, 0 missing |
| Total data rows | **203** (was 198; +5 from this audit) |

## 2. Forward matrix — Story → TC_IDs

Classification rule: **Full** = at least one positive-type case (`Functional`/`Navigation`/
`UI-UX`/`Regression`) AND at least one negative-type case (`Negative`/`Validation`) AND, for
stories that imply a length/numeric/time limit, at least one `Boundary`-type case. **Partial**
= some but not all of that. **None** = zero cases. Case counts include cases with
`valid in scope = No` — representation in the design, not automatability, is what this matrix
measures (execution feasibility is M4's concern).

| Story | Cases | Positive | Negative | Boundary (where required) | Verdict |
|---|---|---|---|---|---|
| US-00-01 | 7 | ✓ | ✓ | n/a | **Full** |
| US-00-02 | 7 | ✓ | — | n/a | **Partial*** |
| US-00-03 | 2 | ✓ | ✓ | n/a | **Full** |
| US-01-01 | 5 | ✓ | ✓ | n/a | **Full** |
| US-01-02 | 10 | ✓ | ✓ | ✓ | **Full** |
| US-01-03 | 2 | ✓ | — | n/a | **Partial*** |
| US-01-04 | 4 | ✓ | ✓ | n/a | **Full** |
| US-01-05 | 2 | ✓ | — | n/a | **Partial*** |
| US-01-06 | 3 | ✓ | ✓ | ✓ | **Full** |
| US-02-01 | 13 | ✓ | ✓ | ✓ | **Full** |
| US-02-02 | 12 | ✓ | ✓ | ✓ | **Full** |
| US-02-03 | 10 | ✓ | ✓ | ✓ | **Full** |
| US-02-04 | 9 | ✓ | ✓ | ✓ | **Full** |
| US-02-05 | 11 | ✓ | ✓ | ✓ | **Full** |
| US-03-01 | 5 | ✓ | ✓ | n/a | **Full** |
| US-03-02 | 14 | ✓ | ✓ | ✓ | **Full** |
| US-03-03 | 3 | ✓ | ✓ | n/a | **Full** |
| US-04-01 | 10 | ✓ | ✓ | ✓ | **Full** |
| US-04-02 | 9 | ✓ | ✓ | ✓ | **Full** |
| US-04-03 | 9 | ✓ | ✓ | ✓ | **Full** |
| US-04-04 | 9 | ✓ | ✓ | ✓ | **Full** |
| US-04-05 | 10 | ✓ | ✓ | ✓ | **Full** |
| US-05-01 | 10 | ✓ | ✓ | ✓ | **Full** |
| US-06-01 | 5 | ✓ | ✓ | ✓ | **Full** |
| US-06-02 | 1 | ✓ | — | n/a | **Partial*** |
| US-06-03 | 1 | — | ✓ | n/a | **Partial*** |
| US-07-01 | 5 | ✓ | ✓ | n/a | **Full** |
| US-07-02 | 3 | ✓ | ✓ | n/a | **Full** |
| US-07-03 | 2 | ✓ | — | n/a | **Partial*** |
| US-07-04 | 1 | ✓ | — | n/a | **Partial*** |
| US-07-05 | 3 | ✓ | — | n/a | **Partial*** |
| US-07-06 | 2 | ✓ | ✓ | n/a | **Full** |
| US-07-07 | 2 | ✓ | ✓ | n/a | **Full** |
| US-07-08 | 2 | ✓ | — | n/a | **Partial*** |

**Full: 25 / 34 · Partial: 9 / 34 · None: 0 / 34.**

### Every `Partial` verdict, justified (not silently closed)

Per the command's rule — "if a gap is genuinely justified, say why in the row rather than
closing it silently" — none of these 9 got a fabricated case:

| Story | Why it's Partial and why that's correct |
|---|---|
| US-00-02 | spec.md's own Gherkin for this story is a single Scenario Outline ("Admin top-tabs navigate to the correct screen") — a pure positive nav check. No negative scenario exists in spec.md for this story to cover. Fabricating one would violate the "never assert a behaviour not exploration-verified" discipline for no real gain. |
| US-01-03 | spec.md writes exactly 2 positive scenarios for editing a user (role change, password-optional). No negative edit scenario is specified. |
| US-01-05 | spec.md's pagination story is one positive integrity check. Both a `valid in scope = No` redirect (`TC_ADM_USR_023`) and the actual execution on Nationalities (`TC_ADM_NAT_011`) represent it — there is no negative pagination behaviour described anywhere to cover. |
| US-06-02 | Colour-picker/live-preview is a single positive, visual-judgement scenario per prd.md — already `needs automation = No` for that reason. No negative colour scenario exists. |
| US-06-03 | The one case here (`TC_ADM_BRD_007`) is `valid in scope = No`: the social-media-link URL fields it would validate were never observed in Corporate Branding's M2 screen inventory (exploration.md §2.6) — presence on build 5.9 is unconfirmed. Adding a fabricated "positive URL accepted" case for a field that may not exist would itself be the kind of unverified assertion Constitution Article V forbids. |
| US-07-03 | spec.md's only Localization scenario is the positive persistence check. No negative scenario is specified for this story. |
| US-07-04 | prd.md's story text mentions "download/empty state," but Language Packages is a system-derived, non-admin-editable list (not CRUD) — there's no admin action that would empty it to exercise a genuine negative/empty case against. |
| US-07-08 | LDAP Configuration (added 2026-09-26 from FIND-005) is observe-only: the screen warns that incorrect configuration "may result in corrupted data", so Enable, Test Connection and Save were never clicked in M2 (`TC_ADM_CFG_019` is `valid in scope = No` for that reason). With no submission, there is no validation behaviour to observe, and writing a negative case would assert something never seen (Constitution Article V). |
| US-07-05 | Modules is a checkbox-state inventory screen with no validation-message dimension. The only "negative" angle — actually toggling a module off — is `valid in scope = No` by explicit blast-radius policy (this session's ruling, and exploration.md §9), so no in-scope negative case is available to add. |

## 3. Reverse matrix — orphans

Every `TC_ID`'s `Story_ID` was checked against the 34 `US-nn-yy` ids in spec.md/prd.md.
**203 of 203 rows map to a real story. Orphans: 0.**

History: until 2026-09-26, two rows traced to a finding id instead of a story. They are kept
here as the record of how that was resolved:

| TC_ID | Story_ID | Disposition |
|---|---|---|
| `TC_ADM_CFG_018` | `FIND-005` | Justified, not scope creep. LDAP Configuration is an 8th Configuration screen discovered live during M2 that isn't in prd.md's original 7-screen inventory (`FIND-005`). No `US-` id was ever assigned to it because spec.md is authoritative and not being rewritten mid-cycle; `FIND-005` is the closest traceable id and is used consistently on both LDAP rows rather than left blank. |
| `TC_ADM_CFG_019` | `FIND-005` | Same as above (the "never mutate LDAP" case). |

**Resolved 2026-09-26:** LDAP Configuration is now specified as `US-07-08` (prd.md §8.1 field
inventory and §10.1; spec.md EPIC-ADM-07), and both rows' `Story_ID` is `US-07-08`. FIND-005
is kept as the provenance note in each row's Preconditions.

## 4. Depth check — per CRUD screen

Applies coverage.md's 11-item list (`create, mandatory-empty, duplicate, boundary length,
edit, delete-confirm, delete-cancel, search, empty-state, pagination, reset`) to the 13
list-based CRUD screens in Admin.

| Screen | create | mand.-empty | duplicate | boundary | edit | del-confirm | del-cancel | search | empty-state | pagination | reset |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Users | ✓ | ✓ | ✓ | ✓ **(added)** | ✓ | ✓ | ✓ | ✓ | ✓ | n/a* | ✓ |
| Job Titles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Pay Grades | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Employment Status | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Job Categories | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Work Shifts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Skills | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Education | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Licenses | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Languages | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Memberships | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | n/a† | n/a† |
| Nationalities | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a† | n/a† | **✓** | n/a† |
| Locations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ **(added)** | ✓ **(added)** | n/a‡ | ✓ **(added)** |

\* **Users/pagination** — justified N/A, already documented: exploration.md §2.1 recorded ≤11
records in every observation window, well under one page; forcing 50+ owned records to
exercise pagination would violate Article VI's minimal-footprint rule. Coverage is provided by
Nationalities (`TC_ADM_NAT_011`, tagged `Story_ID = US-01-05`), the only screen with enough
records — this redirect is stated explicitly in `TC_ADM_USR_023`'s `scope_reason`, not a silent
gap.

† **Search / empty-state / pagination / reset, 10 reference-data screens** — justified N/A.
None of Job Titles, Pay Grades, Employment Status, Job Categories, Work Shifts, Skills,
Education, Licenses, Languages, or Memberships has any search/filter UI in exploration.md's
field inventories (§2.2, §2.4) — each is a plain "Add + list + row actions" screen. Pagination
is N/A on all ten for the same reason cited for Nationalities/Users: exploration.md's recorded
record counts (Job Titles ~28-29, Pay Grades 5, Employment Status 6, Job Categories 9, Work
Shifts 2, Skills 21, Education 4, Licenses 6, Languages 6, Memberships 4) are all well under a
single page.

‡ **Locations/pagination** — justified N/A: exploration.md §2.3 recorded exactly 4 Locations
records, well under one page.

**Genuine gaps found and closed (4 cells, 5 rows — Users/boundary needed 1 row; Locations'
search/empty-state/reset needed 1 row each):**
- `TC_ADM_USR_025` — Username boundary length (51 chars). `valid in scope = Yes`,
  `needs automation = No` (unresolved outcome, Article V.3 — same treatment as every other
  unresolved boundary case in this CSV).
- `TC_ADM_ORG_020` — Locations search filter match. `valid = Yes`, `automation = No`
  (confirmed present in M2, never exercised).
- `TC_ADM_ORG_021` — Locations empty state. `valid = Yes`, `automation = No` (same reason).
- `TC_ADM_ORG_022` — Locations reset. `valid = Yes`, `automation = No` (Reset control's
  presence itself wasn't independently confirmed in M2, only the filters were).

## 5. Other findings from this audit (beyond the mandated checks)

- **`TC_ADM_CFG_019` duplicate TC_ID, found and fixed.** The newly-added Email Subscriptions
  gap-closing case was first assigned `TC_ADM_CFG_019`, colliding with the pre-existing LDAP
  "Enable/Test/Save never exercised" row. Renumbered to `TC_ADM_CFG_020` before this report was
  finalized; re-verified 0 duplicates afterward.
- **`TC_ADM_USR_009` mistyped `Validation`, corrected to `Boundary`.** This case tests the
  password length threshold (`"abc"` → "Should have at least 7 characters") — a genuine
  boundary/threshold check that was mislabeled, which caused US-01-06 to misclassify as
  `Partial` even though the content was already covered. Relabeling (not adding a new case)
  resolved it to `Full`. `TC_ADM_USR_010` (missing-digit composition check) correctly stays
  `Validation` — that one isn't a length boundary.
- **Gap found via forward-matrix review, not the depth-check table:** `TC_ADM_CFG_020` —
  Email Subscriptions previously had only a toggle-on/off case and an email-format-validation
  case; "add/remove a subscriber," a distinct action named in prd.md's US-07-02 description,
  had no representing row at all. Added.

## 6. Headline metrics

| Metric | Value | Definition |
|---|---|---|
| **Story coverage** | **100.0%** (34/34) | Every `US-nn-yy` story in spec.md has ≥1 representing `TC_ID`. |
| **Scenario coverage** | **170/170 (100.0%)** (168/168 before `US-07-08`'s 2 scenarios were added on 2026-09-26; both are represented, by `TC_ADM_CFG_018` and `TC_ADM_CFG_019`) | Denominator = every distinct scenario unit in spec.md: 134 explicit Gherkin instances (32 standalone `Scenario:` blocks + 102 `Scenario Outline:` × Examples-row instances, including the shared 7-outline × 11-screen CRUD contract table counted once per outline) + 36 prose-derived scenario units for stories spec.md describes only in prose (Locations' CRUD+search, Structure's lazy-load, Configuration's per-screen behaviors, etc.). **The 36 prose-derived units involved reasonable-judgment counting, not mechanical parsing — this number should be spot-checked by an independent `/coverage` re-run or reviewer if stronger assurance is needed before G5.** Before this audit's fixes, the count was 163/168 (97.0%); the 5 gaps closed in §4/§5 bring it to 168/168. |
| **Automation coverage** | **73.1%** (136/186) | `needs automation = Yes` ÷ `valid in scope = Yes`. (Against the full 203-row population instead: 136/203 = 67.0% — reported both ways since the command doesn't fix a denominator; the in-scope-only figure is the more meaningful one, since out-of-scope cases were never automation candidates.) |

## 7. Audit verdict

**PASS, with 5 cases added and 1 correction — no unjustified gaps remain.** Structural
validation is clean (0 duplicates, 0 ragged rows, 0 missing required reasons, 0 missing
Automation_IDs). Story coverage is 100%. All `Partial` story verdicts are individually
justified in §2 with a stated reason, not silently accepted (9 since the 2026-09-26 re-run
added `US-07-08`). There are no orphan rows: the 2 that traced to `FIND-005` now trace to
`US-07-08`. The depth-check's genuine gaps (Users
boundary length; Locations search/empty-state/reset) are closed; every other apparent gap in
that table is an N/A backed by a specific exploration.md citation, not a silent pass.

Re-run performed after every fix in this session; final state above reflects the CSV as it
now stands at 203 rows.

---

## 8. Priority Model (added 2026-09-26, in response to review)

**Trigger:** a reviewer of the distribution then in force — 5 P0 / 95 P1 / 67 P2 / 36 P3 —
asked why several security- and integrity-critical cases (invalid-credential rejection,
duplicate-username prevention, mandatory-field enforcement on user creation, delete-
confirmation) sat at P1 rather than P0. The instruction was explicit: do not mass-reassign
to make the distribution look more defensible — define the model first, then check the
existing P0 set and every named candidate against it, and promote only what genuinely
qualifies. What follows is that model, applied evenly to both.

### 8.1 Definitions, in this project's own business terms

| Priority | Definition for this project |
|---|---|
| **P0 — Availability- or Access/Identity-Integrity-Critical** | A failure here means one of: **(A)** the Admin module (or the app) is globally unusable — nobody can get in at all; **(B)** a control that determines whether a *specific* person can authenticate, what authority they hold once authenticated, or whether their account exists at all (its creation, modification, or removal) is compromised — access could be granted, retained, escalated, or misdirected to the wrong identity without an explicit, correct admin decision; or **(C)** the case is the sole regression guard for a **confirmed High- or Critical-severity product defect** (`exploration.md` §5 Bug Register) — if it silently regresses, a known defect resumes reaching production undetected. This is reserved for a systemic, security- or defect-shaped consequence, not merely "an important feature is broken." |
| **P1 — High** | Core, frequently-exercised business/data-integrity operations whose failure blocks a real admin workflow or lets bad data enter the system, but does **not** itself grant, retain, escalate, or misdirect access, and is not a confirmed High/Critical-severity regression guard. Most CRUD happy paths, most validation, and most negative cases on frequently-used screens live here. |
| **P2 — Medium** | Secondary CRUD on non-identity reference data (Job Titles, Skills, Locations, Nationalities, etc.), UI/UX consistency checks, search/pagination/reset mechanics, low-severity regression guards. |
| **P3 — Low** | Cosmetic, rarely-exercised, or boundary/edge-case checks on low-blast-radius screens (colour pickers, informational-only screens, length-boundary probes with no security implication). |

Criterion (B) is deliberately about the **access/identity lifecycle** — authenticate, hold
authority, exist as an account — not about every field or workflow that merely touches the
Users screen. This is what keeps the model from swallowing the whole User Management
sub-module: a case must touch *that specific lifecycle*, not just live on that screen.

### 8.2 The existing 5 P0 cases, checked against the model

| TC_ID | Criterion | Verdict |
|---|---|---|
| `TC_ADM_NAV_001` (successful login) | (A) — if broken, nobody reaches the Admin module at all | **Fits. Keep.** |
| `TC_ADM_USR_001` (add a valid user) | (B) — account creation is the *grant* point of the access lifecycle; without it, no new access can ever be correctly provisioned | **Fits. Keep.** |
| `TC_ADM_USR_018` (edit a user's role) | (B) — directly changes *what authority* an authenticated person holds (ESS ↔ Admin) | **Fits. Keep.** |
| `TC_ADM_USR_020` (delete a user) | (B) — account removal is the *revoke* point of the same lifecycle | **Fits. Keep.** |
| `TC_ADM_NAT_010` (BUG-001 known defect) | **(C), not (B)** — this case does not touch authentication, authority, or account existence; it is the regression guard for `BUG-001`, a confirmed **High**-severity defect | **Fits under a different criterion than the other four. Keep, with this now stated explicitly rather than left implicit — a documented model defends this case on its own terms instead of quietly borrowing criterion (B)'s justification.** |

All 5 are correct under the model; none is removed. The one honest wrinkle — `NAT_010`
riding on (C) rather than (B) — is exactly the kind of thing a reviewer should be able to
see stated plainly, not reverse-engineer.

### 8.3 Candidates checked against the model

**Promoted (12 cases, all P1 → P0):**

| TC_ID | Title | Criterion | Rationale |
|---|---|---|---|
| `TC_ADM_NAV_002` | Invalid credentials rejected (wrong password) | (B) | Tests the authentication decision itself — the negative complement of `NAV_001`'s positive case, same gate |
| `TC_ADM_NAV_003` | Invalid credentials rejected (nonexistent username) | (B) | Same gate, enumeration-adjacent input |
| `TC_ADM_NAV_004` | Invalid credentials rejected (username case mismatch) | (B) | Same gate — and is the live regression guard for `BUG-003` (case-insensitive login), a confirmed authentication anomaly not yet linked in the CSV's `Linked_Bug` column (a separate gap, noted but not fixed here — out of scope for a priority review) |
| `TC_ADM_NAV_007` | Deep link while unauthenticated redirects to login | (B) | The literal route-guard boundary — classic broken-access-control territory |
| `TC_ADM_NAV_015` | Logout invalidates the session | (B) | The *exit* side of the same authentication boundary — a session that survives "logout" is a live access-integrity failure |
| `TC_ADM_NAV_016` | Back-navigation after logout doesn't expose authenticated screens | (B) | Client-side complement to `NAV_015`; stale authenticated screens post-logout is a standard, real security check |
| `TC_ADM_USR_002` | Username uniqueness enforced | (B) | Two accounts sharing one identifier makes accounts confusable — an admin (or the login flow itself) could act against the wrong identity |
| `TC_ADM_USR_003` | Mandatory: User Role empty | (B) | Role is literally *what authority* the account holds; an account with no Role assigned exists in an undefined authority state |
| `TC_ADM_USR_005` | Mandatory: Status empty | (B) | Status (Enabled/Disabled) gates *whether the account can authenticate at all* |
| `TC_ADM_USR_006` | Mandatory: Username empty | (B) | Username is the account's authentication identifier; a blank one breaks reliable identification at the point of creation |
| `TC_ADM_USR_007` | Mandatory: Password empty | (B) | Password is the credential itself — a skippable password is a direct authentication-integrity failure |
| `TC_ADM_USR_022` | Bulk delete via header checkbox | (B) | Bulk *revoke*, same lifecycle point as `USR_020`, at scale — a broken bulk-delete could revoke the wrong set of accounts or fail silently |

**Checked and deliberately left at their current priority** (named so the "why not this one
too" question is answered here, not left for a reviewer to wonder about):

| TC_ID | Title | Why it does not meet the model |
|---|---|---|
| `TC_ADM_NAV_005` / `NAV_006` | Login form required-field validation (Username/Password left empty) | Tests basic client-side form-completeness, one layer in front of the actual authentication decision (which `NAV_002`–`004` test directly) — a defense-in-depth backstop, not the decision itself. Stays P1. |
| `TC_ADM_USR_004` | Mandatory: Employee Name empty | Links a system-user account to a real employee for data-completeness/audit-trail purposes; it does not itself grant, deny, or change access. Stays P1. |
| `TC_ADM_USR_008` | Employee Name must come from the hint list, not free text | Same reasoning as `USR_004` — traceability, not access. Stays P1. |
| `TC_ADM_USR_012` | Confirm Password mismatch is rejected | A data-entry safety net (catches a mistyped password before submit); the account still ends up with *some* working password either way, so this isn't itself an access decision. Stays P1. |
| `TC_ADM_USR_021` | Cancelling the delete dialog preserves the record | Generic UI-safety-net pattern identical to every other screen's delete-cancel case (`JOB_009`, `QUA_009`, etc.) — the risk being guarded against (accidental data loss) isn't specific to accounts being an identity/access concern. Stays P1, consistent with its siblings elsewhere in the CSV. |
| `TC_ADM_JOB_008`, `JOB_021`, `JOB_033`, `JOB_043`, `JOB_052`, `TC_ADM_ORG_013`, `TC_ADM_QUA_008/018/027/036/045`, `TC_ADM_NAT_008` | Delete-with-confirmation on *reference-data* screens (Job Titles, Pay Grades, Locations, Skills, Nationalities, etc.) | These delete rows of reference data, not user accounts — none of them touch authentication, authority, or account existence. `USR_020`/`USR_022` (deleting *accounts*) are the only delete-confirmation cases this model promotes; the pattern name "delete confirmation" is not itself a promotion trigger. Stay at their current priority. |

### 8.4 Net effect

Distribution changes from **5 P0 / 95 P1 / 67 P2 / 36 P3** to **17 P0 / 83 P1 / 67 P2 / 36
P3** (203 total, unchanged). 12 cases moved, all P1 → P0, all individually justified above;
0 cases moved into or out of P2/P3; the 5 original P0 cases are unchanged in count and
membership. `test_design.csv`'s `Priority` column has been updated to match; no other
column (`valid in scope`, `needs automation`, `automation_wave`, `Automation_ID`) was
touched by this change.

### 8.5 Wave/Priority alignment rule (added 2026-09-26 — closes the gap §8.4 first found)

When this Priority Model was written (above, same day), checking the 12 newly-promoted
P0 cases against `automation_wave` found that 5 of them — `TC_ADM_NAV_003`, `NAV_004` (the
`BUG-003` regression guard), `TC_ADM_USR_005`, `USR_006`, `USR_007` — were still `W2`,
scheduled but not yet automated. That is exactly the kind of gap a reviewer would raise
next: a confirmed defect sitting at P0 with no regression guard running. It was closed the
same day, not left as a documented-but-open gap:

- **The rule, stated plainly so the two systems cannot drift apart again:** Wave assignment
  was originally a pure capacity-sequencing decision (`test_design_coverage.md`'s
  "Execution sequencing" section below, written 2026-09-23/24, back when the current
  Priority Model did not yet exist). Now that P0 is explicitly defined (§8.1), the rule is:
  **every P0 case is Wave 1, unconditionally.** A case cannot be marked P0 and left in Wave
  2 — if a future review promotes a case to P0, promoting its `automation_wave` to `W1` (and
  implementing it) is part of the same change, not a follow-up.
- **What was done to close this specific instance:** all 5 cases' `automation_wave` changed
  `W2` → `W1` in `test_design.csv`, and all 5 were implemented in the same pass —
  `TC_ADM_NAV_003`/`NAV_004` in `tests/admin/nav.spec.ts`, `TC_ADM_USR_005`/`006`/`007` in
  `tests/admin/usr.spec.ts`. All five were parameter variants of an already-built Wave 1
  reference case (confirmed before writing anything — `UserManagementPage
  .submitAddFormWithEmptyField()` was already typed to accept `'Status' | 'Username' |
  'Password'`), except `NAV_004`, which asserts `BUG-003`'s actual (defective) behaviour
  directly, annotated `— KNOWN DEFECT: BUG-003` in its Title and `Linked_Bug`, the same
  treatment as `TC_ADM_NAT_010`/`BUG-001` and `TC_ADM_BRD_001`/`BUG-002`.
- **Verification:** every one of the 17 P0 rows is confirmed `automation_wave = W1` by
  direct query against the CSV (0 exceptions) — see the full suite result and updated
  totals in `deliverables/00-summary/final_review.md` and `healing_process.md`.

---

# Execution sequencing (Wave 1 / Wave 2)

> **This section is the historical record of the ORIGINAL wave-selection decision
> (2026-09-23/24) and is preserved as written — the "Wave 1 — 47 cases" / "5 P0 cases" /
> per-sub-module counts below describe that original build, not the current CSV.** Two
> things changed it since: the `/coverage` audit (prior turn) added 5 `needs automation =
> No` cases with no `automation_wave` value, not affecting these counts; and the §8.5
> Wave/Priority alignment rule (2026-09-26) promoted 5 more cases from `W2` to `W1`
> (`TC_ADM_NAV_003`/`004`, `TC_ADM_USR_005`/`006`/`007`) because Priority itself changed
> (§8.3) and the rule requires every P0 case to be Wave 1. **Current, authoritative totals:
> Wave 1 = 52 cases, Wave 2 = 84 cases** (verified directly against `test_design.csv`, not
> recomputed from the narrative below) — see §8.5 and `deliverables/00-summary
> /final_review.md` for the current state. The selection rule, reasoning, and per-
> sub-module table immediately below reflect what those first 47 Wave-1 cases actually
> were and why, which remains true and useful context — it is just no longer the total.

`test_design.csv` carries 136 `needs automation = Yes` cases. A full Playwright run against
the shared demo at `workers: 2` (Constitution Article VI.2) takes roughly 40–60 minutes, and
Gate G5 requires **3 consecutive green runs after every healing cycle** (CLAUDE.md §6, M5).
At 136 cases, that arithmetic doesn't close within this cycle — so the set is **sequenced
into two waves inside the same `needs automation = Yes` population, not cut**. Every case
that was `Yes` before this change is still `Yes`; nothing was reclassified as `No` or
descoped. `automation_wave` only records *when* each `Yes` case gets built, not *whether*.

**Wave 1 — 47 cases, built first.** Selection rule, applied in order:

1. Every `P0` case (5: login success, add/edit/delete a system user, the BUG-001 known-defect
   case).
2. **One reference screen per shared CRUD-contract group**, built as the real page object;
   the other screens in that group are deferred to Wave 2 as data, not new code:
   - Job group (`EPIC-ADM-02`, 5 screens) → **Job Titles** is the Wave 1 reference (its 6
     core CRUD cases). Pay Grades, Employment Status, Job Categories, and Work Shifts get
     their equivalent 6 cases each in Wave 2, parameterised off Job Titles' page object.
   - Qualifications group (`EPIC-ADM-04`, 5 screens) → **Skills** is the Wave 1 reference
     (6 core CRUD cases + the long-description regression case). Education, Licenses,
     Languages, and Memberships get their equivalent cases in Wave 2.
   - Screen-specific logic that isn't shared across a group's screens (Pay Grades' currency
     Min/Max boundary, Work Shifts' overnight-time rejection which resolves OQ-02) stayed in
     Wave 1 regardless, since it's genuinely new interaction logic, not a parameter of the
     reference screen.
3. Both known-defect cases (`Linked_Bug` populated: BUG-001, BUG-002) — already covered by
   rule 1/priority in this run, kept explicit per the instruction.
4. Login/navigation happy paths, plus at least one negative and one boundary case per
   sub-module (where a boundary-type case exists for that sub-module at all — NAV, ORG, and
   USR have none in the `Yes` set, so none was forced).
5. Nothing M2 flagged as slow/fragile/upload-heavy was pulled into Wave 1 — e.g. every
   Job Titles file-attachment case is `needs automation = No` already (unexercised in M2), so
   the question didn't even arise there; Corporate Branding's colour-picker case is likewise
   already `No`.

**Wave 1 by sub-module:**

| Sub | NAV | USR | JOB | ORG | QUA | NAT | BRD | CFG | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| W1 count | 7 | 9 | 8 | 4 | 7 | 5 | 3 | 4 | **47** |

**Wave 2 — 89 cases, scheduled.** Two kinds, both recorded in each row's `automation_reason`
cell (which stays blank for Wave 1 rows and continues to hold its original text for
`needs automation = No` rows — nothing there changed):

- **Pure parameter variants (68 of 89, 76.4%)** — same page object, same interaction, only
  the input data (or the specific field/tab/currency/screen name under test) differs from a
  named Wave 1 case. This is the JOB/QUA group siblings (48 rows), NAV's credential/tab-nav
  outline siblings (9), USR's mandatory-field/search-filter/password-policy outline siblings
  (9), and CFG's Modules/SMTP-toggle siblings (2). M5 implements these as extra rows in a
  data table against the Wave 1 page object, not as new test files.
- **Component reuse, not pure data variants (21 of 89, 23.6%)** — a different page object is
  still required (e.g. Locations and Nationalities reuse the *generic* reference-data CRUD
  interaction pattern proven by Job Titles/Skills, but are separate screens under
  CLAUDE.md's module-agnostic architecture and need their own `src/pages/admin/*.ts` class),
  or the case adds a distinct assertion on top of an existing fixture (e.g. Confirm-Password
  mismatch reuses the Add User form but isn't a pure data swap of the mandatory-field cases).
  9 further cases (Language Packages, Social Media Authentication, Register OAuth Client,
  LDAP Configuration, and one Localization case) are simply deferred, low-priority,
  standalone read-only checks with no Wave 1 sibling to parameterise against at all.

**Why scheduled, not descoped:** every Wave 2 case is still a `needs automation = Yes` case
in this CSV — it has a wave, and once its wave comes due it has an `Automation_ID` already
assigned (equal to its `TC_ID`, same as every other `Yes` row). The 76.4% pure-reuse ratio is
the reason this is a scheduling problem, not a scope problem: once Job Titles', Skills',
Users', and NAV's page objects and fixtures exist from Wave 1, three-quarters of Wave 2 is
additional rows in an existing data table, not new interaction code — which is exactly the
"same page object and a data-driven loop" pattern this sequencing was built to exploit before
M5 starts, so the G5 3-consecutive-green requirement stays achievable per wave rather than
against the full 136-case set at once.
