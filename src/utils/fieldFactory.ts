import { Locator, Page, expect } from '@playwright/test';
import { OxdDropdown } from '../components/OxdDropdown';
import { OxdAutocomplete } from '../components/OxdAutocomplete';
import { OxdCheckbox, OxdRadioGroup } from '../components/OxdCheckbox';
import { OxdFileUpload } from '../components/OxdFileUpload';

/**
 * Label-anchored locator factory for oxd form controls (CLAUDE.md §5.1).
 *
 * Most OrangeHRM inputs carry no id/name/placeholder, so every helper here resolves
 * by the visible label text scoped to its containing `.oxd-input-group`. This is the
 * one raw oxd- selector CLAUDE.md explicitly mandates living in this file (§5.1's own
 * worked example: `page.locator('.oxd-input-group').filter({ hasText: /^Username$/ })
 * .locator('input')`). Every OTHER oxd- class (the dropdown's `.oxd-select-text`, the
 * checkbox's `.oxd-checkbox-wrapper`, etc.) lives inside src/components/ instead —
 * `dropdown()`/`autocomplete()`/`checkbox()` below only find the labelled container
 * and hand it to the matching component class; they never touch a second oxd- class
 * themselves.
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scopes to the `.oxd-input-group` that contains a `<label>` whose own text is
 * exactly `label`.
 *
 * Live-diagnosed 2026-09-24 (Add User form), two compounding bugs in the original
 * implementation:
 * 1. It matched `hasText` against the CONTAINER's full `textContent`, which
 *    concatenates the label with its sibling control's own text and inserts no
 *    newline (e.g. a User Role container's textContent is literally `"User
 *    Role-- Select --"`, confirmed via direct DOM inspection) — so an anchored
 *    `^label$` regex could never match, even in multiline mode. The `*` on a
 *    required field is also a CSS `::after`, never real DOM text (the `<label>`
 *    element's own textContent is `"User Role"`, no asterisk). Fixed by scoping to
 *    the `<label>` descendant's own exact text instead of the container's blob.
 * 2. `.oxd-form-row` is NOT a per-field wrapper on every screen — on the Add User
 *    form it wraps the entire multi-field section, so `.oxd-input-group, .oxd-form-row`
 *    both matched the `has` filter (the row containing the group), and `.first()`
 *    (DOM order: ancestor before descendant) grabbed the too-broad row, pulling in a
 *    second field's `.oxd-select-text` and causing a strict-mode violation. Fixed by
 *    matching only `.oxd-input-group` — the field-level wrapper CLAUDE.md §5.1's own
 *    worked example specifies, confirmed live to resolve to exactly one match here.
 */
/**
 * Exported (2026-09-25, /code-review): page objects legitimately need the raw
 * labelled container itself sometimes — to read a whole field section's text
 * (e.g. Corporate Branding's upload filename display) or to construct a
 * component this file doesn't already wrap (e.g. `OxdFileUpload`, which needs
 * the container passed into its own constructor). Exporting the one existing
 * primitive is the correct fix for that, not letting each page object re-derive
 * its own copy of this lookup with an inline `.oxd-input-group` selector — which
 * is exactly the violation this review caught in `PayGradesPage`,
 * `EmailConfigurationPage`, and `CorporateBrandingPage`.
 */
export function labelledContainer(scope: Page | Locator, label: string): Locator {
  const labelText = new RegExp('^' + escapeRegExp(label) + '$');
  return scope
    .locator('.oxd-input-group')
    .filter({ has: scope.locator('label', { hasText: labelText }) })
    .first();
}

/**
 * The `.oxd-form` section containing a given label — for screens that render
 * more than one form/section at once, each with its own identically-labelled
 * "Save" button (e.g. Pay Grades' own Save alongside its Currencies sub-form's
 * Save; PIM's Personal Details alongside its Custom Fields section). An
 * unscoped `getByRole('button', {name:'Save'})` hits a strict-mode violation on
 * these screens — confirmed live 2026-09-24/25 on both.
 */
export function formContaining(scope: Page | Locator, label: string): Locator {
  const labelText = new RegExp('^' + escapeRegExp(label) + '$');
  return scope
    .locator('.oxd-form')
    .filter({ has: scope.locator('label', { hasText: labelText }) })
    .first();
}

/** A label-anchored text/textarea input, e.g. field(page, 'Username'). */
export function field(scope: Page | Locator, label: string): Locator {
  return labelledContainer(scope, label).locator('input, textarea').first();
}

/** A label-anchored read-only computed value rendered as text, not an input (e.g. Work Shifts' "Duration Per Day"). */
export function fieldValueText(scope: Page | Locator, label: string): Locator {
  return labelledContainer(scope, label).locator('p').first();
}

/**
 * The field-level validation/error message under a labelled input (e.g. "Required",
 * "Already exists", "Should not exceed 50 characters"). Confirmed class
 * `.oxd-input-field-error-message` (Login screen, live-verified 2026-09-24) —
 * general oxd form rows use the same message slot under `.oxd-input-group__message`.
 */
export function fieldError(scope: Page | Locator, label: string): Locator {
  return labelledContainer(scope, label).locator('.oxd-input-field-error-message, .oxd-input-group__message').first();
}

/**
 * Every field-level error message within `scope` at once, for callers that count
 * them across a whole form rather than reading one field's message (the Login form,
 * whose two fields have no `.oxd-input-group` label anchor for `fieldError`).
 */
export function allFieldErrors(scope: Page | Locator): Locator {
  return scope.locator('.oxd-input-field-error-message');
}

/** A label-anchored `.oxd-select-text` dropdown, wrapped as a component (not a native <select> — CLAUDE.md §5.2). */
export function dropdown(scope: Page | Locator, label: string): OxdDropdown {
  return new OxdDropdown(labelledContainer(scope, label));
}

/** A label-anchored debounced autocomplete (Employee Name, Supervisor, Assigned Employees), wrapped as a component. */
export function autocomplete(scope: Page | Locator, label: string): OxdAutocomplete {
  return new OxdAutocomplete(labelledContainer(scope, label));
}

/**
 * A checkbox scoped by its own visible label/row text (not necessarily inside an
 * `.oxd-input-group` — checkboxes on this build often sit in a plain row with a
 * sibling `<p>`, e.g. Corporate Branding's "Social Media Images"). Pass the row/
 * container locator directly when the checkbox isn't inside a standard input group.
 */
export function checkbox(scope: Page | Locator): OxdCheckbox {
  return new OxdCheckbox(scope as Locator);
}

/**
 * A label-anchored radio group (Email Configuration's "Sending Method", "Use SMTP
 * Authentication"), wrapped as a component. Confirmed live 2026-09-25 these group
 * labels ARE real `<label>` elements (not `<p>`, despite living in a section that
 * also contains plain-text sub-labels) — the standard `.oxd-input-group` +
 * `<label>` lookup resolves them correctly with no special-casing needed.
 */
export function radioGroup(scope: Page | Locator, label: string): OxdRadioGroup {
  return new OxdRadioGroup(labelledContainer(scope, label));
}

/**
 * A label-anchored file upload (Job Specification, Corporate Branding's Client
 * Logo/Banner/Login Banner), wrapped as a component.
 */
export function fileUpload(scope: Page | Locator, label: string): OxdFileUpload {
  const container = labelledContainer(scope, label);
  return new OxdFileUpload(container.page(), container);
}

/**
 * Waits until no `.oxd-loading-spinner` is present. Call before interacting, not
 * after (CLAUDE.md §5.2).
 *
 * Live-diagnosed during Phase 1's own foundation smoke check (2026-09-24): the
 * Dashboard renders several independent widgets (`.orangehrm-dashboard-widget-loader`,
 * one per widget), each with its own spinner instance, and on a cold post-login load
 * 1-2 of them can still be spinning past the global 10s `expect.timeout` — confirmed
 * by direct observation that they do resolve to 0, just sometimes closer to ~15-18s
 * on a fresh session. This is a genuine timing characteristic of this specific
 * multi-widget page, not a broken/stuck spinner and not a locator problem, so the
 * fix is a longer, still-conditional element-state wait here (never a blind sleep,
 * per this project's healing discipline) rather than silently letting every caller's
 * default 10s assertion flake on first login.
 */
export async function waitForIdle(page: Page, timeoutMs = 20_000): Promise<void> {
  await expect(page.locator('.oxd-loading-spinner')).toHaveCount(0, { timeout: timeoutMs });
}

/**
 * Waits for a label-anchored field to hold a non-empty value — confirms an edit
 * form has actually hydrated with the record's real data, not just rendered an
 * empty shell right after the route transition.
 *
 * Live-diagnosed 2026-09-24 (Job Titles edit flow): the same class of race as
 * `OxdTable.waitForListRendered()` — `waitForIdle()`'s spinner-gone check can
 * resolve before the edit form's data has actually arrived, so a caller that
 * immediately reads or overwrites the field can race ahead of real content. Call
 * this after opening an edit form and after `waitForIdle()`, before touching the
 * field. Lives here (not in a page object, which CLAUDE.md keeps assertion-free)
 * because the wait is itself built on `expect()`, same as `waitForIdle`.
 */
export async function waitForFieldPopulated(scope: Page | Locator, label: string): Promise<void> {
  await expect(field(scope, label)).not.toHaveValue('', { timeout: 20_000 });
}

/** Unique, e2e_-prefixed test value generator (Constitution Article VI.1). */
export function uniqueValue(domain: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `e2e_${domain}_${ts}${rand}`;
}
