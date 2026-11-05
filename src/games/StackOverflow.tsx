import { useEffect, useRef, useState } from 'react';
import { rafLoop } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import { setupCanvas, useControls } from './kit';
import { GIcon, type GameDef, type GameProps } from './Shell';

const W = 480;
const H = 560;
const BH = 30;
const START_W = 220;
const LAYERS = [
  'Device',
  'OS',
  'Flutter engine',
  'Widgets',
  'Design system',
  'State (BLoC)',
  'Use cases',
  'Domain',
  'Repository',
  'API client',
  'Cache',
  'Auth',
  'Analytics',
  'Crash reports',
  'CI pipeline',
  'Store release',
];
const COLORS = [
  '#FF7A3D',
  '#FF9A63',
  '#F6D38C',
  '#8FD19E',
  '#7FB7C9',
  '#8A8FD9',
  '#B9A6FF',
  '#D9798E',
];

type Block = { x: number; w: number; label: string; color: string };
type Chip = { x: number; y: number; w: number; vy: number; vr: number; r: number; color: string };

/** Pure: cuts the moving block against the one below. Returns the kept part, or null on a miss. */
export function cut(
  moving: { x: number; w: number },
  below: { x: number; w: number },
  perfect = 5,
) {
  const off = moving.x - below.x;
  if (Math.abs(off) <= perfect) return { x: below.x, w: below.w, perfect: true, chip: null };
  const left = Math.max(moving.x, below.x);
  const right = Math.min(moving.x + moving.w, below.x + below.w);
  if (right <= left) return null;
  const chip =
    off > 0 ? { x: right, w: moving.x + moving.w - right } : { x: moving.x, w: left - moving.x };
  return { x: left, w: right - left, perfect: false, chip };
}

function StackGame({ onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [hud, setHud] = useState({ floors: 0, streak: 0, note: '' });
  const end = useLatest(onEnd);
  const drop = useRef(false);

  useControls(stage, {
    action: (down) => {
      if (down) drop.current = true;
    },
    dir: (d, down) => {
      if (d === 'down' && down) drop.current = true;
    },
  });

  useEffect(() => {
    const el = canvas.current;
    const ctx = setupCanvas(el, W, H);
    if (!el || !ctx) return undefined;
    // Mouse clicks here; touch taps come through useControls, so they are not counted twice.
    const tap = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') drop.current = true;
    };
    el.addEventListener('pointerdown', tap);
    const g = {
      stack: [{ x: (W - START_W) / 2, w: START_W, label: LAYERS[0], color: COLORS[0] }] as Block[],
      cur: { x: 0, w: START_W, dir: 1 },
      speed: 2.6,
      chips: [] as Chip[],
      cam: 0,
      streak: 0,
      over: false,
      note: '',
      noteUntil: 0,
      frame: 0,
    };
    const yOf = (i: number) => H - 60 - (i + 1) * BH;

    const draw = () => {
      ctx.fillStyle = '#0F0D11';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(0, g.cam);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, H - 60, W, 60);
      g.stack.forEach((b, i) => {
        const y = yOf(i - 1);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, y, b.w, BH - 3, 6);
        ctx.fill();
        if (b.w > 60) {
          ctx.fillStyle = '#0b0a0c';
          ctx.font = '600 12px IBM Plex Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, b.x + b.w / 2, y + 18, b.w - 10);
          ctx.textAlign = 'left';
        }
      });
      if (!g.over) {
        const i = g.stack.length;
        const y = yOf(i - 1);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.roundRect(g.cur.x, y, g.cur.w, BH - 3, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (const c of g.chips) {
        ctx.save();
        ctx.translate(c.x + c.w / 2, c.y + BH / 2);
        ctx.rotate(c.r);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-c.w / 2, -BH / 2, c.w, BH - 3);
        ctx.restore();
      }
      ctx.restore();
    };

    const stop = rafLoop((dt) => {
      g.frame += dt;
      for (const c of g.chips) {
        c.vy += 0.5 * dt;
        c.y += c.vy * dt;
        c.r += c.vr * dt;
      }
      g.chips = g.chips.filter((c) => c.y + g.cam < H + 60);
      // Camera follows the top of the stack.
      const want = Math.max(0, g.stack.length * BH - H * 0.55);
      g.cam += (want - g.cam) * 0.08;
      if (!g.over) {
        g.cur.x += g.cur.dir * g.speed * dt;
        if (g.cur.x < -g.cur.w * 0.3) g.cur.dir = 1;
        if (g.cur.x + g.cur.w > W + g.cur.w * 0.3) g.cur.dir = -1;
        if (drop.current) {
          drop.current = false;
          const below = g.stack[g.stack.length - 1];
          const res = cut(g.cur, below);
          const i = g.stack.length;
          const color = COLORS[i % COLORS.length];
          if (!res) {
            g.chips.push({ x: g.cur.x, y: yOf(i - 1), w: g.cur.w, vy: 0, vr: 0.02, r: 0, color });
            g.over = true;
            window.setTimeout(() => end.current(g.stack.length - 1), 900);
          } else {
            if (res.chip) {
              g.chips.push({
                x: res.chip.x,
                y: yOf(i - 1),
                w: res.chip.w,
                vy: 0,
                vr: (res.chip.x > res.x ? 1 : -1) * 0.03,
                r: 0,
                color,
              });
            }
            g.streak = res.perfect ? g.streak + 1 : 0;
            // A run of perfect drops grows the block back.
            const w = res.perfect && g.streak >= 3 ? Math.min(START_W, res.w + 12) : res.w;
            const x = res.perfect && g.streak >= 3 ? res.x - (w - res.w) / 2 : res.x;
            g.stack.push({ x, w, label: LAYERS[i % LAYERS.length], color });
            g.cur = { x: g.cur.dir > 0 ? -w * 0.2 : W - w * 0.8, w, dir: g.cur.dir };
            g.speed = Math.min(7.5, 2.6 + g.stack.length * 0.16);
            if (res.perfect) {
              g.note = g.streak >= 3 ? `Perfect ×${g.streak}. Block grows back.` : 'Perfect!';
              g.noteUntil = g.frame + 70;
            }
            setHud({ floors: g.stack.length - 1, streak: g.streak, note: g.note });
          }
        }
      }
      if (g.note && g.frame > g.noteUntil) {
        g.note = '';
        setHud((h) => ({ ...h, note: '' }));
      }
      draw();
    });
    return () => {
      stop();
      el.removeEventListener('pointerdown', tap);
    };
  }, [end]);

  return (
    <div className="game stacker">
      <div className="game-hud">
        <span>
          Floors <b className="mono">{hud.floors}</b>
        </span>
        {hud.streak > 1 && <span className="hot">Streak ×{hud.streak}</span>}
        {hud.note && <span className="hot">{hud.note}</span>}
      </div>
      <div ref={setStage} className="game-stage stack-stage">
        <canvas
          ref={canvas}
          width={W}
          height={H}
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export const stackOverflow: GameDef = {
  id: 'stack',
  name: 'Stack Overflow',
  blurb: 'Stack an app’s architecture as high as it goes.',
  tile: '#F6D38C',
  icon: <GIcon id="stack" size={40} color="#0b0a0c" />,
  unit: 'floors',
  howTo: [
    'Click, tap or press Space to drop the sliding layer.',
    'Whatever hangs over the edge is cut off, so the stack gets narrower.',
    'Land it dead centre for a Perfect. Three in a row and the block grows back.',
    'It speeds up as the stack grows. Miss completely and it all comes down.',
  ],
  atul: () => 'stack',
  Game: StackGame,
};
