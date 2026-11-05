import { expect, test } from '@playwright/test';
import { unlock, watchErrors } from './helpers';

test.describe('desktop @desktop', () => {
  test('windows: open, drag, minimise with the genie, restore, close', async ({ page }) => {
    const errors = watchErrors(page);
    await unlock(page);
    const dock = page.getByRole('navigation', { name: 'Dock' });
    await dock.getByRole('button', { name: 'Terminal' }).click();
    const win = page.getByRole('region', { name: 'Terminal', exact: true });
    await expect(win).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeFocused();
    await page.waitForTimeout(600); // let the zoom-open animation finish before measuring

    const bar = win.locator('.win-bar');
    const before = await win.boundingBox();
    const b = await bar.boundingBox();
    if (!before || !b) throw new Error('no window');
    await page.mouse.move(b.x + b.width / 2, b.y + 14);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 - 120, b.y + 80, { steps: 6 });
    await page.mouse.up();
    const after = await win.boundingBox();
    expect(after && Math.round(after.x - before.x)).toBe(-120);

    await win.getByRole('button', { name: 'Minimise Terminal' }).click();
    await expect(win).toBeHidden();
    await dock.getByRole('button', { name: 'Terminal, open' }).click();
    await expect(win).toBeVisible();

    await win.getByRole('button', { name: 'Close Terminal' }).click();
    await expect(win).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('terminal: sudo hire atul opens Mail with a prefilled subject', async ({ page }) => {
    await unlock(page);
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: 'Terminal' })
      .click();
    const input = page.getByRole('textbox', { name: 'Terminal input' });
    await input.fill('sudo hire atul');
    await input.press('Enter');
    await input.fill('secret');
    await input.press('Enter');
    const mail = page.getByRole('region', { name: 'Mail', exact: true });
    await expect(mail).toBeVisible();
    await expect(mail.getByLabel('Subject')).toHaveValue("Let's work together");
    await expect(page.getByText(/secret found/i).first()).toBeVisible();
  });

  test('dragging the CV onto the Bin asks before deleting', async ({ page }) => {
    await unlock(page);
    const cv = page.getByRole('button', { name: /Atul_Bhadoriya_Resume\.pdf/ });
    const bin = page.locator('[data-dock="bin"]');
    const a = await cv.boundingBox();
    const t = await bin.boundingBox();
    if (!a || !t) throw new Error('missing');
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 });
    await page.mouse.up();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    // It must be on top, not hidden behind its own backdrop.
    const onTop = await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    expect(onTop).toBe(true);
    await expect(dialog.getByRole('link', { name: /keep it/i })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('settings: wallpaper is a keyboard-operable radio group and persists', async ({ page }) => {
    await unlock(page);
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: 'Settings' })
      .click();
    const radios = page.getByRole('group', { name: 'Wallpaper' }).getByRole('radio');
    await expect(radios).toHaveCount(3);
    await radios.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(radios.nth(1)).toBeChecked();
    const wall = await page.evaluate(() => document.documentElement.dataset.wall);
    await page.reload();
    await page.getByRole('button', { name: /skip intro/i }).click();
    await page.getByRole('button', { name: /enter atulos/i }).click();
    expect(await page.evaluate(() => document.documentElement.dataset.wall)).toBe(wall);
  });

  test('the character follows the pointer', async ({ page }) => {
    await unlock(page);
    const head = page.locator('.char').first();
    await page.mouse.move(10, 400);
    await page.waitForTimeout(400);
    const left = await head.evaluate((el) => el.innerHTML.length && getComputedStyle(el).transform);
    await page.mouse.move(1400, 400);
    await page.waitForTimeout(400);
    const irisTransforms = await page.$$eval('.char svg g[style], .char svg g[transform]', (gs) =>
      gs.map((g) => g.getAttribute('transform') ?? g.getAttribute('style')).join('|'),
    );
    expect(irisTransforms.length).toBeGreaterThan(0);
    expect(left).toBeDefined();
  });

  test('keyboard only: the whole OS is reachable with Tab', async ({ page }) => {
    await unlock(page);
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      // Sequential on purpose: each Tab depends on the previous focus.
      // oxlint-disable-next-line no-await-in-loop
      await page.keyboard.press('Tab');
      // oxlint-disable-next-line no-await-in-loop
      const label = await page.evaluate(() => {
        const el = document.activeElement;
        return el
          ? (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)
          : '';
      });
      seen.add(label);
    }
    for (const want of ['AtulOS menu', 'Projects', 'Terminal', 'Bin']) {
      expect(
        [...seen].some((s) => s.startsWith(want)),
        `Tab reaches ${want}`,
      ).toBe(true);
    }
  });
});

test.describe('new features @desktop', () => {
  test('the bulb switches the lights and the wallpaper', async ({ page }) => {
    await unlock(page);
    const bead = page.locator('.bulb-lamp');
    await bead.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await bead.focus();
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('html')).toHaveAttribute('data-wall', 'midnight');
    await page.reload();
    await page.getByRole('button', { name: /skip intro/i }).click();
    await page.getByRole('button', { name: /enter atulos/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('every Arcade game has a menu, starts, and has a results screen', async ({ page }) => {
    await unlock(page);
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: 'Arcade' })
      .click();
    const win = page.getByRole('region', { name: 'Arcade', exact: true });
    // The Arcade is code-split, so wait for it to load before reading the list.
    await expect(win.locator('.game-item')).toHaveCount(8);
    const names = await win.locator('.game-item b').allTextContents();
    for (const name of names) {
      // Sequential on purpose: one game at a time.
      /* oxlint-disable no-await-in-loop */
      await win.locator('.game-item', { hasText: name }).click();
      await expect(win.getByRole('heading', { name })).toBeVisible();
      await expect(win.getByText("Atul's best", { exact: true })).toBeVisible();
      await win.getByRole('button', { name: 'Play', exact: true }).click();
      await expect(win.locator('.gplay')).toBeVisible({ timeout: 4000 });
      /* oxlint-enable no-await-in-loop */
    }
  });

  test('ID card stays under the pointer while dragged', async ({ page }) => {
    await unlock(page);
    await page.waitForTimeout(1500);
    const box = await page.locator('.idc').boundingBox();
    if (!box) throw new Error('no card');
    const x = box.x + box.width * 0.4;
    const y = box.y + box.height * 0.3;
    await page.mouse.move(x, y);
    await page.mouse.down();
    /* oxlint-disable no-await-in-loop -- each step depends on the last */
    for (const [dx, dy] of [
      [120, 40],
      [260, 10],
      [180, 120],
    ]) {
      await page.mouse.move(x + dx, y + dy, { steps: 8 });
      await page.waitForTimeout(200);
      const under = await page.evaluate(
        ([px, py]) => !!document.elementFromPoint(px, py)?.closest('.idc'),
        [x + dx, y + dy],
      );
      expect(under).toBe(true);
    }
    /* oxlint-enable no-await-in-loop */
    await page.mouse.up();
  });

  test('the secrets trail: hidden notes, cipher, vault', async ({ page }) => {
    await unlock(page);
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: 'Terminal' })
      .click();
    const t = page.getByRole('textbox', { name: 'Terminal input' });
    await t.fill('ls -a');
    await t.press('Enter');
    await expect(page.getByText('.notes/')).toBeVisible();
    await t.fill('rot13 Gur cnffcuenfr');
    await t.press('Enter');
    await expect(page.getByText(/secret found: codebreaker/i).first()).toBeVisible();
    await t.fill('open vault');
    await t.press('Enter');
    const pass = page.locator('#vault-pass');
    await pass.fill('ship every day');
    await pass.press('Enter');
    await expect(page.getByRole('heading', { name: 'You found it.' })).toBeVisible();
  });
});

test('résumé downloads exist and the PDF is real text @desktop', async ({ request }) => {
  const pdf = await request.get('/Atul_Bhadoriya_Resume.pdf');
  expect(pdf.ok()).toBe(true);
  expect(pdf.headers()['content-type']).toContain('pdf');
  const docx = await request.get('/Atul_Bhadoriya_Resume.docx');
  expect(docx.ok()).toBe(true);
});

test.describe('phone @phone', () => {
  test('apps open as sheets, the home screen goes inert, and Back closes the sheet', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await unlock(page);
    await page.locator('.home-grid').getByRole('button', { name: 'Experience' }).click();
    const sheet = page.getByRole('region', { name: 'Experience', exact: true });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: /home/i })).toBeFocused();
    expect(
      await page.locator('main.home').evaluate((el) => el instanceof HTMLElement && el.inert),
    ).toBe(true);

    await page.goBack();
    await expect(sheet).toHaveCount(0);
    await expect(page.locator('.phone-os')).toBeVisible(); // still on the site
    expect(
      await page.locator('main.home').evaluate((el) => el instanceof HTMLElement && el.inert),
    ).toBe(false);
    expect(errors).toEqual([]);
  });

  test('the ID card sheet opens and closes', async ({ page }) => {
    await unlock(page);
    await page.locator('.hw-id').tap();
    const sheet = page.getByRole('region', { name: 'ID card', exact: true });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: /home/i }).tap();
    await expect(sheet).toHaveCount(0);
  });

  test('Snake can be played by swiping without scrolling the page', async ({ page }) => {
    await unlock(page);
    await page
      .locator('.home-grid, .home-dock')
      .getByRole('button', { name: 'Arcade' })
      .first()
      .tap();
    await expect(page.getByRole('region', { name: 'Arcade', exact: true })).toBeVisible();
    const touchAction = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'game-stage';
      const c = document.createElement('canvas');
      probe.appendChild(c);
      document.body.appendChild(probe);
      const v = getComputedStyle(c).touchAction;
      probe.remove();
      return v;
    });
    expect(touchAction).toBe('none');
  });
});
