import { expect, type Page } from '@playwright/test';

/** Collects console errors and CSP violations so a test can assert there were none. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // The GitHub widget is allowed to fail quietly when offline or rate limited.
    if (/api\.github\.com|jogruber\.de|Failed to load resource/.test(t)) return;
    errors.push(t);
  });
  return errors;
}

/** Skips the boot animation and unlocks to the desktop (or phone home screen). */
export async function unlock(page: Page) {
  // Stub the GitHub endpoints so tests are deterministic and offline-safe.
  await page.route(/api\.github\.com\/users\//, (r) =>
    r.fulfill({ json: { public_repos: 24, followers: 51 } }),
  );
  await page.route(/github-contributions-api\.jogruber\.de/, (r) =>
    r.fulfill({
      json: {
        contributions: Array.from({ length: 140 }, (_, i) => ({
          date: `2026-0${1 + Math.floor(i / 28)}-${String((i % 28) + 1).padStart(2, '0')}`,
          count: i % 5,
          level: i % 5,
        })),
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: /skip intro/i }).click();
  await page.getByRole('button', { name: /enter atulos/i }).click();
  await expect(page.locator('.desktop, .phone-os')).toBeVisible();
}

export type Box = { x: number; y: number; width: number; height: number; name: string };

/** Pairs of boxes that overlap by more than `slack` px in both directions. */
export function overlaps(boxes: Box[], slack = 2) {
  const hits: string[] = [];
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (ox > slack && oy > slack) hits.push(`${a.name} × ${b.name}`);
    }
  return hits;
}

/** Bounding boxes of every visible element matching `selector`, named by `label`. */
export async function boxesOf(page: Page, selector: string) {
  return page.$$eval(selector, (found) =>
    found
      .map((el) => {
        const r = el.getBoundingClientRect();
        const name =
          el.getAttribute('aria-label') ?? el.className.toString().split(' ').slice(0, 2).join('.');
        return { x: r.x, y: r.y, width: r.width, height: r.height, name };
      })
      .filter((b) => b.width > 0 && b.height > 0),
  );
}
