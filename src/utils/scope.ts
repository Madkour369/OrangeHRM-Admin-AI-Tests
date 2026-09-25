import { Locator, Page } from '@playwright/test';

/**
 * Runtime type guard distinguishing a Page from a Locator, used by every component
 * that accepts `Page | Locator` as its scope (so a component can be constructed
 * either directly against the page or nested inside another component/container).
 * Checks for `.goto`, a method only Page has.
 */
export function isPage(scope: Page | Locator): scope is Page {
  return typeof (scope as Page).goto === 'function';
}
