import { describe, expect, it } from 'vite-plus/test';
import {
  MAX_GIVE,
  MAX_SPEED,
  MAX_STRETCH,
  angularSpeed,
  cardAngle,
  createCard,
  dragCard,
  grabCard,
  releaseCard,
  stepCard,
  strapPath,
} from './lanyard';

const AX = 200;
const AY = 0;
const LEN = 80;
const ROD = 366;
const FLOOR = 10_000;

const run = (c: ReturnType<typeof createCard>, frames: number, floor = FLOOR) => {
  for (let i = 0; i < frames; i++) stepCard(c, AX, AY, LEN, 1, floor);
};
/** Where the grabbed point currently is on the card. */
const grabbedPoint = (c: ReturnType<typeof createCard>) => {
  if (!c.grab) throw new Error('not grabbed');
  const { t, k } = c.grab;
  const ab = { x: c.b.x - c.a.x, y: c.b.y - c.a.y };
  return { x: c.a.x + t * ab.x - k * ab.y, y: c.a.y + t * ab.y + k * ab.x };
};

describe('ID card physics', () => {
  it('hangs straight below the clip at the strap length', () => {
    const c = createCard(AX, AY, LEN, ROD);
    run(c, 600);
    expect(Math.abs(c.a.x - AX)).toBeLessThan(1);
    expect(Math.hypot(c.a.x - AX, c.a.y - AY)).toBeCloseTo(LEN, 0);
    expect(Math.abs(cardAngle(c))).toBeLessThan(1);
  });

  it('settles in about two seconds, without bouncing on the strap', () => {
    const c = createCard(AX, AY, LEN, ROD);
    let bounces = 0;
    let lastVy = 0;
    for (let i = 0; i < 120; i++) {
      run(c, 1);
      const vy = c.a.y - c.pa.y;
      if (lastVy > 0.5 && vy < -0.5) bounces++;
      lastVy = vy;
    }
    expect(bounces).toBeLessThanOrEqual(1);
    run(c, 60);
    expect(Math.abs(angularSpeed(c))).toBeLessThan(0.3);
    expect(Math.abs(cardAngle(c))).toBeLessThan(3);
  });

  it('keeps the card rigid', () => {
    const c = createCard(AX, AY, LEN, ROD);
    grabCard(c, c.b.x, c.b.y);
    dragCard(c, 600, 300, AX, AY, LEN);
    run(c, 30);
    releaseCard(c);
    run(c, 30);
    expect(Math.hypot(c.b.x - c.a.x, c.b.y - c.a.y)).toBeCloseTo(ROD, 0);
  });

  it('pins the exact grabbed point under the pointer, even off-centre', () => {
    const c = createCard(AX, AY, LEN, ROD);
    run(c, 300);
    // Grab the card 80px right of its axis, a third of the way down.
    const px = c.a.x + 80;
    const py = c.a.y + ROD / 3;
    grabCard(c, px, py);
    const path = [
      [px + 40, py + 10],
      [px + 90, py - 20],
      [px - 30, py + 40],
      [px - 60, py],
    ];
    for (const [x, y] of path) {
      dragCard(c, x, y, AX, AY, LEN);
      run(c, 8);
      const g = grabbedPoint(c);
      expect(g.x).toBeCloseTo(x, 0);
      expect(g.y).toBeCloseTo(y, 0);
    }
  });

  it('swings the card to hang below your fingers when held near the top', () => {
    const c = createCard(AX, AY, LEN, ROD);
    run(c, 300);
    grabCard(c, c.a.x, c.a.y + 20);
    dragCard(c, AX + 40, AY + 60, AX, AY, LEN); // within reach, so the strap is slack
    run(c, 240);
    expect(Math.abs(cardAngle(c))).toBeLessThan(6);
    expect(c.b.y).toBeGreaterThan(c.a.y);
  });

  it('follows the pointer past the strap, resisting like elastic, up to a limit', () => {
    const c = createCard(AX, AY, LEN, ROD);
    run(c, 200);
    grabCard(c, c.a.x, c.a.y);
    const reach = LEN * MAX_STRETCH;
    // A little past reach: the card follows, but lags behind the pointer.
    dragCard(c, AX, AY + reach + 100, AX, AY, LEN);
    run(c, 60);
    const near = Math.hypot(c.a.x - AX, c.a.y - AY);
    expect(near).toBeGreaterThan(reach + 40);
    expect(near).toBeLessThan(reach + 100);
    // Miles away: it stops at the elastic's limit.
    dragCard(c, AX, 9_000, AX, AY, LEN);
    run(c, 60);
    expect(Math.hypot(c.a.x - AX, c.a.y - AY)).toBeLessThanOrEqual(reach + MAX_GIVE + 1);
  });

  it('stays finite and calm after a violent throw', () => {
    const c = createCard(AX, AY, LEN, ROD);
    grabCard(c, c.b.x, c.b.y);
    for (let i = 0; i < 6; i++) {
      dragCard(c, i % 2 ? -4000 : 4000, i % 2 ? 4000 : -4000, AX, AY, LEN);
      run(c, 1);
    }
    releaseCard(c, AX, AY, LEN);
    for (let i = 0; i < 400; i++) {
      run(c, 1, 800);
      for (const v of [c.a.x, c.a.y, c.b.x, c.b.y]) expect(Number.isFinite(v)).toBe(true);
      expect(Math.hypot(c.a.x - c.pa.x, c.a.y - c.pa.y)).toBeLessThanOrEqual(MAX_SPEED * 1.5);
    }
    expect(Math.abs(angularSpeed(c))).toBeLessThan(0.5); // and it comes to rest
  });

  it('never falls through the floor', () => {
    const c = createCard(AX, AY, 1_000, ROD);
    for (let i = 0; i < 300; i++) {
      stepCard(c, AX, AY, 1_000, 1, 400);
      expect(c.a.y).toBeLessThanOrEqual(400.01);
      expect(c.b.y).toBeLessThanOrEqual(400 + ROD + 0.01);
    }
  });

  it('runs at the same speed at 60 Hz and 120 Hz', () => {
    const a = createCard(AX, AY, LEN, ROD);
    const b = createCard(AX, AY, LEN, ROD);
    for (let i = 0; i < 60; i++) stepCard(a, AX, AY, LEN, 1, FLOOR);
    for (let i = 0; i < 120; i++) stepCard(b, AX, AY, LEN, 0.5, FLOOR);
    expect(b.a.x).toBeCloseTo(a.a.x, 3);
    expect(b.b.y).toBeCloseTo(a.b.y, 3);
  });

  it('reports a hard spin on release', () => {
    const c = createCard(AX, AY, LEN, ROD);
    run(c, 200);
    grabCard(c, c.b.x, c.b.y);
    for (let i = 0; i < 6; i++) {
      dragCard(c, AX + 300 * Math.cos(i), AY + LEN + 200 * Math.sin(i), AX, AY, LEN);
      run(c, 1);
    }
    const spinning = Math.abs(angularSpeed(c)) > 16;
    expect(releaseCard(c)).toBe(spinning);
    expect(c.grab).toBeNull();
  });

  it('draws a curve when slack and a line when taut', () => {
    const c = createCard(AX, AY, LEN, ROD);
    c.a = { x: AX, y: 20 };
    expect(strapPath(c, AX, AY, LEN)).toMatch(/Q/);
    c.a = { x: AX, y: LEN * 1.2 };
    expect(strapPath(c, AX, AY, LEN)).toMatch(/L/);
  });
});
