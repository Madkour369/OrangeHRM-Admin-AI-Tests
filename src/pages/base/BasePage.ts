import { Locator, Page } from '@playwright/test';
import { waitForIdle } from '../../utils/fieldFactory';

/**
 * Shared behaviour for every authenticated screen, regardless of module. Nothing
 * here may mention a specific module or screen name (CLAUDE.md §4) — a new module
 * reuses this file unchanged, only adding its own subclass under src/pages/<module>/.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** The sidebar navigation, confirmed `role="navigation" aria-label="Sidepanel"` (live-verified, 2026-09-24). */
  get sidebar(): Locator {
    return this.page.getByRole('navigation', { name: 'Sidepanel' });
  }

  /**
   * Navigates to a path and waits for the app to settle. `networkidle` is banned
   * (CLAUDE.md §5.3, this SPA's own polling/analytics make it unreliable) — this
   * waits on element state instead: the sidebar rendering, then no loading spinner.
   *
   * CLAUDE.md §5.2 flags the sidebar as collapsible with a different DOM when
   * collapsed, and asks page objects to normalise to expanded here. In practice,
   * across every session this project has run against this build (M2 exploration and
   * the full M4 execution — dozens of real navigations), the sidebar was NEVER
   * observed collapsed and no collapse-toggle control was ever seen or clicked. Per
   * this project's zero-invention rule, this method does not click an unverified
   * toggle it has never seen; it instead asserts the sidebar is actually visible
   * (i.e. operationally "expanded") after navigation, which is the real, confirmed
   * state in 100% of this project's observations. If a future run ever finds the
   * sidebar genuinely collapsed, that is a new observation to make and encode here,
   * not something to guess at now.
   */
  protected async gotoPath(path: string): Promise<void> {
    await this.page.goto(path);
    // .waitFor(), not expect().toBeVisible() (/code-review, 2026-09-25): identical
    // content-based wait behaviour, but page objects stay free of the `expect`
    // assertion API itself, per CLAUDE.md §4's "no assertions inside."
    await this.sidebar.waitFor({ state: 'visible' });
    await waitForIdle(this.page);
  }

  /** Opens a top-bar tab by its visible text (e.g. "Job", "Organization"). */
  async openTopTab(tabName: string): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Topbar Menu' }).getByText(tabName, { exact: true }).click();
  }

  /** Opens a top-bar tab's submenu item (e.g. tab "Job", item "Pay Grades"). */
  async openTopTabSubmenuItem(tabName: string, itemName: string): Promise<void> {
    await this.openTopTab(tabName);
    await this.page.getByRole('menuitem', { name: itemName, exact: true }).click();
    await waitForIdle(this.page);
  }

  /**
   * The breadcrumb heading text(s) in the banner (e.g. a top-level section name plus
   * an optional "/ <tab>" second segment). Confirmed
   * via accessibility snapshot as level-6 headings throughout M2/M4. Direct-link tabs
   * (Nationalities, Corporate Branding) render only the first segment — confirmed a
   * real, reproducible product behaviour (OQ-B1R-1), not a locator failure, so
   * callers should expect a 1- or 2-element result depending on the screen.
   */
  async breadcrumbText(): Promise<string[]> {
    // Scoped to the banner landmark — the main content area also renders its own
    // level-6 heading (the screen's own title, e.g. "Job Titles"), confirmed
    // present in every screen's accessibility snapshot this project has taken;
    // an unscoped query would wrongly fold that in as a third breadcrumb segment.
    const headings = this.page.getByRole('banner').getByRole('heading', { level: 6 });
    const count = await headings.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(((await headings.nth(i).textContent()) ?? '').trim());
    return out.filter(Boolean);
  }

  /**
   * Opens the top-bar user profile dropdown. Located via the profile picture image's
   * confirmed accessible name ("profile picture", stable across the run even though
   * the displayed employee name next to it is not — this project observed it drift
   * from "manda user" to "mandaa Brooks" mid-project, another real, concurrent party
   * on the shared demo, per exploration.md's environment notes) — never locate this
   * by the display name text itself.
   *
   * Scoped to `getByRole('banner')` (/code-review, 2026-09-25): live-diagnosed on
   * the Dashboard specifically — its Buzz feed, Attendance, and Leave widgets can
   * ALL render their own `alt="profile picture"` images (post authors' avatars,
   * the viewer's own photo in an attendance/leave card), confirmed via direct DOM
   * inspection to total up to 8 matches on one real load. An unscoped query is a
   * genuine strict-mode violation waiting to happen depending on Buzz feed content
   * and widget-load timing, not just a style nit — the banner landmark contains
   * only the real topbar one.
   */
  async openUserMenu(): Promise<void> {
    await this.page.getByRole('banner').getByRole('img', { name: 'profile picture' }).click();
  }
}
