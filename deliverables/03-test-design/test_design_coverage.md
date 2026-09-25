# Test Design Coverage — /coverage Audit

Executed per `.claude/commands/coverage.md` against `deliverables/03-test-design/test_design.csv`
(203 rows) and `.specify/specs/001-admin-ui/spec.md` at Gate G3. This replaces the earlier
placeholder note that the audit had not been run. Five structural/content gaps were found and
closed (new cases added, one Type mis-tag corrected); the remaining eight `Partial` story
verdicts are explained as justified, not silently closed, per the command's rule.

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

**Full: 25 / 33 · Partial: 8 / 33 · None: 0 / 33.**

### Every `Partial` verdict, justified (not silently closed)

Per the command's rule — "if a gap is genuinely justified, say why in the row rather than
closing it silently" — none of these 8 got a fabricated case:

| Story | Why it's Partial and why that's correct |
|---|---|
| US-00-02 | spec.md's own Gherkin for this story is a single Scenario Outline ("Admin top-tabs navigate to the correct screen") — a pure positive nav check. No negative scenario exists in spec.md for this story to cover. Fabricating one would violate the "never assert a behaviour not exploration-verified" discipline for no real gain. |
| US-01-03 | spec.md writes exactly 2 positive scenarios for editing a user (role change, password-optional). No negative edit scenario is specified. |
| US-01-05 | spec.md's pagination story is one positive integrity check. Both a `valid in scope = No` redirect (`TC_ADM_USR_023`) and the actual execution on Nationalities (`TC_ADM_NAT_011`) represent it — there is no negative pagination behaviour described anywhere to cover. |
| US-06-02 | Colour-picker/live-preview is a single positive, visual-judgement scenario per prd.md — already `needs automation = No` for that reason. No negative colour scenario exists. |
| US-06-03 | The one case here (`TC_ADM_BRD_007`) is `valid in scope = No`: the social-media-link URL fields it would validate were never observed in Corporate Branding's M2 screen inventory (exploration.md §2.6) — presence on build 5.9 is unconfirmed. Adding a fabricated "positive URL accepted" case for a field that may not exist would itself be the kind of unverified assertion Constitution Article V forbids. |
| US-07-03 | spec.md's only Localization scenario is the positive persistence check. No negative scenario is specified for this story. |
| US-07-04 | prd.md's story text mentions "download/empty state," but Language Packages is a system-derived, non-admin-editable list (not CRUD) — there's no admin action that would empty it to exercise a genuine negative/empty case against. |
| US-07-05 | Modules is a checkbox-state inventory screen with no validation-message dimension. The only "negative" angle — actually toggling a module off — is `valid in scope = No` by explicit blast-radius policy (this session's ruling, and exploration.md §9), so no in-scope negative case is available to add. |

## 3. Reverse matrix — orphans

Every `TC_ID`'s `Story_ID` was checked against the 33 `US-nn-yy` ids in spec.md/prd.md.
**201 of 203 rows map to a real story.** Two do not:

| TC_ID | Story_ID | Disposition |
|---|---|---|
| `TC_ADM_CFG_018` | `FIND-005` | Justified, not scope creep. LDAP Configuration is an 8th Configuration screen discovered live during M2 that isn't in prd.md's original 7-screen inventory (`FIND-005`). No `US-` id was ever assigned to it because spec.md is authoritative and not being rewritten mid-cycle; `FIND-005` is the closest traceable id and is used consistently on both LDAP rows rather than left blank. |
| `TC_ADM_CFG_019` | `FIND-005` | Same as above (the "never mutate LDAP" case). |

No other orphans — every other row traces to a real story.

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
| **Story coverage** | **100.0%** (33/33) | Every `US-nn-yy` story in spec.md has ≥1 representing `TC_ID`. |
| **Scenario coverage** | **168/168 (100.0%)** after this audit's fixes | Denominator = every distinct scenario unit in spec.md: 132 explicit Gherkin instances (30 standalone `Scenario:` blocks + 102 `Scenario Outline:` × Examples-row instances, including the shared 7-outline × 11-screen CRUD contract table counted once per outline) + 36 prose-derived scenario units for stories spec.md describes only in prose (Locations' CRUD+search, Structure's lazy-load, Configuration's per-screen behaviors, etc.). **The 36 prose-derived units involved reasonable-judgment counting, not mechanical parsing — this number should be spot-checked by an independent `/coverage` re-run or reviewer if stronger assurance is needed before G5.** Before this audit's fixes, the count was 163/168 (97.0%); the 5 gaps closed in §4/§5 bring it to 168/168. |
| **Automation coverage** | **73.1%** (136/186) | `needs automation = Yes` ÷ `valid in scope = Yes`. (Against the full 203-row population instead: 136/203 = 67.0% — reported both ways since the command doesn't fix a denominator; the in-scope-only figure is the more meaningful one, since out-of-scope cases were never automation candidates.) |

## 7. Audit verdict

**PASS, with 5 cases added and 1 correction — no unjustified gaps remain.** Structural
validation is clean (0 duplicates, 0 ragged rows, 0 missing required reasons, 0 missing
Automation_IDs). Story coverage is 100%. All 8 `Partial` story verdicts are individually
justified in §2 with a stated reason, not silently accepted. The 2 orphan rows are justified
(`FIND-005`, an undocumented screen, not scope creep). The depth-check's genuine gaps (Users
boundary length; Locations search/empty-state/reset) are closed; every other apparent gap in
that table is an N/A backed by a specific exploration.md citation, not a silent pass.

Re-run performed after every fix in this session; final state above reflects the CSV as it
now stands at 203 rows.

---

# Execution sequencing (Wave 1 / Wave 2)

> Unchanged from the prior turn — reproduced here for continuity. Wave assignment logic and
> counts were not affected by this audit; the 5 cases added above are all
> `needs automation = No` and therefore carry no `automation_wave` value, consistent with
> every other `No` row.

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
