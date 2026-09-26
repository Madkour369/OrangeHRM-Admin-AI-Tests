import { Locator, Page, expect } from '@playwright/test';
import { isPage } from '../utils/scope';

/**
 * `.oxd-table-card` / `.oxd-table-row` / `.oxd-table-body` list screens.
 *
 * Row action icons: FIND-004 (exploration.md §2.1, confirmed on User Management) found
 * DOM order is delete-icon-first, edit-icon-second — the reverse of the common
 * assumption. Two later M4 execution batches then reported conflicting readings for
 * OTHER screen families (one claimed Qualifications/Nationalities share the
 * delete-first order while Job/Organization screens are edit-first; that specific
 * Job-Titles claim was directly contradicted by this project's own orchestrator, who
 * independently drove a Job Titles delete via its FIRST action button and it worked).
 * Rather than resolve that discrepancy by guessing, this class follows the Locator
 * Risk Register's own mitigation exactly: locate by icon class (`.bi-trash` /
 * `.bi-pencil-fill`), never by position (`nth(0)`/`nth(1)`) — so the question of
 * which screen puts which icon where never has to be answered or trusted by any page
 * object built on this component.
 */
export class OxdTable {
  readonly root: Locator;
  private readonly page: Page;

  /**
   * `scope` is either the Page (root looks up the nearest `.oxd-table` on the page)
   * or an already-scoped container Locator (e.g. a specific `.oxd-table-card`, for
   * screens that render more than one table).
   */
  constructor(scope: Page | Locator, containerSelector = '.oxd-table') {
    if (isPage(scope)) {
      this.page = scope;
      this.root = scope.locator(containerSelector);
    } else {
      this.page = scope.page();
      this.root = scope;
    }
  }

  /**
   * The card wrapping the Add button, the record-count-or-empty-state message, and
   * the table itself — confirmed live 2026-09-24 via direct DOM inspection:
   * `.orangehrm-paper-container` is the closest ancestor shared by the empty-state
   * message and `.oxd-table` (the message is a SIBLING of `.oxd-table`, not a
   * descendant of it — scoping to `.oxd-table` itself, as `root` does, never finds
   * it), and it does not contain the toast portal (`#oxd-toaster_*`, appended
   * elsewhere in the DOM), so it's also immune to the toast's identical text.
   */
  private get listContainer(): Locator {
    return this.page.locator('.orangehrm-paper-container');
  }

  /** The "(N) Record(s) Found" header — singular/plural both occur, confirmed exploration.md §2.1. */
  get recordCountHeader(): Locator {
    return this.listContainer.locator('text=/\\(\\d+\\) Records? Found/');
  }

  /**
   * The "(N) Record(s) Found" header never renders at all for a zero-result search
   * — it's replaced by the empty-state div, not a "(0) Records Found" header
   * (confirmed live 2026-09-24; CLAUDE.md §5.2 already flags "No Records Found" as
   * a real div, not an empty table — the same applies to this header). Racing the
   * header locator on every call would hang for the full timeout on a legitimate
   * zero-result state, so this checks the empty state first.
   */
  async recordCount(): Promise<number> {
    if (await this.isEmpty()) return 0;
    const text = (await this.recordCountHeader.textContent()) ?? '';
    const m = text.match(/\((\d+)\)/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  /**
   * The empty-state row — confirmed a real `div`, not an empty table (CLAUDE.md
   * §5.2). Scoped to `listContainer`, not `root`/`.oxd-table` (see its comment) and
   * not the bare page: a zero-result search ALSO pops an info toast reading the
   * identical "No Records Found" text (live-diagnosed 2026-09-24), so an unscoped
   * page-wide match hits both and trips strict mode.
   */
  get emptyState(): Locator {
    return this.listContainer.getByText('No Records Found', { exact: true });
  }

  /**
   * Count-based, so it cannot throw. The previous `isVisible().catch(() => false)`
   * turned ANY failure (including a strict-mode violation) into "not empty". Live-
   * checked 2026-09-26: this div is detached, not hidden, when records exist (count 0
   * on a populated Skills list, 1 on a zero-result search), so count > 0 means the
   * same thing isVisible() did.
   */
  async isEmpty(): Promise<boolean> {
    return (await this.emptyState.count()) > 0;
  }

  /**
   * All data rows. Scoped to `.oxd-table-body` — live-diagnosed 2026-09-24: the
   * header row carries the identical `.oxd-table-row` class (confirmed via direct
   * DOM inspection: `.oxd-table` has exactly two children, `.oxd-table-header` and
   * `.oxd-table-body`, and BOTH the header row and every data row render as
   * `<div class="oxd-table-row ...">`), so an unscoped `.oxd-table-row` query over
   * `root` silently counts the header as an extra row and — worse — could hand the
   * header to a caller expecting the first DATA row (e.g. an action-icon check).
   */
  get rows(): Locator {
    return this.root.locator('.oxd-table-body .oxd-table-row');
  }

  /**
   * A single row's own cell texts, in DOM order. Added 2026-09-25 (/code-review):
   * previously each page object that needed this re-derived its own inline
   * `.oxd-table-cell` selector — the raw-selector-outside-components violation
   * this review exists to catch. `.nth(i)` here iterates every row in a caller's
   * own loop to visit each one in turn, not to pick "the nth" from ambiguous
   * business data — the banned pattern this project forbids.
   */
  async cellTexts(row: Locator): Promise<string[]> {
    return row.locator('.oxd-table-cell').allTextContents();
  }

  /**
   * Column index for a header label, so no caller hard-codes a column position.
   * Header cells can carry trailing sort-icon text (live-inspected 2026-09-26: PIM's
   * "Last NameAscendingDescending"), so this matches the label as a prefix and
   * requires exactly one match. A missing or ambiguous header throws rather than
   * silently picking a column.
   */
  private async columnIndex(header: string): Promise<number> {
    const labels = (await this.root.locator('.oxd-table-header .oxd-table-header-cell').allTextContents()).map((s) =>
      s.trim(),
    );
    const matches = labels.flatMap((label, i) => (label.startsWith(header) ? [i] : []));
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one column headed "${header}", found ${matches.length} in [${labels.join(' | ')}]`);
    }
    return matches[0];
  }

  /** A row's cell under the named column. The index comes from the header, never from business data. */
  async cell(row: Locator, header: string): Promise<Locator> {
    return row.locator('.oxd-table-cell').nth(await this.columnIndex(header));
  }

  /** Every data row's text in the named column, in DOM order. */
  async columnTexts(header: string): Promise<string[]> {
    const index = await this.columnIndex(header);
    return this.rows.evaluateAll(
      (rows, i) => rows.map((r) => r.querySelectorAll('.oxd-table-cell')[i]?.textContent?.trim() ?? ''),
      index,
    );
  }

  /**
   * The row with a cell whose whole text is exactly `cellText`. Never `.nth()` on
   * business data, and no `.first()`.
   *
   * Changed 2026-09-26 (/code-review): this used to be `filter({ hasText }).first()`,
   * a substring match with strict mode silenced. That is the pattern CLAUDE.md §5.1
   * forbids ("`:has-text` on values that are also substrings of other rows"). For
   * example, `row('e2e_x')` also matched a row named `e2e_x_edited`, so a check that the
   * original record still exists would pass even if an edit had wrongly been saved.
   * An exact duplicate now fails loudly as a strict-mode violation instead of being
   * silently resolved.
   */
  row(cellText: string): Locator {
    return this.rows.filter({ has: this.page.locator('.oxd-table-cell').getByText(cellText, { exact: true }) });
  }

  /** Delete (trash) action button within a row — resolved by icon class, never position. */
  deleteButton(row: Locator): Locator {
    return row.locator('button:has(i.bi-trash)');
  }

  /** Edit (pencil) action button within a row — resolved by icon class, never position. */
  editButton(row: Locator): Locator {
    return row.locator('button:has(i.bi-pencil-fill)');
  }

  /**
   * The DOM order of a row's action-icon classes, left to right (e.g.
   * `['bi-trash', 'bi-pencil-fill']`). Used only by the one regression-guard case
   * that exists specifically to inspect this (FIND-004, TC_ADM_USR_024) — every
   * other caller should use `deleteButton`/`editButton` instead, never assume order.
   */
  async actionIconOrder(row: Locator): Promise<string[]> {
    return row.locator('.oxd-table-cell-actions i[class*="bi-"]').evaluateAll((els) =>
      els.map((e) => Array.from(e.classList).find((c) => c.startsWith('bi-')) ?? '')
    );
  }

  /** The wrapper/label for a row's selection checkbox — never the raw hidden input. */
  rowCheckboxWrapper(row: Locator): Locator {
    return row.locator('.oxd-checkbox-wrapper');
  }

  /** The header row's "select all" checkbox wrapper. */
  get headerCheckboxWrapper(): Locator {
    return this.root.locator('.oxd-table-header .oxd-checkbox-wrapper');
  }

  /**
   * Live-diagnosed 2026-09-24 (Edit User role test, then reconfirmed on Job Titles'
   * plain `goto()` with no search panel): `waitForIdle()`'s spinner-gone check can
   * resolve BEFORE the spinner ever appears — it only asserts the current count is
   * 0, and right after a click OR a fresh navigation the request may not have
   * mounted the spinner yet, so the check trivially passes while the table is still
   * mid-load and a caller reading rows immediately after gets stale or empty data.
   * Waiting for either the record-count header or the empty-state div — exactly one
   * of which is always present once the list has actually finished rendering — is a
   * content-based signal instead of a timing-based one, so it can't race the same
   * way. `waitForIdle` is a supplementary settle-check on top, not a replacement.
   * Public: list-screen page objects call this from their own `goto()` (after
   * `BasePage.gotoPath()`, which only waits for the sidebar + spinner, not the
   * table's own data) as well as after `clickSearch()`/`clickReset()`.
   *
   * Live-diagnosed 2026-09-25 (CI-only, HEAL-023/024/025 — three tests flaky on a
   * GitHub Actions run, all reading row content immediately after this wait, never
   * reproduced across three separate 47-test local runs): the record-count header
   * can itself become visible a beat before the row bodies' own cell text/action
   * icons finish populating — confirmed by the CI run's raw errors: one test's row
   * count matched the header's count exactly while every cell came back empty
   * string, another's action-icon lookup matched zero elements on an otherwise-
   * present row. The header proves the LIST STATE (has-records vs. empty) settled;
   * it does not prove the ROW DATA inside each `.oxd-table-row` has. A CI runner's
   * different CPU/network characteristics apparently widen this specific gap enough
   * to observe it, where local runs never hit it. Fix: once the header confirms at
   * least one row is expected, additionally poll the first row's own cell text
   * until it holds real content before returning — a second, more specific content-
   * based signal, not a timeout increase.
   */
  async waitForListRendered(): Promise<void> {
    await expect(this.recordCountHeader.or(this.emptyState)).toBeVisible({ timeout: 20_000 });
    // Both the empty-state check and the row-content check are INSIDE the retried
    // predicate, re-evaluated on every attempt — not checked once up front. A search
    // that is genuinely about to resolve to zero results can still show a stale
    // (pre-search) record-count header at the instant the assertion above passes;
    // checking emptyState only once here would then commit this call to waiting for
    // row content that a legitimate empty result will never produce, hanging for the
    // full timeout instead of recognizing the list settled on "no records" a moment
    // later. Found live 2026-09-25 (post-HEAL-023/024/025 regression check): searches
    // for an already-deleted/nonexistent username hit exactly this hang.
    await expect(async () => {
      if (await this.isEmpty()) return;
      const firstRow = this.rows.first();
      if ((await firstRow.count()) === 0) {
        throw new Error('list is not in the empty state but no row is attached yet');
      }
      const texts = await this.cellTexts(firstRow);
      if (!texts.some((t) => t.trim().length > 0)) {
        throw new Error('first row is attached but its cells have not populated yet');
      }
    }).toPass({ timeout: 20_000 });
  }

  async clickSearch(): Promise<void> {
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
    await this.waitForListRendered();
  }

  async clickReset(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reset', exact: true }).click();
    await this.waitForListRendered();
  }

  /** Pagination nav — only Nationalities has enough records to page through (exploration.md §6). */
  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'Pagination Navigation' });
  }

  /**
   * Count-based, so it cannot throw (replaces `isVisible().catch(() => false)`, which
   * hid every failure, not just "no pagination"). Live-checked 2026-09-26: the nav is
   * not rendered at all on a single-page list (count 0) and is present and visible on
   * Nationalities' 4-page list (count 1), so count > 0 means the same thing
   * isVisible() did.
   */
  async hasPagination(): Promise<boolean> {
    return (await this.pagination.count()) > 0;
  }

  /** The numbered page buttons' values (e.g. [1, 2, 3, 4]); [] when there is no pagination. */
  async pageNumbers(): Promise<number[]> {
    if (!(await this.hasPagination())) return [];
    const labels = await this.pagination.getByRole('button').allTextContents();
    return labels
      .map((l) => l.trim())
      .filter((l) => /^\d+$/.test(l))
      .map((l) => parseInt(l, 10));
  }

  async goToPage(n: number): Promise<void> {
    await this.pagination.getByRole('button', { name: String(n), exact: true }).click();
    // Content-based wait, not just spinner-gone — same race class as
    // waitForListRendered's own comment.
    await this.waitForListRendered();
  }

  /**
   * Walks numbered pagination pages until a row matching `cellText` is found,
   * navigating there and returning it. Returns a (0-count) row locator if the
   * current page already has no pagination, or if no page contains a match.
   *
   * For list screens with too many records for a search filter to narrow down (or
   * with no search filter at all) — e.g. Nationalities' ~193 records/4 pages,
   * confirmed live 2026-09-24 to have no search panel, unlike User Management.
   */
  async findRowAcrossPages(cellText: string): Promise<Locator> {
    let row = this.row(cellText);
    if ((await row.count()) > 0) return row;

    for (const n of await this.pageNumbers()) {
      await this.goToPage(n);
      row = this.row(cellText);
      if ((await row.count()) > 0) return row;
    }
    return row;
  }
}
