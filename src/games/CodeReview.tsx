import { useEffect, useRef, useState } from 'react';
import { rafLoop } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import { drawIcon, pick, setupCanvas, useControls, type IconId } from './kit';
import { GIcon, type GameDef, type GameProps } from './Shell';

const W = 720;
const H = 460;
const PY = H - 34;
const R = 7;
const COLS = 10;
const BW = 64;
const BH = 20;
const GAP = 6;
const LEFT = (W - (COLS * BW + (COLS - 1) * GAP)) / 2;
const SNIPPETS = [
  'if',
  'null',
  'await',
  'map()',
  'try',
  '!==',
  'setState',
  'any',
  'TODO',
  'useEffect',
  'var',
  '?.',
  'catch',
  '=>',
];

type Brick = { x: number; y: number; hp: number; max: number; label: string; drop?: Power };
type Power = 'wide' | 'multi' | 'slow' | 'life';
type Ball = { x: number; y: number; vx: number; vy: number; stuck: boolean };
const POWERS: Record<Power, { icon: IconId; color: string; name: string }> = {
  wide: { icon: 'row', color: '#7FB7C9', name: 'Pair programming: wide paddle' },
  multi: { icon: 'git', color: '#F6D38C', name: 'Parallel CI: three balls' },
  slow: { icon: 'snow', color: '#B9A6FF', name: 'Code freeze: slow ball' },
  life: { icon: 'heart', color: '#E3311D', name: 'Extra life' },
};

function layout(level: number): Brick[] {
  const rows = Math.min(7, 4 + level);
  const bricks: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      // Level 2+ leaves some gaps and adds tougher two-hit bugs.
      if (level > 1 && Math.random() < 0.1) continue;
      const tough = Math.random() < 0.08 + level * 0.06;
      const hp = tough ? 2 : 1;
      bricks.push({
        x: LEFT + c * (BW + GAP),
        y: 54 + r * (BH + GAP),
        hp,
        max: hp,
        label: pick(SNIPPETS),
        drop: Math.random() < 0.12 ? pick(['wide', 'multi', 'slow', 'life'] as const) : undefined,
      });
    }
  }
  return bricks;
}

function CodeReviewGame({ onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, banner: '' });
  const end = useLatest(onEnd);
  const input = useRef({
    left: false,
    right: false,
    launch: false,
    pointerX: null as number | null,
  });

  useControls(stage, {
    dir: (d, down) => {
      if (d === 'left') input.current.left = down;
      if (d === 'right') input.current.right = down;
      if (d === 'up' && down) input.current.launch = true;
    },
    action: (down) => {
      if (down) input.current.launch = true;
    },
  });

  useEffect(() => {
    const el = canvas.current;
    const ctx = setupCanvas(el, W, H);
    if (!el || !ctx) return undefined;
    const toX = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      input.current.pointerX = ((e.clientX - r.left) / r.width) * W;
    };
    const click = (e: MouseEvent) => {
      if (e.detail > 0) input.current.launch = true;
    };
    el.addEventListener('pointermove', toX);
    el.addEventListener('pointerdown', toX);
    el.addEventListener('click', click);

    const g = {
      px: W / 2,
      pw: 110,
      wideUntil: 0,
      slowUntil: 0,
      balls: [{ x: W / 2, y: PY - R - 2, vx: 0, vy: 0, stuck: true }] as Ball[],
      bricks: layout(1),
      drops: [] as { x: number; y: number; p: Power }[],
      score: 0,
      lives: 3,
      level: 1,
      frame: 0,
      over: false,
      banner: '',
      bannerUntil: 0,
    };
    const speed = () => (5 + g.level * 0.6) * (g.frame < g.slowUntil ? 0.6 : 1);
    const say = (t: string) => {
      g.banner = t;
      g.bannerUntil = g.frame + 100;
    };
    const resetBall = () => {
      g.balls = [{ x: g.px, y: PY - R - 2, vx: 0, vy: 0, stuck: true }];
    };

    const draw = () => {
      ctx.fillStyle = '#100E12';
      ctx.fillRect(0, 0, W, H);
      // Gutter line numbers, for the code-editor look.
      ctx.font = '10px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 18; i++) ctx.fillText(String(i + 1).padStart(2, ' '), 8, 30 + i * 24);
      for (const b of g.bricks) {
        const tough = b.max > 1;
        ctx.fillStyle = tough ? (b.hp > 1 ? '#9B6BFF' : '#6d4bc0') : b.drop ? '#FF9A63' : '#2e2a33';
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, BW, BH, 5);
        ctx.fill();
        ctx.fillStyle = tough || b.drop ? '#0b0a0c' : 'rgba(255,255,255,0.75)';
        ctx.font = '600 10px IBM Plex Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tough ? 'BUG' : b.label, b.x + BW / 2, b.y + 14);
        ctx.textAlign = 'left';
      }
      for (const d of g.drops) {
        const p = POWERS[d.p];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 13, 0, Math.PI * 2);
        ctx.fill();
        drawIcon(ctx, p.icon, d.x, d.y, 16, '#0b0a0c');
      }
      // Paddle: a text cursor bar.
      ctx.fillStyle = g.frame < g.wideUntil ? '#7FB7C9' : '#FF7A3D';
      ctx.beginPath();
      ctx.roundRect(g.px - g.pw / 2, PY, g.pw, 10, 5);
      ctx.fill();
      for (const b of g.balls) {
        ctx.fillStyle = '#FBF7F2';
        ctx.beginPath();
        ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
        ctx.fill();
      }
      if (g.balls.some((b) => b.stuck)) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '13px Onest Variable, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click, tap or press Space to launch', W / 2, PY - 40);
        ctx.textAlign = 'left';
      }
    };

    const stop = rafLoop((dt) => {
      if (g.over) return;
      g.frame += dt;
      const inp = input.current;
      const target = g.frame < g.wideUntil ? 170 : 110;
      g.pw += (target - g.pw) * 0.2;
      if (inp.left) g.px -= 9 * dt;
      if (inp.right) g.px += 9 * dt;
      if (inp.pointerX !== null && !inp.left && !inp.right) g.px += (inp.pointerX - g.px) * 0.35;
      g.px = Math.max(g.pw / 2, Math.min(W - g.pw / 2, g.px));

      for (const b of g.balls) {
        if (b.stuck) {
          b.x = g.px;
          b.y = PY - R - 2;
          if (inp.launch) {
            b.stuck = false;
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
            b.vx = Math.cos(a);
            b.vy = Math.sin(a);
          }
          continue;
        }
        const sp = speed() * dt;
        // Sub-steps so a fast ball never tunnels through a brick.
        const steps = Math.ceil(sp / 4);
        for (let s = 0; s < steps; s++) {
          b.x += (b.vx * sp) / steps;
          b.y += (b.vy * sp) / steps;
          if (b.x < R || b.x > W - R) {
            b.vx = -b.vx;
            b.x = Math.max(R, Math.min(W - R, b.x));
          }
          if (b.y < R) {
            b.vy = Math.abs(b.vy);
          }
          if (
            b.vy > 0 &&
            b.y + R >= PY &&
            b.y + R <= PY + 12 &&
            Math.abs(b.x - g.px) <= g.pw / 2 + R
          ) {
            // Where it hits the paddle sets the angle, so you can aim.
            const off = (b.x - g.px) / (g.pw / 2);
            const a = -Math.PI / 2 + off * 1.05;
            b.vx = Math.cos(a);
            b.vy = Math.sin(a);
          }
          const hit = g.bricks.find(
            (k) => b.x + R > k.x && b.x - R < k.x + BW && b.y + R > k.y && b.y - R < k.y + BH,
          );
          if (hit) {
            const overlapX = Math.min(b.x + R - hit.x, hit.x + BW - (b.x - R));
            const overlapY = Math.min(b.y + R - hit.y, hit.y + BH - (b.y - R));
            if (overlapX < overlapY) b.vx = -b.vx;
            else b.vy = -b.vy;
            hit.hp -= 1;
            if (hit.hp <= 0) {
              g.bricks = g.bricks.filter((k) => k !== hit);
              g.score += (hit.max > 1 ? 25 : 10) * g.level;
              if (hit.drop) g.drops.push({ x: hit.x + BW / 2, y: hit.y + BH, p: hit.drop });
            }
            break;
          }
        }
      }
      inp.launch = false;
      g.balls = g.balls.filter((b) => b.y < H + 20);
      if (!g.balls.length) {
        g.lives -= 1;
        if (g.lives <= 0) {
          g.over = true;
          window.setTimeout(() => end.current(g.score), 500);
        } else {
          say('Ball lost. Click to relaunch.');
          resetBall();
        }
      }
      for (const d of g.drops) d.y += 2.4 * dt;
      const caught = g.drops.filter(
        (d) => d.y >= PY - 6 && d.y <= PY + 16 && Math.abs(d.x - g.px) <= g.pw / 2 + 12,
      );
      for (const d of caught) {
        say(POWERS[d.p].name);
        if (d.p === 'wide') g.wideUntil = g.frame + 720;
        if (d.p === 'slow') g.slowUntil = g.frame + 480;
        if (d.p === 'life') g.lives = Math.min(5, g.lives + 1);
        if (d.p === 'multi') {
          const src = g.balls.find((b) => !b.stuck) ?? g.balls[0];
          if (src) {
            for (const a of [-0.5, 0.5]) {
              const ang = Math.atan2(src.vy || -1, src.vx) + a;
              g.balls.push({
                x: src.x,
                y: src.y,
                vx: Math.cos(ang),
                vy: Math.sin(ang),
                stuck: false,
              });
            }
          }
        }
      }
      g.drops = g.drops.filter((d) => !caught.includes(d) && d.y < H + 20);
      if (!g.bricks.length) {
        g.level += 1;
        g.bricks = layout(g.level);
        g.drops = [];
        say(`Level ${g.level}. Review approved.`);
        resetBall();
      }
      draw();
      if (Math.floor(g.frame) % 5 === 0) {
        setHud({
          score: g.score,
          lives: g.lives,
          level: g.level,
          banner: g.frame < g.bannerUntil ? g.banner : '',
        });
      }
    });
    return () => {
      stop();
      el.removeEventListener('pointermove', toX);
      el.removeEventListener('pointerdown', toX);
      el.removeEventListener('click', click);
    };
  }, [end]);

  return (
    <div className="game review">
      <div className="game-hud">
        <span>
          Score <b className="mono">{hud.score.toLocaleString()}</b>
        </span>
        <span>
          Level <b className="mono">{hud.level}</b>
        </span>
        <span className="lives" aria-label={`${hud.lives} lives`}>
          {Array.from({ length: hud.lives }, (_, i) => (
            <span key={i} className="on">
              <GIcon id="heart" size={16} />
            </span>
          ))}
        </span>
        {hud.banner && <span className="hot">{hud.banner}</span>}
      </div>
      <div ref={setStage} className="game-stage">
        <canvas
          ref={canvas}
          width={W}
          height={H}
          style={{ aspectRatio: `${W} / ${H}`, cursor: 'none' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export const codeReview: GameDef = {
  id: 'review',
  name: 'Code Review',
  blurb: 'Bounce the cursor through a pull request. Leave no bug behind.',
  tile: '#2e2a33',
  icon: <GIcon id="text" size={40} color="#FF7A3D" />,
  unit: 'points',
  howTo: [
    'Move with the mouse, a finger or ← →. Click, tap or Space to launch.',
    'Where the ball hits the paddle sets its angle, so you can aim.',
    'Purple BUG lines take two hits. Orange lines drop power-ups when cleared.',
    'Power-ups: pair programming (wide paddle), parallel CI (three balls), code freeze (slow ball), extra life.',
  ],
  atul: () => 'review',
  Game: CodeReviewGame,
};
