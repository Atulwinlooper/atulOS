import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { unlock } from './helpers';

async function audit(page: Page, where: string) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  const summary = bad.map(
    (v) => `${where}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary).toEqual([]);
}

test('lock screen is accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /skip intro/i }).click();
  await expect(page.getByRole('button', { name: /enter atulos/i })).toBeFocused();
  await audit(page, 'lock');
});

test('home screen is accessible', async ({ page }) => {
  await unlock(page);
  await audit(page, 'home');
});

const APPS = [
  'Projects',
  'Experience',
  'Skills',
  'Terminal',
  'Resume',
  'Mail',
  'Arcade',
  'Settings',
  'About Atul',
];
for (const app of APPS) {
  test(`${app} is accessible`, async ({ page }, info) => {
    await unlock(page);
    if (info.project.name === 'phone') {
      const btn = page.locator('.home-grid, .home-dock').getByRole('button', { name: app }).first();
      test.skip((await btn.count()) === 0, `${app} is not on the phone home screen`);
      await btn.click();
    } else {
      await page
        .getByRole('navigation', { name: 'Dock' })
        .getByRole('button', { name: app })
        .click();
    }
    await expect(page.getByRole('region', { name: app, exact: true })).toBeVisible();
    await page.waitForTimeout(500);
    await audit(page, app);
  });
}
