/**
 * Physics for the ID card on its lanyard, as a real card behaves: a rigid card on a strap that
 * barely stretches. The card is two points joined by a stiff rod (A, the punched hole at the
 * top, and B, the bottom edge), simulated with Verlet integration and position constraints.
 *
 * - Hanging: gravity pulls both points; the strap stops A going further than `length` from the
 *   clip, so it swings and settles quickly, with no springy bounce.
 * - Dragging: the exact point you grabbed is pinned to the pointer, and the rest of the card
 *   swings from your fingers under its own weight. It never slides away from the cursor.
 *
 * Pure functions, units are CSS px and 60 fps frames, so it is easy to test.
 */

type Pt = { x: number; y: number };

export type Grab = {
  /** Grab point along the card's axis, 0 = hole, 1 = bottom edge. */
  t: number;
  /** Sideways offset from the axis, as a fraction of the rod length. */
  k: number;
  /** Where the pointer wants the grab point to be. */
  target: Pt;
  /** Extra strap length the elastic gives while pulled past its reach. */
  give: number;
};

export type Card = {
  a: Pt;
  b: Pt;
  pa: Pt;
  pb: Pt;
  /** Fixed distance between A and B. */
  rod: number;
  grab: Grab | null;
  /** Stretch left in the elastic after letting go; it recoils over a few frames, not at once. */
  slack: number;
  /** Carry-over time for the fixed 1-frame step. */
  acc: number;
};

export const GRAVITY = 0.55;
/** Velocity kept per frame. Lower settles sooner; real cards stop in about two swings. */
export const DAMPING = 0.965;
/** While held, extra damping so the card does not flail around your fingers. */
export const HELD_DAMPING = 0.9;
/** How far the lanyard gives before it starts to resist, as a multiple of its length. */
export const MAX_STRETCH = 1.35;
/** Past that, the card follows the pointer at this fraction of the distance (rubber band)... */
export const RUBBER = 0.55;
/** ...up to this many extra pixels. */
export const MAX_GIVE = 260;
/** Max movement per frame, so a wild throw cannot break the simulation. */
export const MAX_SPEED = 38;
/** Angular speed (degrees per frame) after a throw that counts as spinning the card. */
export const SPIN_SPEED = 16;
const ITERATIONS = 6;

const sub = (p: Pt, q: Pt) => ({ x: p.x - q.x, y: p.y - q.y });
const len = (p: Pt) => Math.hypot(p.x, p.y);

/** A card hanging at rest under its clip, nudged slightly so it settles in with a small sway. */
export function createCard(ax: number, ay: number, length: number, rod: number): Card {
  const a = { x: ax + 6, y: ay + length * 0.7 };
  const b = { x: a.x + 10, y: a.y + rod };
  return { a, b, pa: { ...a }, pb: { ...b }, rod, grab: null, slack: 0, acc: 0 };
}

/** Card rotation in degrees; 0 means hanging straight down. */
export function cardAngle(c: Card) {
  return (-Math.atan2(c.b.x - c.a.x, c.b.y - c.a.y) * 180) / Math.PI;
}

function integrate(p: Pt, prev: Pt, keep: number) {
  let vx = (p.x - prev.x) * keep;
  let vy = (p.y - prev.y) * keep + GRAVITY;
  const sp = Math.hypot(vx, vy);
  if (sp > MAX_SPEED) {
    vx *= MAX_SPEED / sp;
    vy *= MAX_SPEED / sp;
  }
  prev.x = p.x;
  prev.y = p.y;
  p.x += vx;
  p.y += vy;
}

/** Exact pin of the grabbed point (axis offset t, side offset k) onto its target. */
function pin(c: Card, g: Grab) {
  const ab = sub(c.b, c.a);
  // Grabbed point G = A + t·AB + k·perp(AB), linear in A and B.
  const gx = c.a.x + g.t * ab.x - g.k * ab.y;
  const gy = c.a.y + g.t * ab.y + g.k * ab.x;
  const dx = g.target.x - gx;
  const dy = g.target.y - gy;
  // Minimum-norm correction that moves G exactly onto the target (lets the card rotate freely).
  const s = (1 - g.t) ** 2 + g.t ** 2 + 2 * g.k ** 2;
  const u = 1 - g.t;
  c.a.x += (u * dx - g.k * dy) / s;
  c.a.y += (u * dy + g.k * dx) / s;
  c.b.x += (g.t * dx + g.k * dy) / s;
  c.b.y += (g.t * dy - g.k * dx) / s;
}

function rodConstraint(c: Card) {
  const ab = sub(c.b, c.a);
  const d = len(ab) || 1;
  const diff = (d - c.rod) / d / 2;
  c.a.x += ab.x * diff;
  c.a.y += ab.y * diff;
  c.b.x -= ab.x * diff;
  c.b.y -= ab.y * diff;
}

function strapConstraint(c: Card, ax: number, ay: number, length: number, soft: number) {
  const dx = c.a.x - ax;
  const dy = c.a.y - ay;
  const d = Math.hypot(dx, dy) || 1;
  if (d <= length) return; // a slack strap pulls nothing
  const f = ((d - length) / d) * soft;
  c.a.x -= dx * f;
  c.a.y -= dy * f;
}

function floorConstraint(p: Pt, prev: Pt, floor: number) {
  if (p.y <= floor) return;
  p.y = floor;
  prev.x = p.x - (p.x - prev.x) * 0.6; // friction on the floor
}

function step(c: Card, ax: number, ay: number, length: number, floor: number) {
  const keep = c.grab ? HELD_DAMPING : DAMPING;
  integrate(c.a, c.pa, keep);
  integrate(c.b, c.pb, keep);
  c.slack *= 0.8;
  for (let i = 0; i < ITERATIONS; i++) {
    // Held: the elastic strap gives a little. Free: it is nearly rigid, so no bounce.
    const limit = c.grab ? length * MAX_STRETCH + c.grab.give : length + c.slack;
    strapConstraint(c, ax, ay, limit, c.grab ? 1 : 0.8);
    rodConstraint(c);
    if (c.grab) pin(c, c.grab);
  }
  floorConstraint(c.a, c.pa, floor);
  floorConstraint(c.b, c.pb, floor + c.rod);
}

/** Advances the card by `dt` frames, in fixed 1-frame steps for stable, frame-rate-free motion. */
export function stepCard(
  c: Card,
  ax: number,
  ay: number,
  length: number,
  dt: number,
  floor: number,
) {
  c.acc = Math.min(c.acc + dt, 4);
  while (c.acc >= 1) {
    step(c, ax, ay, length, floor);
    c.acc -= 1;
  }
}

/**
 * Starts dragging at pointer (px, py). Works out where on the card that is, so that exact
 * spot stays under the pointer.
 */
export function grabCard(c: Card, px: number, py: number) {
  const ab = sub(c.b, c.a);
  const l2 = ab.x * ab.x + ab.y * ab.y || 1;
  const ap = sub({ x: px, y: py }, c.a);
  const t = (ap.x * ab.x + ap.y * ab.y) / l2;
  const k = (ab.x * ap.y - ab.y * ap.x) / l2;
  c.grab = { t, k, target: { x: px, y: py }, give: 0 };
}

/**
 * Moves the grab target. Within the strap's reach the card follows the pointer exactly; past
 * it, the elastic resists more the further you pull, so the card lags but keeps following.
 */
export function dragCard(c: Card, px: number, py: number, ax: number, ay: number, length: number) {
  const g = c.grab;
  if (!g) return;
  const reach = length * MAX_STRETCH + c.rod * Math.hypot(g.t, g.k);
  const dx = px - ax;
  const dy = py - ay;
  const d = Math.hypot(dx, dy) || 1;
  if (d <= reach) {
    g.give = 0;
    g.target = { x: px, y: py };
    return;
  }
  g.give = Math.min(MAX_GIVE, (d - reach) * RUBBER);
  const r = reach + g.give;
  g.target = { x: ax + (dx / d) * r, y: ay + (dy / d) * r };
}

/** Lets go. Returns true when the throw is spinning the card fast enough to count as a spin. */
export function releaseCard(c: Card, ax?: number, ay?: number, length?: number) {
  c.grab = null;
  if (ax !== undefined && ay !== undefined && length !== undefined) {
    c.slack = Math.max(0, Math.hypot(c.a.x - ax, c.a.y - ay) - length);
  }
  return Math.abs(angularSpeed(c)) > SPIN_SPEED;
}

/** Current angular speed in degrees per frame. */
export function angularSpeed(c: Card) {
  const now = Math.atan2(c.b.x - c.a.x, c.b.y - c.a.y);
  const before = Math.atan2(c.pb.x - c.pa.x, c.pb.y - c.pa.y);
  let d = now - before;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return (-d * 180) / Math.PI;
}

/** SVG path for the strap: a sagging curve when slack, a straight line when taut. */
export function strapPath(c: Card, ax: number, ay: number, length: number) {
  const { x, y } = c.a;
  const d = Math.hypot(x - ax, y - ay);
  if (d < length) {
    const cx = (ax + x) / 2;
    const cy = (ay + y) / 2 + (length - d) * 0.6;
    return `M${ax} ${ay}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `M${ax} ${ay}L${x.toFixed(1)} ${y.toFixed(1)}`;
}
