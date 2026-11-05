import { useEffect, useRef, useState } from 'react';
import { rafLoop } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import { drawIcon, pick, setupCanvas, useControls, type IconId } from './kit';
import { GIcon, type GameDef, type GameProps } from './Shell';

const W = 720;
const H = 260;
const GROUND = 214;
const PX = 100;
const PW = 28;
const PH = 36;
const STAGES = ['LINT', 'TEST', 'BUILD', 'SIGN', 'UPLOAD', 'REVIEW', 'RELEASE'];

type Thing = {
  kind: 'test' | 'drone' | 'star' | 'shield' | 'jet' | 'slow';
  x: number;
  y: number;
  w: number;
  h: number;
  phase: number;
  hit?: boolean;
};
const POWERS: Record<'shield' | 'jet' | 'slow', { icon: IconId; color: string; name: string }> = {
  shield: { icon: 'shield', color: '#7FB7C9', name: 'Code review: one free hit' },
  jet: { icon: 'rocket', color: '#F6D38C', name: 'CI jetpack: double jump' },
  slow: { icon: 'snow', color: '#B9A6FF', name: 'Feature freeze: slow motion' },
};

function ShipItGame({ onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [hud, setHud] = useState({ score: 0, stars: 0, power: '' });
  const [banner, setBanner] = useState<string | null>(null);
  const end = useLatest(onEnd);
  const input = useRef({ jump: false, jumpPressed: false, duck: false });

  useControls(stage, {
    dir: (d, down) => {
      if (d === 'up') {
        input.current.jump = down;
        if (down) input.current.jumpPressed = true;
      }
      if (d === 'down') input.current.duck = down;
    },
    action: (down) => {
      input.current.jump = down;
      if (down) input.current.jumpPressed = true;
    },
  });

  useEffect(() => {
    const ctx = setupCanvas(canvas.current, W, H);
    if (!ctx) return undefined;
    const r = {
      y: GROUND - PH,
      vy: 0,
      jumps: 0,
      speed: 4.2,
      dist: 0,
      stars: 0,
      things: [] as Thing[],
      nextGap: 260,
      shield: false,
      jetUntil: 0,
      slowUntil: 0,
      frame: 0,
      over: false,
      flash: 0,
    };

    const spawn = () => {
      const t = r.frame / 60; // seconds survived
      const roll = Math.random();
      if (roll < 0.08) {
        const kind = pick(['shield', 'jet', 'slow'] as const);
        r.things.push({ kind, x: W + 20, y: GROUND - 90, w: 26, h: 26, phase: 0 });
      } else if (roll < 0.25) {
        // A small arc of stars.
        for (let i = 0; i < 4; i++) {
          r.things.push({
            kind: 'star',
            x: W + 20 + i * 30,
            y: GROUND - 70 - Math.sin((i / 3) * Math.PI) * 40,
            w: 18,
            h: 18,
            phase: 0,
          });
        }
      } else if (t > 12 && roll < 0.25 + Math.min(0.35, (t - 12) / 80)) {
        // Air obstacle: duck under it, or jump clean over.
        const high = Math.random() < 0.5;
        r.things.push({
          kind: 'drone',
          x: W + 20,
          y: high ? GROUND - 62 : GROUND - 80,
          w: 40,
          h: 20,
          phase: Math.random() * 6,
        });
      } else {
        const h = 22 + Math.random() * (18 + Math.min(14, t / 4));
        r.things.push({
          kind: 'test',
          x: W + 20,
          y: GROUND - h,
          w: 18 + Math.random() * 16,
          h,
          phase: 0,
        });
      }
      const minGap = Math.max(170, 300 - t * 2);
      r.nextGap = minGap + Math.random() * 220;
    };

    const draw = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1C1620');
      g.addColorStop(1, '#120F12');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Far parallax: a row of server racks.
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      for (let i = 0; i < 12; i++) {
        const x = ((((i * 90 - r.dist * 0.2) % (W + 90)) + W + 90) % (W + 90)) - 45;
        ctx.fillRect(x, GROUND - 80 - (i % 3) * 18, 50, 80 + (i % 3) * 18);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();
      ctx.font = '600 11px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      for (let i = 0; i < 8; i++) {
        const x = ((((i * 160 - r.dist * 0.6) % (W + 160)) + W + 160) % (W + 160)) - 80;
        ctx.fillText(STAGES[(i + Math.floor(r.dist / 900)) % STAGES.length], x, GROUND + 26);
      }
      for (const o of r.things) {
        if (o.hit) continue;
        if (o.kind === 'test') {
          ctx.fillStyle = '#E3311D';
          ctx.beginPath();
          ctx.roundRect(o.x, o.y, o.w, o.h, 4);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          const cx = o.x + o.w / 2;
          const cy = o.y + 10;
          ctx.beginPath();
          ctx.moveTo(cx - 4, cy - 4);
          ctx.lineTo(cx + 4, cy + 4);
          ctx.moveTo(cx + 4, cy - 4);
          ctx.lineTo(cx - 4, cy + 4);
          ctx.stroke();
        } else if (o.kind === 'drone') {
          const bob = Math.sin(r.frame / 8 + o.phase) * 3;
          ctx.fillStyle = '#9B6BFF';
          ctx.beginPath();
          ctx.roundRect(o.x, o.y + bob, o.w, o.h, 8);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(o.x + 4 + ((r.frame * 3) % 30), o.y + bob - 3, 10, 2);
          drawIcon(ctx, 'bug', o.x + o.w / 2, o.y + o.h / 2 + bob, 16, '#fff');
        } else if (o.kind === 'star') {
          drawIcon(ctx, 'star', o.x + o.w / 2, o.y + o.h / 2, 18, '#F6D38C');
        } else {
          const p = POWERS[o.kind];
          const pulse = 1 + Math.sin(r.frame / 6) * 0.08;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(o.x + 13, o.y + 13, 15 * pulse, 0, Math.PI * 2);
          ctx.fill();
          drawIcon(ctx, p.icon, o.x + 13, o.y + 13, 18, '#0b0a0c');
        }
      }
      // The build.
      const ducking = input.current.duck && r.y >= GROUND - PH - 0.5;
      const h = ducking ? PH * 0.55 : PH;
      const y = ducking ? GROUND - h : r.y;
      ctx.save();
      ctx.translate(PX, y);
      if (r.flash > 0 && Math.floor(r.flash / 4) % 2) ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#FF7A3D';
      ctx.beginPath();
      ctx.moveTo(PW / 2, 0);
      ctx.quadraticCurveTo(PW + 2, h * 0.35, PW - 2, h);
      ctx.lineTo(2, h);
      ctx.quadraticCurveTo(-2, h * 0.35, PW / 2, 0);
      ctx.fill();
      ctx.fillStyle = '#160C07';
      ctx.beginPath();
      ctx.arc(PW / 2, h * 0.42, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(246,211,140,0.85)';
      ctx.beginPath();
      ctx.moveTo(8, h);
      ctx.lineTo(PW / 2, h + 8 + Math.random() * 8);
      ctx.lineTo(PW - 8, h);
      ctx.fill();
      if (r.shield) {
        ctx.strokeStyle = 'rgba(127,183,201,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(PW / 2, h / 2, 26, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      if (r.slowUntil > r.frame) {
        ctx.fillStyle = 'rgba(185,166,255,0.06)';
        ctx.fillRect(0, 0, W, H);
      }
    };

    return rafLoop((dt) => {
      if (r.over) return;
      r.frame += dt;
      const slow = r.frame < r.slowUntil ? 0.55 : 1;
      const v = r.speed * slow * dt;
      const inp = input.current;
      const onGround = r.y >= GROUND - PH - 0.5;
      if (onGround) r.jumps = 0;
      if (inp.jumpPressed) {
        inp.jumpPressed = false;
        const max = r.frame < r.jetUntil ? 2 : 1;
        if (onGround || r.jumps < max) {
          r.vy = r.jumps > 0 ? -10 : -11.8;
          r.jumps += 1;
        }
      }
      // Variable jump: let go early for a short hop. Fast-fall when ducking in the air.
      const gravity = !inp.jump && r.vy < 0 ? 1.25 : inp.duck ? 1.6 : 0.62;
      r.vy += gravity * dt;
      r.y = Math.min(GROUND - PH, r.y + r.vy * dt);
      if (r.y >= GROUND - PH) r.vy = 0;

      r.dist += v;
      r.speed = Math.min(11, r.speed + 0.0011 * dt);
      r.nextGap -= v;
      if (r.nextGap <= 0) spawn();
      if (r.flash > 0) r.flash -= dt;

      const ducking = inp.duck && r.y >= GROUND - PH - 0.5;
      const ph = ducking ? PH * 0.55 : PH;
      const py = ducking ? GROUND - ph : r.y;
      for (const o of r.things) {
        o.x -= v;
        if (o.hit) continue;
        const bob = o.kind === 'drone' ? Math.sin(r.frame / 8 + o.phase) * 3 : 0;
        const overlap =
          o.x < PX + PW - 4 &&
          o.x + o.w > PX + 4 &&
          o.y + bob < py + ph - 3 &&
          o.y + bob + o.h > py + 4;
        if (!overlap) continue;
        if (o.kind === 'star') {
          o.hit = true;
          r.stars += 1;
        } else if (o.kind === 'test' || o.kind === 'drone') {
          if (r.shield || r.flash > 0) {
            if (r.flash <= 0) {
              r.shield = false;
              r.flash = 60;
            }
            o.hit = true;
          } else {
            r.over = true;
          }
        } else {
          o.hit = true;
          if (o.kind === 'shield') r.shield = true;
          if (o.kind === 'jet') r.jetUntil = r.frame + 600;
          if (o.kind === 'slow') r.slowUntil = r.frame + 300;
          const name = POWERS[o.kind].name;
          setBanner(name);
          window.setTimeout(() => setBanner((x) => (x === name ? null : x)), 1600);
        }
      }
      r.things = r.things.filter((o) => o.x > -60);
      draw();
      const score = Math.floor(r.dist / 10) + r.stars * 50;
      if (Math.floor(r.frame) % 6 === 0) {
        setHud({
          score,
          stars: r.stars,
          power:
            r.frame < r.jetUntil
              ? 'Double jump'
              : r.frame < r.slowUntil
                ? 'Slow motion'
                : r.shield
                  ? 'Shield up'
                  : '',
        });
      }
      if (r.over) window.setTimeout(() => end.current(score), 500);
    });
  }, [end]);

  return (
    <div className="game ship">
      <div className="game-hud">
        <span>
          Score <b className="mono">{hud.score.toLocaleString()}</b>
        </span>
        <span>
          Stars <b className="mono">{hud.stars}</b>
        </span>
        {hud.power && <span className="hot">{hud.power}</span>}
      </div>
      <div ref={setStage} className="game-stage">
        {banner && <output className="gbanner">{banner}</output>}
        <canvas
          ref={canvas}
          width={W}
          height={H}
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-hidden="true"
        />
      </div>
      <p className="muted game-keys">
        Jump: Space, ↑ or tap (hold for higher). Duck: ↓ or swipe down. Drones fly at head height.
      </p>
    </div>
  );
}

export const shipIt: GameDef = {
  id: 'shipIt',
  name: 'Ship It',
  blurb: 'Run the build through the pipeline to the store.',
  tile: '#FF7A3D',
  icon: <GIcon id="rocket" size={40} color="#0b0a0c" />,
  unit: 'points',
  howTo: [
    'Jump red failing tests. Hold jump to go higher, tap for a short hop.',
    'After a while, flaky-test drones fly at head height: duck under them or clear them.',
    'Stars are 50 points. Code review shields one hit, CI jetpack gives a double jump, Feature freeze slows time.',
    'It starts gentle and speeds up the longer you survive.',
  ],
  atul: () => 'shipIt',
  Game: ShipItGame,
};
