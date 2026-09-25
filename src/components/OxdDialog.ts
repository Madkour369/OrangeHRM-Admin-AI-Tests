import { Locator, Page } from '@playwright/test';

/**
 * `.oxd-dialog-container` confirm dialogs (delete confirmation, org-unit add, etc.).
 * Confirmed exploration.md §6: dialog text is 100% generic across single-delete,
 * bulk-delete, and even the in-use-record delete that BUG-001 documents — it cannot
 * be used to distinguish which delete scenario is running. NEVER assert on dialog
 * *text* to infer which case you're in; assert on the *outcome* (record count, the
 * referenced record's own state) instead. This class exposes the verbatim strings so
 * a test CAN assert the dialog is the expected generic one, but page objects must not
 * lean on dialog text as their source of truth for anything business-specific.
 */
export class OxdDialog {
  readonly root: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('dialog');
  }

  /** Verbatim heading, confirmed exploration.md §2.1: "Are you Sure?" */
  get heading(): Locator {
    return this.root.getByText('Are you Sure?', { exact: true });
  }

  /** Verbatim body, confirmed exploration.md §2.1. */
  get body(): Locator {
    return this.root.getByText('The selected record will be permanently deleted. Are you sure you want to continue?', { exact: true });
  }

  /**
   * The destructive confirm button's icon contributes a leading space to its
   * computed accessible name (confirmed live 2026-09-24 via `ariaSnapshot()`:
   * `" Yes, Delete"`, vs. the icon-less Cancel button's clean `"No, Cancel"` — the
   * same class of issue as the Add button on the list screen), so `exact: true`
   * against the literal string never matches. Substring matching does.
   */
  get confirmButton(): Locator {
    return this.root.getByRole('button', { name: 'Yes, Delete' });
  }

  get cancelButton(): Locator {
    return this.root.getByRole('button', { name: 'No, Cancel', exact: true });
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
