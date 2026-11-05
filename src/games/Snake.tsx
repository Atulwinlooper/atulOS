import { useEffect, useRef, useState } from 'react';
import { useLatest } from '../lib/hooks';
import { drawIcon, pick, rnd, setupCanvas, useControls, type Dir, type IconId } from './kit';
import { GIcon, type GameDef, type GameProps } from './Shell';

const COLS = 20;
const ROWS = 14;
const CELL = 28;
const PAD = 10; // wall thickness
const W = COLS * CELL + PAD * 2;
const H = ROWS * CELL + PAD * 2;
const START_MS = 210;
const MIN_MS = 85;

type Pt = { x: number; y: number };
type Food = Pt & {
  kind: 'widget' | 'gold' | 'reload' | 'ghost' | 'bug';
  icon: IconId;
  pts: number;
  color: string;
  until: number;
};

/** Flutter widgets to eat. Bigger widgets are worth more. */
const WIDGETS: { icon: IconId; pts: number; color: string }[] = [
  { icon: 'text', pts: 1, color: '#7FB7C9' },
  { icon: 'button', pts: 1, color: '#FF9A63' },
  { icon: 'image', pts: 1, color: '#8FD19E' },
  { icon: 'row', pts: 2, color: '#F6D38C' },
  { icon: 'column', pts: 2, color: '#F6D38C' },
  { icon: 'container', pts: 2, color: '#B9A6FF' },
  { icon: 'card', pts: 2, color: '#FF7A3D' },
  { icon: 'list', pts: 3, color: '#7FB7C9' },
  { icon: 'stack', pts: 3, color: '#FF9A63' },
];
const DIRS: Record<Dir, Pt> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function SnakeGame({ onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [hud, setHud] = useState({ score: 0, length: 3, status: '', tree: 'MaterialApp' });
  const end = useLatest(onEnd);
  const queue = useRef<Pt[]>([]);
  const dir = useRef<Pt>({ x: 1, y: 0 });

  useControls(stage, {
    dir: (d, down) => {
      if (!down) return;
      const v = DIRS[d];
      const last = queue.current.at(-1) ?? dir.current;
      if (v.x === -last.x && v.y === -last.y) return; // no reversing into yourself
      if (v.x === last.x && v.y === last.y) return;
      if (queue.current.length < 3) queue.current.push(v);
    },
  });

  useEffect(() => {
    const ctx = setupCanvas(canvas.current, W, H);
    if (!ctx) return undefined;
    const g = {
      snake: [
        { x: 6, y: 7 },
        { x: 5, y: 7 },
        { x: 4, y: 7 },
      ] as Pt[],
      food: [] as Food[],
      score: 0,
      eaten: 0,
      speed: START_MS,
      slowUntil: 0,
      ghostUntil: 0,
      grow: 0,
      timer: 0,
      tree: ['MaterialApp'],
      dead: false,
    };
    const free = (): Pt => {
      for (;;) {
        const p = { x: rnd(COLS), y: rnd(ROWS) };
        const taken =
          g.snake.some((s) => s.x === p.x && s.y === p.y) ||
          g.food.some((f) => f.x === p.x && f.y === p.y);
        if (!taken) return p;
      }
    };
    const addWidget = () => {
      const w = pick(WIDGETS);
      g.food.push({ ...free(), kind: 'widget', ...w, until: Infinity });
    };
    const maybeSpecial = () => {
      const now = performance.now();
      if (g.food.some((f) => f.kind !== 'widget')) return;
      const r = Math.random();
      if (r < 0.18)
        g.food.push({
          ...free(),
          kind: 'gold',
          icon: 'star',
          pts: 5,
          color: '#F6D38C',
          until: now + 6000,
        });
      else if (r < 0.3)
        g.food.push({
          ...free(),
          kind: 'reload',
          icon: 'bolt',
          pts: 1,
          color: '#8FD19E',
          until: now + 8000,
        });
      else if (r < 0.4)
        g.food.push({
          ...free(),
          kind: 'ghost',
          icon: 'shield',
          pts: 1,
          color: '#B9A6FF',
          until: now + 8000,
        });
      else if (r < 0.58 && g.eaten > 3)
        g.food.push({
          ...free(),
          kind: 'bug',
          icon: 'bug',
          pts: -3,
          color: '#E3311D',
          until: now + 7000,
        });
    };
    addWidget();

    const draw = (now: number) => {
      ctx.fillStyle = '#0E0C10';
      ctx.fillRect(0, 0, W, H);
      // Walls: hazard stripes, so the boundary is obvious.
      const ghost = now < g.ghostUntil;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(PAD, PAD, W - PAD * 2, H - PAD * 2);
      ctx.clip('evenodd');
      ctx.fillStyle = ghost ? '#3a3155' : '#2a1a14';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = ghost ? 'rgba(185,166,255,0.6)' : 'rgba(255,122,61,0.55)';
      ctx.lineWidth = 6;
      for (let x = -H; x < W + H; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + H, H);
        ctx.stroke();
      }
      ctx.restore();
      // Grid.
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 1;
      for (let i = 1; i < COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(PAD + i * CELL, PAD);
        ctx.lineTo(PAD + i * CELL, H - PAD);
        ctx.stroke();
      }
      for (let j = 1; j < ROWS; j++) {
        ctx.beginPath();
        ctx.moveTo(PAD, PAD + j * CELL);
        ctx.lineTo(W - PAD, PAD + j * CELL);
        ctx.stroke();
      }
      for (const f of g.food) {
        const cx = PAD + f.x * CELL + CELL / 2;
        const cy = PAD + f.y * CELL + CELL / 2;
        const fading = f.until - now < 2000 && Math.floor(now / 150) % 2 === 0;
        ctx.globalAlpha = fading ? 0.35 : 1;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.roundRect(cx - CELL / 2 + 3, cy - CELL / 2 + 3, CELL - 6, CELL - 6, 7);
        ctx.fill();
        drawIcon(ctx, f.icon, cx, cy, 16, '#0b0a0c');
        ctx.globalAlpha = 1;
      }
      g.snake.forEach((p, i) => {
        const t = 1 - i / (g.snake.length + 4);
        ctx.fillStyle = g.dead
          ? `rgba(227,49,29,${0.4 + t * 0.6})`
          : ghost
            ? `rgba(185,166,255,${0.45 + t * 0.55})`
            : `rgba(255,122,61,${0.35 + t * 0.65})`;
        ctx.beginPath();
        ctx.roundRect(
          PAD + p.x * CELL + 2,
          PAD + p.y * CELL + 2,
          CELL - 4,
          CELL - 4,
          i === 0 ? 9 : 6,
        );
        ctx.fill();
      });
      const head = g.snake[0];
      ctx.fillStyle = '#0b0a0c';
      const ex = dir.current.y !== 0 ? 5 : 0;
      const ey = dir.current.x !== 0 ? 5 : 0;
      const hx = PAD + head.x * CELL + CELL / 2 + dir.current.x * 4;
      const hy = PAD + head.y * CELL + CELL / 2 + dir.current.y * 4;
      ctx.beginPath();
      ctx.arc(hx - ex, hy - ey, 2.6, 0, Math.PI * 2);
      ctx.arc(hx + ex, hy + ey, 2.6, 0, Math.PI * 2);
      ctx.fill();
      if (now < g.slowUntil) {
        ctx.fillStyle = 'rgba(143,209,158,0.06)';
        ctx.fillRect(0, 0, W, H);
      }
    };

    const step = () => {
      const now = performance.now();
      dir.current = queue.current.shift() ?? dir.current;
      const ghost = now < g.ghostUntil;
      let head = { x: g.snake[0].x + dir.current.x, y: g.snake[0].y + dir.current.y };
      const outside = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
      if (outside && ghost) head = { x: (head.x + COLS) % COLS, y: (head.y + ROWS) % ROWS };
      const self = g.snake.slice(0, -1).some((p) => p.x === head.x && p.y === head.y);
      if ((outside && !ghost) || (self && !ghost)) {
        g.dead = true;
        draw(now);
        window.setTimeout(() => end.current(g.score), 700);
        return;
      }
      g.snake.unshift(head);
      g.food = g.food.filter((f) => f.until > now);
      const ate = g.food.find((f) => f.x === head.x && f.y === head.y);
      let status = '';
      if (ate) {
        g.food = g.food.filter((f) => f !== ate);
        g.score = Math.max(0, g.score + ate.pts);
        if (ate.kind === 'bug') {
          g.snake.splice(-Math.min(2, g.snake.length - 2));
          status = 'Ate a bug: −3, shrank';
        } else {
          g.eaten += 1;
          g.grow += ate.kind === 'gold' ? 3 : 1;
          g.speed = Math.max(MIN_MS, g.speed - 5);
          if (ate.kind === 'reload') {
            g.slowUntil = now + 5000;
            status = 'Hot reload: slow motion';
          } else if (ate.kind === 'ghost') {
            g.ghostUntil = now + 5000;
            status = 'Null safety: walls wrap, no self-crash';
          } else if (ate.kind === 'gold') {
            status = 'Golden widget! +5';
          }
          if (ate.kind === 'widget') {
            g.tree = [...g.tree, ICON_LABEL[ate.icon] ?? 'Widget'].slice(-4);
            addWidget();
          }
          maybeSpecial();
        }
      }
      if (!g.food.some((f) => f.kind === 'widget')) addWidget();
      if (g.grow > 0) g.grow -= 1;
      else g.snake.pop();
      draw(now);
      setHud((h) => ({
        score: g.score,
        length: g.snake.length,
        status:
          status ||
          (now < g.slowUntil
            ? 'Slow motion'
            : now < g.ghostUntil
              ? 'Null safety on'
              : h.status && ate
                ? ''
                : h.status),
        tree: g.tree.join(' › '),
      }));
      g.timer = window.setTimeout(step, now < g.slowUntil ? g.speed * 1.6 : g.speed);
    };
    draw(performance.now());
    const frame = window.setInterval(() => !g.dead && draw(performance.now()), 120);
    g.timer = window.setTimeout(step, 600);
    return () => {
      window.clearTimeout(g.timer);
      window.clearInterval(frame);
    };
  }, [end]);

  return (
    <div className="game snake">
      <div className="game-hud">
        <span>
          Score <b className="mono">{hud.score}</b>
        </span>
        <span>
          Length <b className="mono">{hud.length}</b>
        </span>
        {hud.status && <span className="hot">{hud.status}</span>}
      </div>
      <div ref={setStage} className="game-stage">
        <canvas
          ref={canvas}
          width={W}
          height={H}
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-hidden="true"
        />
      </div>
      <p className="muted game-keys mono">{hud.tree}</p>
    </div>
  );
}

const ICON_LABEL: Partial<Record<IconId, string>> = {
  text: 'Text',
  button: 'ElevatedButton',
  image: 'Image',
  row: 'Row',
  column: 'Column',
  container: 'Container',
  card: 'Card',
  list: 'ListView',
  stack: 'Stack',
};

export const snake: GameDef = {
  id: 'snake',
  name: 'Snake.dart',
  blurb: 'Eat widgets, grow the widget tree.',
  tile: '#111012',
  icon: <GIcon id="column" size={40} color="#FF7A3D" />,
  unit: 'points',
  howTo: [
    'Arrow keys, WASD or swipe. The striped border is the wall: hitting it ends the game.',
    'Eat widgets to grow. Text and Button are 1, Row and Column 2, ListView and Stack 3.',
    'Gold star: +5 and grow 3, gone in six seconds. Bolt (hot reload): slow motion.',
    'Shield (null safety): five seconds where walls wrap and you can cross your tail. Avoid red bugs.',
  ],
  atul: () => 'snake',
  Game: SnakeGame,
};

/** Snake inside the Terminal (`play snake`): one run, then back to the prompt. Q quits early. */
export function Snake({ onQuit }: { onQuit: (score: number) => void }) {
  const quit = useLatest(onQuit);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') quit.current(0);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [quit]);
  return <SnakeGame option="" onEnd={onQuit} />;
}
