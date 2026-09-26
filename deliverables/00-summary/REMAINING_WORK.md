# Remaining work — resume point

**To resume in any new session:** "Read deliverables/00-summary/REMAINING_WORK.md and continue from the first unchecked step."

Rules for every step: invent nothing; update this file after each completed step, before starting the next; commit and push after each step; stop cleanly at a step boundary if near a session limit and name the next step here.

Last updated: 2026-09-26

| Step | Item | Status |
|---|---|---|
| 0 | Create this backlog file | ✅ Done |
| 1 | Redesign both HTML reports (`agent_execution_report.html`, `automation_execution_report.html`) | ✅ Done 2026-09-26: one shared inline template, data objects byte-identical; measured 1 network request each, all sections and screenshots present, 0 console errors, theme/print/storage-blocked checks passed |
| 2 | Prompts archive: improved prompts + "What the improvement fixes" + "Reusable prompt library" | ✅ Done 2026-09-26: 43 improved prompts with grounded fixes, 11 reusable templates; .md and .xlsx verified identical (0 mismatches); original text unchanged |
| 3 | `deliverables/00-summary/code_standards.md` | ✅ Done 2026-09-26: written from the code with verified excerpts; 12 deviations documented (incl. re-authentication helper never wired in, no logger, config allows 2 workers) |
| 4 | `deliverables/00-summary/system_sequence_diagram.html` | ✅ Done 2026-09-26: 48 sourced messages across 7 lanes, static inline SVG, milestone I/O and command tables, layer diagram; measured 1 request, 0 errors, light/dark and phone width checked |
| 5 | `BOOTSTRAP.md` at the repo root + README "Reusing on another system / module" | ✅ Done 2026-09-26: fill-in header, standing instructions, first actions on a new system; CSV header verified byte-exact against CLAUDE.md; README links added |

## Status: all five steps complete (2026-09-26)

Open items found along the way, not yet fixed (each needs a decision or a small change in a future session):
- `.claude/commands/new-module.md` cites a non-existent "Constitution III.10"; the rule is Article IV.1.
- Known-defect tests cite a non-existent "CLAUDE.md §6.4" (9 places); either write the known-defect-guard rule into CLAUDE.md §5.4 or correct the citations to prompts_used.md #29 Rule 3.
- Prompt #23 in the prompts archive is truncated without a `[partial]` marker.
- `challenges_and_resolutions.xlsx` CH-09 wrongly says the scaffold removal date is unrecorded (deleted 2026-09-23 per prompt #22); constitution Article IV.4 still reads as an open decision.
- `code_standards.md` deviations: `reauthenticateIfExpired` is never called (CLAUDE.md §5.3 re-auth not wired in); no logger module; config allows 2 workers while official runs use 1.
- `scope_review.xlsx` is awaiting the human's filled-in decisions; reconcile into test_design.csv when it comes back.

## Step details

### Step 1 — Redesign both HTML reports
- One shared template (inline CSS + JS) used by both reports; each report keeps its own embedded `#report-data` object. No counts, module names or ids hardcoded in markup; filter options derive from the data.
- From the rich reference design: sticky navbar with theme selector (System / Light / Dark); action bar (Expand All, Collapse All, Print/PDF); run-metadata banner; donut + scorecards with coloured bottom borders; per-sub-module bar chart; execution time breakdown (total, average, slowest, fastest, segmented bar with tooltips, per-sub-module timing table); collapsible sections with rotating chevrons; per-test accordion cards with status-coloured left border; search + status + sub-module + priority filters with Reset; monospace boxes for raw errors and step logs; scroll-to-top button; print stylesheet that expands everything and hides controls.
- Richer than the CDN original: hand-drawn SVG donut with animated stroke-dasharray, per-segment hover, legend with counts and percentages, pass rate in the centre; an inline SVG `<symbol>` sprite for icons; refined system font stack; subtle transitions.
- Hard constraints: no external resources (no ApexCharts, FontAwesome, CDN or web fonts); exactly one network request per report, measured; keep every existing section and every embedded base64 screenshot; localStorage theme persistence wrapped in try/catch; System follows prefers-color-scheme.
- Note: the reference designs were described in the request but not attached; the airline-kb HTML files on the Desktop are unrelated. The design follows the written feature list.
- Data limitation to respect: M4 was manual, so its data has no per-test durations. The time-breakdown section must say so rather than invent timings.

### Step 2 — Prompts archive (already built)
- 43 improved prompts + fixes lines, 11 reusable templates; `.md` and `.xlsx` verified identical (0 mismatches), originals byte-identical after stripping insertions.
- Remaining: commit and push. Open items found while building it (not yet fixed): `.claude/commands/new-module.md` cites a non-existent "Constitution III.10" (should be Article IV.1); prompt #23 is truncated in the archive without a `[partial]` marker; `challenges_and_resolutions.xlsx` CH-09 wrongly says the scaffold removal date is unrecorded (it was deleted 2026-09-23 per prompt #22); constitution Article IV.4 still reads as an open decision.

### Step 3 — code_standards.md
- Written from the real code, with real excerpts: POM rules, layer dependency rule, locator strategy and bans, component wrapper pattern, wait strategy, test structure and naming, data isolation and teardown, TypeScript conventions, known-defect assertions. Document deviations where the code departs from a rule.

### Step 4 — system_sequence_diagram.html
- Self-contained, inline SVG, offline, light/dark, same visual language as the reports. Lanes: Human · Claude Code agent · Governing docs · Playwright MCP browser · OrangeHRM demo · Deliverables on disk · GitHub Actions CI. M1–M5 in order with inputs, outputs (paths) and gate approvals; labelled arrows; feedback arrows (M2→M1 PRD, M5→M3 CSV and M2 locator register, /heal prevention rules, CI results → /heal). Module input/output table (5 milestones + 5 commands). Framework layer diagram.

### Step 5 — BOOTSTRAP.md + README links
- Fill-in header (TARGET URL, CREDENTIALS, IN-SCOPE MODULES, KNOWN-ABOUT BUT OUT OF SCOPE, TESTING SCOPE, STACK, CONSTRAINTS), standing instructions, "First actions on a new system". README: "Reusing on another system" → BOOTSTRAP.md; "Reusing on another module" → /new-module.
