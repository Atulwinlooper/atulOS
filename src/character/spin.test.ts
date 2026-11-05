import { describe, expect, it } from 'vite-plus/test';
import { createSpinDetector } from './spin';

/** Feeds points around a circle and reports whether the detector fired. */
function circle(feed: ReturnType<typeof createSpinDetector>, turns: number, ms: number, r = 150) {
  const steps = Math.round(turns * 48);
  let fired = false;
  for (let i = 0; i <= steps; i++) {
    const a = (i / 48) * Math.PI * 2;
    fired = feed(500 + Math.cos(a) * r, 400 + Math.sin(a) * r, 500, 400, (i / steps) * ms) || fired;
  }
  return fired;
}

describe('spin detector (dizzy egg)', () => {
  it('fires after two quick circles', () => {
    expect(circle(createSpinDetector(), 2, 1200)).toBe(true);
  });
  it('fires in either direction', () => {
    const feed = createSpinDetector();
    let fired = false;
    for (let i = 0; i <= 96; i++) {
      const a = -(i / 48) * Math.PI * 2;
      fired = feed(500 + Math.cos(a) * 150, 400 + Math.sin(a) * 150, 500, 400, i * 12) || fired;
    }
    expect(fired).toBe(true);
  });
  it('ignores one slow circle', () => {
    expect(circle(createSpinDetector(), 1, 1200)).toBe(false);
    expect(circle(createSpinDetector(), 2, 6000)).toBe(false);
  });
  it('ignores circles too close to or too far from the centre', () => {
    expect(circle(createSpinDetector(), 3, 1200, 20)).toBe(false);
    expect(circle(createSpinDetector(), 3, 1200, 800)).toBe(false);
  });
  it('ignores back-and-forth wiggles', () => {
    const feed = createSpinDetector();
    let fired = false;
    for (let i = 0; i < 200; i++) {
      const a = Math.sin(i / 3) * 1.2;
      fired = feed(500 + Math.cos(a) * 150, 400 + Math.sin(a) * 150, 500, 400, i * 8) || fired;
    }
    expect(fired).toBe(false);
  });
});
