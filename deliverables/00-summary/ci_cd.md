# CI/CD — `.github/workflows/playwright.yml`

**Repo:** https://github.com/Madkour369/OrangeHRM-Admin-AI-Tests
**Actions tab:** https://github.com/Madkour369/OrangeHRM-Admin-AI-Tests/actions
**This workflow directly:** https://github.com/Madkour369/OrangeHRM-Admin-AI-Tests/actions/workflows/playwright.yml

## What the workflow does

One job (`test`) on `ubuntu-latest`:

1. Checks out the repo, sets up Node 20, `npm ci`.
2. Installs **Chromium only** (`npx playwright install --with-deps chromium`) — matching
   `playwright.config.ts`'s own chromium-only project. No other browser has ever been
   exercised against this build (M2 exploration, M4 execution were both Chromium-only), so
   installing Firefox/WebKit in CI would test a browser nobody has actually observed the
   app under.
3. Resolves the run's test filter and worker count (see **Manual trigger** below).
4. Runs `npx playwright test <filter> --workers=<N> --reporter=html,json`.
5. Uploads three artifacts, every run, 30-day retention:
   - `playwright-html-report` — the interactive HTML report (`playwright-report/`)
   - `playwright-json-results` — the raw JSON results (`results.json`)
   - `playwright-failure-evidence` — traces/screenshots/videos (`test-results/`), only
     present when something actually failed or retried (`if-no-files-found: ignore`)

## Triggers

| Trigger | When | Purpose |
|---|---|---|
| `workflow_dispatch` | Manual, from the Actions tab | **The primary way to run this suite.** Lets you target a single spec file or a `--grep` pattern instead of the full Wave-1 set, and see exactly what ran. |
| `push` to `main`/`master` | Automatic | Regression check on anything landing on the main branch. |
| `pull_request` to `main`/`master` | Automatic | Regression check before merge. |
| *(none — no schedule/cron)* | — | **Deliberately absent.** See "Why no scheduled runs" below. |

## How to trigger it manually from the Actions tab

1. Open https://github.com/Madkour369/OrangeHRM-Admin-AI-Tests/actions.
2. Select **Playwright Tests** in the left-hand workflow list.
3. Click **Run workflow** (top-right of the run list).
4. Fill in the two optional inputs, or leave both at their defaults:
   - **test_filter** — a spec path (`tests/admin/usr.spec.ts`), a directory
     (`tests/admin`, the default — runs the full 47-case Wave-1 suite), or a substring
     Playwright will `--grep` against test titles (e.g. `TC_ADM_NAT` to run just the
     Nationalities cases).
   - **workers** — defaults to `2`. Any higher value is silently clamped back to `2` by
     the workflow itself (see "Why workers are capped" below) — the input exists so you
     can request *fewer* workers (e.g. `1`, strictly sequential) for a more deterministic
     debug run, not more.
5. Click the green **Run workflow** button. A new run appears in the list within a few
   seconds.

## Where to download the report artifact

1. Click into the finished (or in-progress) run in the Actions tab.
2. Scroll to the **Artifacts** section at the bottom of the run summary page.
3. Download `playwright-html-report`, unzip it, and open `index.html` locally — it is
   fully self-contained (same as this project's other HTML deliverables), so it opens
   offline with no server needed.
4. `playwright-json-results` (raw `results.json`) and `playwright-failure-evidence`
   (traces/screenshots/videos, only produced when something failed or retried) sit
   alongside it, same page, same 30-day retention.

## Why workers are capped at 2

Constitution Article VI.2 and Risk R2: this suite runs against OrangeHRM's **shared
public demo**, not an instance this project owns. M2 exploration and this project's own
M4/M5 execution history both observed rate limiting and instability under concurrent load
against that instance (see `deliverables/02-exploration/exploration.md` §7,
`deliverables/05-automation/healing_process.md`'s ENV_INSTABILITY entries). The workflow's
"Resolve run parameters" step enforces the cap unconditionally — a `workflow_dispatch`
input asking for more than 2 is clamped back to 2 with a visible `::warning::` annotation
in the run log, and `push`/`pull_request` runs (which never touch that input at all)
default straight to 2. This cap must never be raised in CI.

## Why there is no scheduled (cron) trigger

An unattended, recurring job hitting someone else's public demo without a human
initiating each run is not appropriate on shared infrastructure this project doesn't own.
Every run of this workflow is either a deliberate `push`/`pull_request` against real code
changes, or a human clicking **Run workflow**. This is a permanent design choice, not a
gap to fill in later.

## Retries are visible, not silently absorbed

`playwright.config.ts` sets `retries: 2` in CI. A test that fails once and passes on
retry is reported as **flaky** in both the uploaded HTML and JSON artifacts — never
folded into a plain "passed" — and the job still exits green. A test that still fails
after its retries correctly fails the job. This mirrors how this project's own `/heal`
process already treats a retry-only pass: a healing candidate to investigate, never a
free pass (see `healing_process.md`, e.g. `HEAL-022`).

## Orphaned test data risk

Every test in this suite creates its own `e2e_`-prefixed, uniquely-suffixed data and
tears it down itself (via the `testData` fixture, which runs cleanup even on a normal
test failure). A CI job that is **killed** mid-run — cancelled, hits the 60-minute
`timeout-minutes`, or the runner is evicted — can still leave orphaned `e2e_` records on
the shared demo, because a hard kill doesn't give the fixture's teardown a chance to run.
This is a known, accepted risk of running any UI suite against a shared public instance in
CI, not something this workflow can fully eliminate; it's part of why workers stay capped
and no unattended schedule exists. Any orphan is self-identifying by its `e2e_` prefix and
unique timestamp/run suffix if manual cleanup on the demo is ever needed.

## Secrets

**None required.** The demo credentials are public and already hardcoded as the fallback
inside `playwright.config.ts` itself (`ORANGEHRM_USER`/`ORANGEHRM_PASSWORD` default to
`Admin`/`admin123`). The workflow reads them from `vars.ORANGEHRM_USER`/
`vars.ORANGEHRM_PASSWORD` (GitHub Actions **Variables**, not **Secrets**) with the same
`Admin`/`admin123` fallback, matching the pattern the framework already uses — this is not
new secret scaffolding, and setting up repository Secrets is not needed to run this
workflow as-is.

## What would change to run this against a private instance

1. **Point it at the new URL.** Change `playwright.config.ts`'s `use.baseURL`, or make it
   read from an env var the same way the credentials already do.
2. **Move the credentials to real Secrets.** A private instance's credentials should not
   be a public fallback in source — set `ORANGEHRM_USER`/`ORANGEHRM_PASSWORD` as GitHub
   Actions **Secrets** (not Variables) and reference them as `secrets.ORANGEHRM_USER` /
   `secrets.ORANGEHRM_PASSWORD` in the workflow's `env:` block instead of `vars.*`.
3. **Reconsider the worker cap.** Constitution Article VI.2's cap of 2 exists specifically
   because this is a *shared, public, third-party* demo. A private, dedicated instance
   under this project's own control could justify raising it — but only after evidence of
   stability at a higher count, per the same Article, not by default.
4. **Reconsider the no-schedule rule.** The rationale against a cron trigger is entirely
   about not running unattended jobs against a demo this project doesn't own. A private,
   dedicated instance removes that specific objection, so a scheduled nightly/weekly run
   would become a reasonable addition at that point — it still isn't one today.
5. **Re-run M2 exploration against the new instance** before trusting any existing
   locator, message string, or business-rule assumption — everything in
   `exploration.md`/`test_design.csv` was observed against `opensource-demo
   .orangehrmlive.com`'s specific build (OrangeHRM OS 5.9) and is not guaranteed to hold
   on a different instance or version.
