import { test, expect } from '../../src/fixtures';
import { EmailConfigurationPage } from '../../src/pages/admin/EmailConfigurationPage';
import { LocalizationPage } from '../../src/pages/admin/LocalizationPage';
import { ModulesPage } from '../../src/pages/admin/ModulesPage';

test.describe('Admin > Configuration', () => {
  test.describe('Email Configuration', () => {
    test('TC_ADM_CFG_001 - SMTP fields appear only for the SMTP method', async ({ page }) => {
      const emailPage = new EmailConfigurationPage(page);
      await emailPage.goto();

      // Force-resync first (exploration.md's BUG-006 / this project's own
      // NEWBUG-BRDCFG-2: field visibility can intermittently desync from the
      // actually-selected radio on load) — always select explicitly, never
      // trust the pre-interaction visible state.
      await emailPage.selectSendingMethod('Sendmail');
      await expect(emailPage.pathToSendmailText).toBeVisible();
      await expect(emailPage.smtpHostField()).toHaveCount(0);

      await emailPage.selectSendingMethod('SMTP');
      await expect(emailPage.smtpHostField()).toBeVisible();
      await expect(emailPage.smtpPortField()).toBeVisible();

      await emailPage.selectSendingMethod('Sendmail');
      await expect(emailPage.pathToSendmailText).toBeVisible();
      await expect(emailPage.smtpHostField()).toHaveCount(0);
    });

    test('TC_ADM_CFG_003 - mandatory SMTP fields blocked when left empty', async ({ page }) => {
      const emailPage = new EmailConfigurationPage(page);
      await emailPage.goto();

      await emailPage.selectSendingMethod('SMTP');
      await emailPage.selectAuthentication('Yes');
      // Host/User/Password left at their default empty state.
      await emailPage.attemptSave();

      await expect(emailPage.fieldError('SMTP Host')).toHaveText('Required');
      await expect(emailPage.fieldError('SMTP User')).toHaveText('Required');
      await expect(emailPage.fieldError('SMTP Password')).toHaveText('Required');
      // SMTP Port is genuinely optional — never shows Required (exploration.md §2.7).
      await expect(emailPage.fieldError('SMTP Port')).toHaveCount(0);

      // Reset the shared Sending Method back to the safe default before leaving,
      // consistent with this project's own M4 discipline for this screen.
      await emailPage.selectSendingMethod('Sendmail');
    });
  });

  test('TC_ADM_CFG_008 - Date Format dropdown shows a live example matching the selected format', async ({ page }) => {
    const localizationPage = new LocalizationPage(page);
    await localizationPage.goto();

    // Verbatim pattern confirmed live 2026-09-25 (independently re-confirms
    // exploration.md §2.7's M2 finding and M4's TC_ADM_CFG_008 result on two
    // other dates): "yyyy-dd-mm ( <today, day/month swapped> )".
    await expect(localizationPage.dateFormatTrigger()).toContainText('yyyy-dd-mm');
    await expect(localizationPage.dateFormatTrigger()).toContainText('(');
  });

  test('TC_ADM_CFG_011 - Admin and Pim modules are locked enabled (checked and disabled)', async ({ page }) => {
    const modulesPage = new ModulesPage(page);
    await modulesPage.goto();

    // Pure observation — no toggle on this screen is ever clicked (Article VI /
    // the PRD's "very high blast radius" classification, exploration.md §2.7).
    expect(await modulesPage.moduleToggle('Admin Module').isOn()).toBe(true);
    expect(await modulesPage.moduleToggle('Admin Module').isDisabled()).toBe(true);
    expect(await modulesPage.moduleToggle('Pim Module').isOn()).toBe(true);
    expect(await modulesPage.moduleToggle('Pim Module').isDisabled()).toBe(true);
  });
});
