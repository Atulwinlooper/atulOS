import { expect, test } from '@playwright/test';
import { boxesOf, overlaps, unlock, watchErrors } from './helpers';

/** Every screen size AtulOS should look right on. Phones get touch and a coarse pointer. */
const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080, phone: false },
  { name: '1440x900', width: 1440, height: 900, phone: false },
  { name: '1280x720', width: 1280, height: 720, phone: false },
  { name: '1024x768', width: 1024, height: 768, phone: false },
  { name: 'tablet-768x1024', width: 768, height: 1024, phone: false, touch: true },
  { name: 'phone-390x844', width: 390, height: 844, phone: true },
  { name: 'phone-360x640', width: 360, height: 640, phone: true },
  { name: 'phone-landscape-844x390', width: 844, height: 390, phone: true },
];

for (const vp of VIEWPORTS) {
  test.describe(`layout ${vp.name} @desktop`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.phone,
      hasTouch: vp.phone || !!vp.touch,
    });

    test('fits the screen without page scroll, overlap or errors', async ({ page }) => {
      const errors = watchErrors(page);
      await unlock(page);
      await page.waitForTimeout(600); // let entrance animations settle

      const scroll = await page.evaluate(() => ({
        w: document.documentElement.scrollWidth - innerWidth,
        h: document.documentElement.scrollHeight - innerHeight,
      }));
      expect(scroll.w, 'horizontal page scroll').toBeLessThanOrEqual(0);
      expect(scroll.h, 'vertical page scroll').toBeLessThanOrEqual(0);

      if (vp.phone) {
        await expect(page.locator('.phone-os')).toBeVisible();
        // Portrait phones get a dock; in landscape every app is in the grid instead.
        const dock = page.locator('.home-dock');
        if (vp.width < vp.height) {
          const b = await dock.boundingBox();
          expect(b && b.y + b.height).toBeLessThanOrEqual(vp.height + 1);
        } else {
          await expect(dock).toBeHidden();
          await expect(page.locator('.home-grid')).toBeVisible();
        }
      } else {
        await expect(page.locator('.desktop')).toBeVisible();
        const dock = await page.locator('nav.dock').boundingBox();
        expect(dock, 'dock visible').not.toBeNull();
        if (dock) {
          expect(dock.x).toBeGreaterThanOrEqual(0);
          expect(dock.x + dock.width).toBeLessThanOrEqual(vp.width);
          expect(dock.y + dock.height).toBeLessThanOrEqual(vp.height);
        }
        // Desktop furniture must not sit on top of each other.
        const furniture = await boxesOf(
          page,
          '.menubar, nav.dock, .widget, .d-icons, .hello, .idc, .char, .bulb-lamp',
        );
        // The ID card hangs from the menu bar by design; everything else needs its own space.
        const hits = overlaps(furniture, 4).filter((h) => !/^menubar × .*staff ID/.test(h));
        expect(hits).toEqual([]);
        // Every widget is fully on screen.
        for (const b of await boxesOf(page, '.widget, .d-icons, .idc')) {
          expect(b.x, b.name).toBeGreaterThanOrEqual(0);
          expect(b.x + b.width, b.name).toBeLessThanOrEqual(vp.width + 1);
          expect(b.y + b.height, b.name).toBeLessThanOrEqual(vp.height + 1);
        }
      }

      await page.screenshot({ path: `e2e/.results/shots/${vp.name}.png` });
      expect(errors).toEqual([]);
    });

    test('opens an app that fits the screen', async ({ page }) => {
      await unlock(page);
      if (vp.phone) {
        await page.locator('.home-grid').getByRole('button', { name: 'Projects' }).click();
        const sheet = page.getByRole('region', { name: 'Projects', exact: true });
        await expect(sheet).toBeVisible();
        const b = await sheet.boundingBox();
        expect(b && b.width).toBeLessThanOrEqual(vp.width + 1);
      } else {
        await page
          .getByRole('navigation', { name: 'Dock' })
          .getByRole('button', { name: 'Projects' })
          .click();
        const win = page.getByRole('region', { name: 'Projects', exact: true });
        await expect(win).toBeVisible();
        await page.waitForTimeout(500);
        const b = await win.boundingBox();
        expect(b, 'window').not.toBeNull();
        if (b) {
          expect(b.x).toBeGreaterThanOrEqual(0);
          expect(b.x + b.width).toBeLessThanOrEqual(vp.width + 1);
          expect(b.y).toBeGreaterThanOrEqual(0);
        }
        const inner = await win.evaluate((el) => {
          const body = el.querySelector('.win-body');
          return body ? body.scrollWidth - body.clientWidth : 0;
        });
        expect(inner, 'no sideways scroll inside the window').toBeLessThanOrEqual(1);
      }
      await page.screenshot({ path: `e2e/.results/shots/${vp.name}-app.png` });
    });
  });
}
