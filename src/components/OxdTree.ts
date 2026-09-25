import { Locator, Page } from '@playwright/test';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A lazy-loaded expand/collapse tree (Organization > Structure is the only
 * screen in this project that has one). Confirmed live 2026-09-24 via direct DOM
 * inspection: each node is an `<li class="oxd-tree-node">` containing a
 * `<div class="oxd-tree-node-wrapper">`, which itself holds TWO siblings — a
 * `<span class="oxd-tree-node-toggle">` (wrapping the actual expand `<button>`,
 * present only on nodes with children) and a `.oxd-tree-node-content` DIV (the
 * label only, NOT the button — an earlier version of this class assumed the
 * button lived inside `.oxd-tree-node-content` from the accessibility tree's
 * shape and it does not, causing a real click timeout). Any children render as a
 * SEPARATE `<ul class="oxd-tree-node-child">`, a sibling of `.oxd-tree-node-wrapper`
 * within the same `<li>` — not nested inside the wrapper — so
 * `.oxd-tree-node-wrapper`'s own text stays exactly the node's label regardless of
 * expansion state, unlike the enclosing `<li>`'s full text, which grows to include
 * every descendant once expanded. `.oxd-tree-node-wrapper` (never the `<li>`
 * itself) is therefore what a node must be identified by, or a lookup for a node
 * that has already been expanded (e.g. a parent, when later locating a
 * grandchild) silently stops matching.
 */
export class OxdTree {
  constructor(private readonly page: Page) {}

  /** The node's own toggle+label row — text is always just this node's own label. */
  private rowWrapper(name: string): Locator {
    const exact = new RegExp('^' + escapeRegExp(name) + '$');
    return this.page.locator('.oxd-tree-node-wrapper').filter({ hasText: exact }).first();
  }

  /** The node's full `<li>`, including any (already-rendered) children — for scoping child lookups. */
  private node(name: string): Locator {
    return this.page.locator('.oxd-tree-node').filter({ has: this.rowWrapper(name) }).first();
  }

  /** The node's expand/collapse toggle — present only on nodes with children. */
  expandToggle(name: string): Locator {
    return this.rowWrapper(name).locator('.oxd-tree-node-toggle button').first();
  }

  async expand(name: string): Promise<void> {
    await this.expandToggle(name).click();
  }

  /** A child node's own row, scoped under its expanded parent (never a global/ambiguous match). */
  childNode(parentName: string, childName: string): Locator {
    const exact = new RegExp('^' + escapeRegExp(childName) + '$');
    return this.node(parentName).locator('.oxd-tree-node-wrapper').filter({ hasText: exact }).first();
  }
}
