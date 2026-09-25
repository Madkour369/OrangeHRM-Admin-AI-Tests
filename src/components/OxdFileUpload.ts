import { Locator, Page } from '@playwright/test';

/**
 * Hidden `input[type=file]` behind a "Browse"/"Choose File" button (Corporate
 * Branding's Client Logo/Banner/Login Banner, Job Titles' Job Specification).
 * Confirmed exploration.md §6: standard Playwright file-chooser handling works once
 * the file-chooser modal state is handled correctly — no custom wrapper needed
 * beyond `setInputFiles`, which is exactly what this class does. Independently
 * re-confirmed by this project's own M4 orchestrator (file uploaded via a "Browse"
 * click + `setFiles` on the resulting chooser, real console error observed
 * afterward for a non-image file — BUG-002).
 */
export class OxdFileUpload {
  private readonly browseButton: Locator;

  /** `container` is the field's own labelled block (e.g. the "Client Logo" section). */
  constructor(private readonly page: Page, container: Locator) {
    this.browseButton = container.getByText('Browse', { exact: true });
  }

  /** Uploads via the real file-chooser flow (clicking Browse triggers it), not a bare setInputFiles on a hidden input. */
  async upload(filePath: string): Promise<void> {
    const chooserPromise = this.page.waitForEvent('filechooser');
    await this.browseButton.click();
    const chooser = await chooserPromise;
    await chooser.setFiles(filePath);
  }

  // No selected-filename getter: the exact markup next to "Browse" that displays the
  // chosen filename was only ever observed via accessibility snapshot, never as raw
  // HTML/class names, and no W1 case needs to assert on it. Add it here with a real
  // observed selector (not a positional XPath, which CLAUDE.md §5.1 forbids
  // outright) if a later wave needs it.
}
