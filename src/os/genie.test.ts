import { describe, expect, it } from 'vite-plus/test';
import { BASE, MAX, RANGE, magnify, restCentres } from './Dock';
import { clampWindow, genieFrames, zoomFromIcon } from './genie';

const win = { left: 100, top: 100, width: 800, height: 500 };
const icon = { left: 480, top: 900, width: 52, height: 52 };

describe('genie and zoom keyframes', () => {
  it('starts untouched and ends on the dock icon', () => {
    const f = genieFrames(win, icon);
    expect(f[0].transform).toBe('none');
    const end = String(f.at(-1)?.transform);
    // centre of window (500, 350) → centre of icon (506, 926)
    expect(end).toContain('translate(6px, 576px)');
    expect(end).toContain(`scale(${52 / 800}, ${52 / 500})`);
  });
  it('funnels the clip path towards the icon', () => {
    const f = genieFrames(win, icon);
    expect(String(f[1].clipPath)).toMatch(/^polygon\(0% 0%, 100% 0%/);
    expect(f[1].clipPath).toBe(f[2].clipPath);
  });
  it('keeps the funnel tip within sane bounds for far-away icons', () => {
    const f = genieFrames(win, { ...icon, left: -5000 });
    const nums =
      String(f[1].clipPath)
        .match(/-?\d+(\.\d+)?/g)
        ?.map(Number) ?? [];
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(-40);
    expect(Math.max(...nums)).toBeLessThanOrEqual(140);
  });
  it('zooms from the icon to full size', () => {
    const f = zoomFromIcon(win, icon);
    expect(f[0].opacity).toBeLessThan(1);
    expect(f[1]).toEqual({ opacity: 1, transform: 'none' });
  });
});

describe('window clamping', () => {
  it('keeps the title bar reachable', () => {
    expect(clampWindow(-5000, -50, 800, 1440, 900)).toEqual({ x: -680, y: 30 });
    expect(clampWindow(5000, 5000, 800, 1440, 900)).toEqual({ x: 1320, y: 780 });
    expect(clampWindow(200, 200, 800, 1440, 900)).toEqual({ x: 200, y: 200 });
  });
});

describe('dock magnification', () => {
  it('peaks under the pointer and falls off smoothly', () => {
    expect(magnify(0)).toBe(MAX);
    expect(magnify(RANGE + 1)).toBe(BASE);
    let prev = magnify(0);
    for (let d = 5; d <= RANGE; d += 5) {
      const v = magnify(d);
      expect(v).toBeLessThanOrEqual(prev);
      expect(v).toBeGreaterThanOrEqual(BASE);
      prev = v;
    }
  });
});

describe('dock resting layout', () => {
  it('is centred and evenly spaced, with room for the separator', () => {
    const c = restCentres(10, 8);
    expect(c[0] + c[9]).toBeCloseTo(0, 5);
    expect(c[1] - c[0]).toBeCloseTo(BASE + 8);
    expect(c[8] - c[7]).toBeGreaterThan(c[1] - c[0]);
  });
});
