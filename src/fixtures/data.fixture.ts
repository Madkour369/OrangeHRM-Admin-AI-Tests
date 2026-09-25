import { test as pageTest } from './page.fixture';
import { uniqueValue } from '../utils/fieldFactory';

/**
 * Module-agnostic, UI-driven test-data lifecycle (Constitution Article VI). A test
 * registers a cleanup callback immediately after it creates an `e2e_`-prefixed
 * record (never after the whole test "succeeds" — a mid-test failure must still
 * clean up whatever was created before the failure). Cleanups run in reverse
 * (LIFO) order, so a record created after another that depends on it is deleted
 * first, and every cleanup runs even if an earlier one throws (best-effort,
 * failures are collected and surfaced together rather than aborting the rest).
 */
export class TestDataRegistry {
  private readonly cleanups: Array<{ label: string; fn: () => Promise<void> }> = [];

  /** A fresh, unique `e2e_<domain>_<...>` value. Never hardcode an ad-hoc string in a test. */
  unique(domain: string): string {
    return uniqueValue(domain);
  }

  /** Registers UI-driven teardown for a record this test just created. */
  track(label: string, cleanupFn: () => Promise<void>): void {
    this.cleanups.push({ label, fn: cleanupFn });
  }

  /** Runs all registered cleanups in reverse order, best-effort. Called by the fixture teardown. */
  async teardownAll(): Promise<void> {
    const errors: string[] = [];
    for (let i = this.cleanups.length - 1; i >= 0; i--) {
      const { label, fn } = this.cleanups[i];
      try {
        await fn();
      } catch (err) {
        errors.push(`Cleanup failed for "${label}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    this.cleanups.length = 0;
    if (errors.length) {
      throw new Error(`One or more test-data cleanups failed:\n${errors.join('\n')}`);
    }
  }
}

type DataFixtures = {
  testData: TestDataRegistry;
};

export const test = pageTest.extend<DataFixtures>({
  testData: async ({}, use) => {
    const registry = new TestDataRegistry();
    await use(registry);
    await registry.teardownAll();
  },
});

export { expect } from '@playwright/test';
export { reauthenticateIfExpired } from './auth.fixture';
