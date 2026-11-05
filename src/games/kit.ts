/**
 * Shared pieces for the Arcade games: an icon set (drawn as SVG and on canvas from the same
 * paths), crisp high-DPI canvases, keyboard + swipe controls, and score storage.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadNumber, save } from '../eggs/secrets';
import { closest } from '../lib/dom';
import { useLatest } from '../lib/hooks';

// ---------------------------------------------------------------- icons

/** 24×24 stroke icons. `fill` icons are drawn filled instead of stroked. */
export const ICONS = {
  text: { d: 'M5 6h14M12 6v13', label: 'Text' },
  row: { d: 'M3 8h5v8H3zM9.5 8h5v8h-5zM16 8h5v8h-5z', label: 'Row' },
  column: { d: 'M8 3h8v5H8zM8 9.5h8v5H8zM8 16h8v5H8z', label: 'Column' },
  container: { d: 'M4 4h16v16H4zM8 8h8v8H8z', label: 'Container' },
  image: { d: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01', label: 'Image' },
  button: { d: 'M3 8h18v8H3zM8 12h8', label: 'Button' },
  list: { d: 'M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11', label: 'ListView' },
  card: { d: 'M4 5h16v14H4zM4 9h16M7 13h6', label: 'Card' },
  switch: { d: 'M7 8h10a4 4 0 0 1 0 8H7a4 4 0 0 1 0-8zM16 12h.01', label: 'Switch' },
  slider: { d: 'M3 12h18M14 8v8', label: 'Slider' },
  stack: { d: 'M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 17l8 4 8-4', label: 'Stack' },
  cube: { d: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5', label: 'BLoC' },
  flame: {
    d: 'M7 20c-2-4 1-7 3-10 0 3 2 4 2 4 1-3 0-7 2-11 3 4 5 8 4 12-1 3-4 5-7 5z',
    label: 'Firebase',
  },
  git: { d: 'M6 4v10M6 17a3 3 0 1 0 .01 0M18 5a3 3 0 1 0 .01 0M18 8c0 5-6 4-12 6', label: 'Git' },
  rocket: {
    d: 'M12 3c4 2 6 6 5 11l-2 3H9l-2-3c-1-5 1-9 5-11zM12 9h.01M9 17l-2 4M15 17l2 4',
    label: 'Fastlane',
  },
  phone: { d: 'M7 2h10v20H7zM11 18h2', label: 'Device' },
  gauge: { d: 'M4 16a8 8 0 1 1 16 0M12 16l4-5', label: 'Perf' },
  lock: { d: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', label: 'Secure' },
  chart: { d: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6', label: 'Analytics' },
  bell: { d: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20h4', label: 'Push' },
  // power-ups and hazards
  bug: {
    d: 'M9 7a3 3 0 0 1 6 0M7 10h10v5a5 5 0 0 1-10 0zM4 11l3 1M20 11l-3 1M4 17l3-1M20 17l-3-1M12 10v10',
    label: 'Bug',
  },
  shield: { d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', label: 'Shield' },
  bolt: { d: 'M13 2L4 14h7l-1 8 9-12h-7z', label: 'Boost', fill: true },
  clock: { d: 'M12 3a9 9 0 1 0 .01 0M12 7v5l3 3', label: 'Time' },
  star: {
    d: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
    label: 'Star',
    fill: true,
  },
  snow: { d: 'M12 2v20M4 7l16 10M20 7L4 17', label: 'Freeze' },
  wrench: {
    d: 'M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z',
    label: 'Hotfix',
  },
  heart: {
    d: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
    label: 'Life',
    fill: true,
  },
} as const satisfies Record<string, { d: string; label: string; fill?: boolean }>;

export type IconId = keyof typeof ICONS;

const paths = new Map<string, Path2D>();

/** Draws icon `id` centred at (x, y), `size` px across, on a 2D canvas. */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  id: IconId,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const icon: { d: string; fill?: boolean } = ICONS[id];
  let p = paths.get(id);
  if (!p) {
    p = new Path2D(icon.d);
    paths.set(id, p);
  }
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (icon.fill) {
    ctx.fillStyle = color;
    ctx.fill(p);
  } else {
    ctx.strokeStyle = color;
    ctx.stroke(p);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- canvas

/**
 * Sizes a canvas for crisp drawing on high-density screens and returns a context whose
 * units are logical pixels (w × h).
 */
export function setupCanvas(canvas: HTMLCanvasElement | null, w: number, h: number) {
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Rounded rectangle path helper. */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ---------------------------------------------------------------- controls

export type Dir = 'up' | 'down' | 'left' | 'right';
const KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/**
 * Arrow keys / WASD and swipes on `el`, mapped to directions. Space and Enter map to `action`.
 * Keys are ignored while typing in a form field, so the game never steals text input.
 */
export function useControls(
  el: HTMLElement | null,
  handlers: { dir?: (d: Dir, down: boolean) => void; action?: (down: boolean) => void },
) {
  const latest = useLatest(handlers);
  useEffect(() => {
    const on = {
      dir: (d: Dir, down: boolean) => latest.current.dir?.(d, down),
      action: (down: boolean) => latest.current.action?.(down),
    };
    const has = { dir: !!latest.current.dir, action: !!latest.current.action };
    const key = (down: boolean) => (e: KeyboardEvent) => {
      if (closest(e.target, 'input,textarea,select')) return;
      const d = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      if (d && has.dir) {
        e.preventDefault();
        if (!e.repeat || !down) on.dir(d, down);
      } else if ((e.key === ' ' || e.key === 'Enter') && has.action) {
        e.preventDefault();
        if (!e.repeat || !down) on.action(down);
      }
    };
    const kd = key(true);
    const ku = key(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    // Swipes and taps on the play area.
    const start = { x: 0, y: 0, t: 0 };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      start.x = e.clientX;
      start.y = e.clientY;
      start.t = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) < 24) {
        on.action(true);
        on.action(false);
        return;
      }
      const d: Dir =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      on.dir(d, true);
      window.setTimeout(() => on.dir(d, false), 240);
    };
    el?.addEventListener('pointerdown', onDown);
    el?.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      el?.removeEventListener('pointerdown', onDown);
      el?.removeEventListener('pointerup', onUp);
    };
  }, [el, latest]);
}

// ---------------------------------------------------------------- scores

const bestKey = (id: string) => `atulos.best.${id}`;
const lastKey = (id: string) => `atulos.last.${id}`;

/** Whether `score` beats `best`. */
export const beats = (score: number, best: number | null, lowerIsBetter = false) =>
  best === null || (lowerIsBetter ? score < best : score > best);

/** A visitor's best and last score for a game (and mode), kept in localStorage. */
export function useScores(id: string, lowerIsBetter = false) {
  // Bumped after each recorded game so the values below are re-read.
  const [version, setVersion] = useState(0);
  const best = useMemo(() => (version >= 0 ? loadNumber(bestKey(id)) : null), [id, version]);
  const last = useMemo(() => (version >= 0 ? loadNumber(lastKey(id)) : null), [id, version]);
  /** Records a finished game. Returns true when it is a new personal best. */
  const record = useCallback(
    (score: number) => {
      save(lastKey(id), score);
      const prev = loadNumber(bestKey(id));
      const isBest = beats(score, prev, lowerIsBetter);
      if (isBest) save(bestKey(id), score);
      setVersion((v) => v + 1);
      return isBest;
    },
    [id, lowerIsBetter],
  );
  return { best, last, record };
}

/** Random integer in [0, n). */
export const rnd = (n: number) => Math.floor(Math.random() * n);
/** Random item of an array. */
export const pick = <T>(xs: readonly T[]): T => xs[rnd(xs.length)];
/** Fisher-Yates shuffle (a copy). */
export function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
