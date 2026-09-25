import * as path from 'path';
import { test, expect } from '../../src/fixtures';
import { CorporateBrandingPage } from '../../src/pages/admin/CorporateBrandingPage';

const FIXTURES_DIR = path.join(process.cwd(), 'src', 'data', 'fixtures');

test.describe('Admin > Corporate Branding', () => {
  test('TC_ADM_BRD_001 - upload of an unsupported file type — KNOWN DEFECT BUG-002', async ({ page }) => {
    const brdPage = new CorporateBrandingPage(page);
    await brdPage.goto();

    await brdPage.clientLogoUpload().upload(path.join(FIXTURES_DIR, 'e2e_wrongtype.txt'));

    // Live-reconfirmed 2026-09-24 (matches exploration.md's M4 correction, NOT
    // the CSV's stale M2-era "Attachment Size Exceeded" wording): the current
    // actual behaviour is a completely silent failure — no error message of any
    // kind, the field just shows the filename as if it were accepted. Asserting
    // the ACTUAL buggy behaviour per CLAUDE.md §6.4, not the desired-but-absent
    // validation message.
    //
    // The filename-appears assertion below is also this test's readiness signal
    // (it auto-retries/polls until the upload has actually settled) — replaces a
    // prior blind `waitForTimeout(1000)`, a banned pattern caught by /code-review.
    await expect(brdPage.clientLogoFilenameText()).toContainText('e2e_wrongtype.txt');
    await expect(brdPage.clientLogoError()).toHaveCount(0);
  });

  test('TC_ADM_BRD_002 - oversized image upload is rejected', async ({ page }) => {
    const brdPage = new CorporateBrandingPage(page);
    await brdPage.goto();

    await brdPage.clientLogoUpload().upload(path.join(FIXTURES_DIR, 'e2e_oversized.png'));

    await expect(brdPage.clientLogoError()).toHaveText('Attachment Size Exceeded');
  });

  test('TC_ADM_BRD_006 - Social Media Images toggle default state', async ({ page }) => {
    const brdPage = new CorporateBrandingPage(page);
    await brdPage.goto();

    expect(await brdPage.socialMediaImagesToggle.isOn()).toBe(true);
  });
});
