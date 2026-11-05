import { prefersReducedMotion } from '../lib/dom';

const COLORS = ['#FF7A3D', '#FF9A63', '#F6D38C', '#7FB7C9', '#F3EEE8', '#D9798E'];

/** Fires a burst of confetti over the whole screen, then cleans up after itself. */
export function confetti(originX = window.innerWidth / 2, originY = window.innerHeight / 3) {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '10000',
  });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: 160 }, () => {
    const a = Math.random() * Math.PI * 2;
    const s = 4 + Math.random() * 9;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 6,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    };
  });
  const start = performance.now();
  const step = (t: number) => {
    const age = (t - start) / 1000;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.25;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - 1.8));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (age < 2.8) requestAnimationFrame(step);
    else canvas.remove();
  };
  requestAnimationFrame(step);
}
