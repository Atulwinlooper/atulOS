import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { prefersReducedMotion, rafLoop } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import { useOS } from '../os/store';
import {
  cardAngle,
  createCard,
  dragCard,
  grabCard,
  releaseCard,
  stepCard,
  strapPath,
} from './lanyard';
import './bulb.css';

const W = 40; // lamp width
const H = 52; // socket to the bottom of the glass
const TOTAL = 80; // including the tassel
const PULL = 22; // stretch the cord this far, then let go, to click the switch
const HOLD_MS = 850; // keep it pulled this long to change the wallpaper instead

/**
 * A pendant bulb on its cord, hanging from the menu bar. Pull the bulb down and let go:
 * lights on (light theme) or off. Pull and hold: next wallpaper. It uses the same physics as
 * the ID card, so it stays under your finger and swings back naturally.
 */
export function Bulb({ x, compact = false }: { x: number; compact?: boolean }) {
  const { theme, setTheme, cycleWall, findSecret, toast } = useOS();
  const layer = useRef<HTMLDivElement>(null);
  const lamp = useRef<HTMLButtonElement>(null);
  const cordEl = useRef<SVGPathElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  const cord = compact ? 26 : 58;
  const top = compact ? -24 : 30;
  const sim = useRef<ReturnType<typeof createCard> | null>(null);
  sim.current ??= createCard(x, top, cord, H);
  const pull = useRef({ armed: false, armedAt: 0, cycled: false, moved: 0, lastY: 0 });
  const flicks = useRef<number[]>([]);
  const live = useLatest({ x, top, cord, theme, setTheme, cycleWall, findSecret, toast });

  const say = (text: string, ms = 1600) => {
    setHint(text);
    window.setTimeout(() => setHint((h) => (h === text ? null : h)), ms);
  };
  const sayRef = useLatest(say);

  const toggle = () => {
    const { theme: t, setTheme: set, findSecret: find, toast: note } = live.current;
    const c = sim.current;
    set(t === 'dark' ? 'light' : 'dark', c ? { x: c.b.x, y: c.b.y } : undefined);
    const now = performance.now();
    flicks.current = [...flicks.current.filter((f) => now - f < 4000), now];
    if (flicks.current.length >= 6) {
      flicks.current = [];
      find('flicker');
      note('Easy on the switch', 'Atul pays the electricity bill for this portfolio.');
    }
  };
  const toggleRef = useLatest(toggle);

  useEffect(() => {
    const c = sim.current;
    if (!c) return undefined;
    const reduced = prefersReducedMotion();
    return rafLoop((dt, now) => {
      const { x: ax, top: ay, cord: len } = live.current;
      stepCard(c, ax, ay, len, reduced ? 4 : dt, 100_000);
      const stretch = Math.hypot(c.a.x - ax, c.a.y - ay) - len;
      const p = pull.current;
      if (c.grab && !p.armed && stretch > PULL) {
        p.armed = true;
        p.armedAt = now;
        sayRef.current('Let go for the light. Keep holding for the wallpaper.', 3000);
      }
      if (c.grab && p.armed && !p.cycled && now - p.armedAt > HOLD_MS) {
        p.cycled = true;
        const w = live.current.cycleWall();
        sayRef.current(`Wallpaper: ${w[0].toUpperCase()}${w.slice(1)}`);
      }
      if (lamp.current) {
        lamp.current.style.transform = `translate(${(c.a.x - W / 2).toFixed(1)}px, ${c.a.y.toFixed(1)}px) rotate(${cardAngle(c).toFixed(2)}deg)`;
      }
      cordEl.current?.setAttribute('d', strapPath(c, ax, ay, len));
    });
  }, [live, sayRef]);

  const local = (e: PointerEvent) => {
    const r = layer.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };
  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    const c = sim.current;
    if (!c || e.button !== 0) return;
    const p = local(e);
    grabCard(c, p.x, p.y);
    pull.current = { armed: false, armedAt: 0, cycled: false, moved: 0, lastY: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const c = sim.current;
    if (!c?.grab) return;
    const p = local(e);
    pull.current.moved += Math.abs(p.y - pull.current.lastY);
    pull.current.lastY = p.y;
    const { x: ax, top: ay, cord: len } = live.current;
    dragCard(c, p.x, p.y, ax, ay, len);
  };
  const onUp = () => {
    const c = sim.current;
    if (!c?.grab) return;
    const { x: ax, top: ay, cord: len } = live.current;
    releaseCard(c, ax, ay, len);
    const p = pull.current;
    if (p.armed && !p.cycled) toggleRef.current();
    if (p.armed) setHint(null);
  };
  const onClick = (e: React.MouseEvent) => {
    // A tap, or Enter/Space on the keyboard, is a short pull.
    const p = pull.current;
    if (e.detail === 0 || (p.moved < 6 && !p.armed)) {
      const c = sim.current;
      if (c) c.pb.y -= 6; // a little tug, so it swings
      toggleRef.current();
    }
    p.moved = 0;
    p.armed = false;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const w = live.current.cycleWall();
      say(`Wallpaper: ${w}`);
    }
  };

  const on = theme === 'light';
  return (
    <div ref={layer} className={`bulb-layer${compact ? ' compact' : ''}${on ? ' on' : ''}`}>
      <svg className="bulb-cord" width="100%" height="100%" aria-hidden="true">
        <path
          ref={cordEl}
          d={`M${x} ${top}L${x} ${top + cord}`}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="bulb-rose" style={{ left: x - 7, top: top - 3 }} aria-hidden="true" />
      <button
        ref={lamp}
        type="button"
        className="bulb-lamp"
        style={{ width: W, height: TOTAL }}
        aria-label={`Light. It is ${on ? 'on' : 'off'}. Pull it down and let go to switch it ${on ? 'off' : 'on'}. Hold it down, or press Shift+Enter, to change the wallpaper.`}
        aria-pressed={on}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={onUp}
        onClick={onClick}
        onKeyDown={onKey}
      >
        <span className="bulb-glow" aria-hidden="true" />
        <svg viewBox={`0 0 40 ${TOTAL}`} width={W} height={TOTAL} aria-hidden="true">
          <defs>
            <radialGradient id={`bulb-glass-${compact ? 'c' : 'd'}`} cx=".5" cy=".45" r=".6">
              <stop offset="0" stopColor={on ? '#FFF8DC' : '#6d6468'} />
              <stop offset=".7" stopColor={on ? '#FFD98A' : '#453e41'} />
              <stop offset="1" stopColor={on ? '#F4B860' : '#2e292b'} />
            </radialGradient>
          </defs>
          {/* socket, centred under the cord */}
          <rect x="14" y="0" width="12" height="14" rx="3" fill="#6E635B" />
          <rect x="12" y="11" width="16" height="6" rx="2" fill="#8F8680" />
          {/* glass */}
          <path
            d="M14 17h12l3 7a15 15 0 1 1-18 0z"
            fill={`url(#bulb-glass-${compact ? 'c' : 'd'})`}
            stroke={on ? '#F4B860' : '#9a8f88'}
            strokeWidth="1.2"
          />
          {/* A glint on the glass, so the unlit bulb still reads against a dark wallpaper. */}
          {!on && (
            <path
              d="M13.5 30a8 8 0 0 1 4-6"
              fill="none"
              stroke="rgba(255,255,255,.55)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
          <path
            d="M17 25l3 10 3-10"
            fill="none"
            stroke={on ? '#C9572A' : '#a39890'}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* a short tassel at the bottom centre: the bit you pull */}
          <path d="M20 51v19" stroke="#A59B94" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="20" cy="73" r="4" fill="#D9CFC6" stroke="#8F8680" strokeWidth="1" />
        </svg>
      </button>
      {hint && (
        <output className="bulb-hint" style={{ left: x + 28, top: top + cord + 30 }}>
          {hint}
        </output>
      )}
    </div>
  );
}
