import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { closest, prefersReducedMotion, rafLoop } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import { useOS } from '../os/store';
import { createSpinDetector } from './spin';
import { lidsFor, NAP, napStage, type Mode } from './mood';
import './character.css';

const POKES = [
  'Hey!',
  'That tickles.',
  "I'm shipping a release here.",
  'One more and I file a bug report.',
];
/** He is fully asleep after this long without input. */
export const IDLE_MS = NAP.sleep;

const COMEBACK = [
  "You're back! I kept your seat warm.",
  'Oh hey. Checking other portfolios? I won’t tell.',
  'Welcome back. I shipped two features while you were gone. Kidding. Mostly.',
];
const EXIT_LINES = [
  'Leaving already? At least take my résumé.',
  "Wait! You haven't seen the Arcade yet.",
  'Before you go: there is a vault somewhere on this machine…',
];
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

type Props = { size: number; asleep?: boolean; interactive?: boolean };

/** Geometry of each eye in the SVG's viewBox. */
const EYES = [
  { cx: 160, cy: 206 },
  { cx: 242, cy: 204 },
] as const;
const RX = 25;
const RY = 29;
const LID = '#E2A582';

/** Upper and lower eyelid paths for openness `lid` (0 = wide open, 1 = shut). */
function lidPaths(cx: number, cy: number, lid: number) {
  const l = cx - RX - 3;
  const r = cx + RX + 3;
  const shut = cy + 5;
  const upper = cy - RY - 3 + (shut - (cy - RY - 3)) * lid;
  // The lower lid only rises at the very end, as real lower lids do.
  const lo = Math.max(0, (lid - 0.6) / 0.4);
  const lower = cy + RY + 3 - (cy + RY + 3 - shut) * lo;
  const bulge = 4 + 8 * lid;
  return {
    top: `M${l} ${cy - RY - 6}H${r}V${upper.toFixed(1)}Q${cx} ${(upper + bulge).toFixed(1)} ${l} ${upper.toFixed(1)}Z`,
    lash: `M${l + 2} ${upper.toFixed(1)}Q${cx} ${(upper + bulge).toFixed(1)} ${r - 2} ${upper.toFixed(1)}`,
    bottom: `M${l} ${cy + RY + 6}H${r}V${lower.toFixed(1)}Q${cx} ${(lower + 3).toFixed(1)} ${l} ${lower.toFixed(1)}Z`,
  };
}

/**
 * Illustrated Atul. His eyes and head follow the pointer (or the last touch).
 *
 * Moods: leave him alone and he yawns, gets heavy-eyed, nods off once, then slowly falls
 * asleep and breathes. Circle him fast and he gets dizzy. Poke him five times. Tug his hoodie
 * strings (both, or one three times) and his hood goes up. Rub his hair for a head pat.
 */
export function Character({ size, asleep = false, interactive = true }: Props) {
  const { findSecret } = useOS();
  const root = useRef<HTMLElement | null>(null);
  const head = useRef<SVGGElement>(null);
  const torso = useRef<SVGGElement>(null);
  const irises = useRef<(SVGGElement | null)[]>([]);
  const lids = useRef<
    { top: SVGPathElement | null; lash: SVGPathElement | null; bottom: SVGPathElement | null }[]
  >([
    { top: null, lash: null, bottom: null },
    { top: null, lash: null, bottom: null },
  ]);
  const [ownMode, setMode] = useState<Mode>('idle');
  const [bubble, setBubble] = useState<string | null>(null);
  const [hood, setHood] = useState(false);
  const [tug, setTug] = useState<{ side: 'l' | 'r'; n: number } | null>(null);
  const mode: Mode = asleep ? 'sleep' : ownMode;
  const live = useLatest({ mode, findSecret });
  const target = useRef({ x: 0, y: 0, has: false });
  const pokes = useRef<number[]>([]);
  const tugs = useRef<{ side: 'l' | 'r'; t: number }[]>([]);
  const pat = useRef({ down: false, lastX: 0, dir: 0, turns: [] as number[], moved: 0 });
  const lastInput = useRef(0);
  const modeSince = useRef(0);
  const blinkAt = useRef(0);
  const bubbleTimer = useRef(0);

  const say = (text: string, ms = 2600) => {
    setBubble(text);
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
  };
  const sayRef = useLatest(say);

  const enter = (m: Mode) => {
    modeSince.current = performance.now();
    setMode(m);
  };
  const enterRef = useLatest(enter);

  // Pointer tracking, dizzy detection, and the slow slide from awake to asleep.
  useEffect(() => {
    if (!interactive) return undefined;
    lastInput.current = performance.now();
    const spin = createSpinDetector();
    const center = () => {
      const r = root.current?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.42 } : { x: 0, y: 0 };
    };
    const wake = () => {
      lastInput.current = performance.now();
      const m = live.current.mode;
      if (m === 'sleep') {
        enterRef.current('waking');
        sayRef.current('Mmh… five more minutes. Kidding. I was compiling.', 2800);
        window.setTimeout(() => setMode((x) => (x === 'waking' ? 'idle' : x)), 1600);
      } else if (m === 'drowsy' || m === 'dozing') {
        enterRef.current('idle');
        sayRef.current("Huh? I'm up. I'm up.", 1800);
      } else if (m === 'yawn') {
        enterRef.current('idle');
      }
    };
    const onPointer = (e: globalThis.PointerEvent) => {
      wake();
      target.current = { x: e.clientX, y: e.clientY, has: true };
      const c = center();
      if (
        live.current.mode !== 'dizzy' &&
        spin(e.clientX, e.clientY, c.x, c.y, performance.now())
      ) {
        enterRef.current('dizzy');
        sayRef.current("Okay, okay. Stop circling. I'm dizzy.", 3200);
        live.current.findSecret('dizzy');
        window.setTimeout(() => setMode((m) => (m === 'dizzy' ? 'idle' : m)), 3400);
      }
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('keydown', wake);

    // Easter eggs: leave the tab and come back, or head for the tabs / close button.
    const away = { since: 0, exitAt: Number.NEGATIVE_INFINITY };
    const onVisibility = () => {
      if (document.hidden) {
        away.since = performance.now();
        return;
      }
      const gone = performance.now() - away.since;
      if (away.since && gone > 1500) {
        lastInput.current = performance.now();
        enterRef.current('happy');
        sayRef.current(pick(COMEBACK), 3200);
        live.current.findSecret('comeback');
        window.setTimeout(() => setMode((m) => (m === 'happy' ? 'idle' : m)), 2200);
      }
      away.since = 0;
    };
    const onLeave = (e: MouseEvent) => {
      // The pointer left through the top edge: towards the tab bar or the close button.
      if (e.relatedTarget || e.clientY > 0) return;
      const now = performance.now();
      if (now - away.exitAt < 15_000) return;
      away.exitAt = now;
      target.current = { x: e.clientX, y: -400, has: true }; // he looks up at where you went
      sayRef.current(pick(EXIT_LINES), 3400);
      live.current.findSecret('exit');
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.documentElement.addEventListener('mouseout', onLeave);
    const tick = window.setInterval(() => {
      const m = live.current.mode;
      const next = napStage(m, performance.now() - lastInput.current);
      if (next === m) return;
      enterRef.current(next);
      if (next === 'yawn') sayRef.current('*yaaawn*', 2000);
      if (next === 'sleep') live.current.findSecret('nap');
    }, 250);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', wake);
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.removeEventListener('mouseout', onLeave);
      window.clearInterval(tick);
      window.clearTimeout(bubbleTimer.current);
    };
  }, [interactive, live, sayRef, enterRef]);

  // Every frame: ease head, eyes and eyelids toward where the mood and pointer want them.
  useEffect(() => {
    const cur = { ix: 0, iy: 0, hr: 0, hx: 0, hy: 0, lid: live.current.mode === 'sleep' ? 1 : 0 };
    const reduced = prefersReducedMotion();
    const ease = reduced ? 1 : 0.12;
    blinkAt.current = performance.now() + 2500;
    return rafLoop((_dt, now) => {
      const m = live.current.mode;
      const r = root.current?.getBoundingClientRect();
      const looking = m === 'idle' || m === 'poked' || m === 'dizzy' || m === 'happy';
      let tx = 0;
      let ty = 0;
      if (r && target.current.has && looking) {
        const dx = target.current.x - (r.left + r.width / 2);
        const dy = target.current.y - (r.top + r.height * 0.42);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 260);
        tx = (dx / d) * k;
        ty = (dy / d) * k;
      }
      // Random blinks while awake; slow, heavy ones when drowsy.
      if (now > blinkAt.current) {
        blinkAt.current =
          now + (m === 'drowsy' ? 1600 + Math.random() * 1400 : 2400 + Math.random() * 3600);
      }
      const blinking = now > blinkAt.current - (m === 'drowsy' ? 420 : 140);
      const pose = lidsFor(m, now - modeSince.current, blinking, now);
      cur.lid += (pose.lid - cur.lid) * (reduced ? 1 : pose.speed);
      cur.ix += (tx * 9 - cur.ix) * ease;
      cur.iy += (ty * 8 + pose.gazeY - cur.iy) * ease;
      cur.hr += (tx * 7 + pose.tilt - cur.hr) * ease * 0.6;
      cur.hx += (tx * 8 - cur.hx) * ease * 0.6;
      cur.hy += (ty * 5 + pose.nod - cur.hy) * ease * 0.6;

      const iris = `translate(${cur.ix.toFixed(2)} ${cur.iy.toFixed(2)})`;
      for (const el of irises.current) el?.setAttribute('transform', iris);
      EYES.forEach((e, i) => {
        const p = lidPaths(e.cx, e.cy, Math.min(1, Math.max(0, cur.lid)));
        const L = lids.current[i];
        L.top?.setAttribute('d', p.top);
        L.lash?.setAttribute('d', p.lash);
        L.bottom?.setAttribute('d', p.bottom);
      });
      head.current?.setAttribute(
        'transform',
        `rotate(${cur.hr.toFixed(2)} 200 300) translate(${cur.hx.toFixed(2)} ${cur.hy.toFixed(2)})`,
      );
      // Breathing: slow and deep asleep, barely there awake.
      const deep = m === 'sleep' || m === 'dozing';
      const breath = reduced ? 0 : Math.sin(now / (deep ? 900 : 1400)) * (deep ? 3 : 1);
      torso.current?.setAttribute('transform', `translate(0 ${breath.toFixed(2)})`);
    });
  }, [live]);

  const toggleHood = () => {
    setHood((h) => {
      if (!h) {
        say('Hood up. Deep-work mode.', 2400);
        findSecret('hoodie');
      } else {
        say('Okay, hood down. Back to meetings.', 2200);
      }
      return !h;
    });
  };

  const tugString = (side: 'l' | 'r') => {
    const now = performance.now();
    tugs.current = [...tugs.current.filter((t) => now - t.t < 1500), { side, t: now }];
    setTug((t) => ({ side, n: (t?.n ?? 0) + 1 }));
    const sides = new Set(tugs.current.map((t) => t.side));
    const oneSide = tugs.current.filter((t) => t.side === side).length;
    if (sides.size === 2 || oneSide >= 3) {
      tugs.current = [];
      toggleHood();
    } else if (!hood) {
      say(side === 'l' ? 'Careful, that one is load-bearing.' : 'Pull the other one.', 1400);
    }
  };

  const poke = () => {
    if (!interactive || mode === 'sleep') return;
    const now = performance.now();
    lastInput.current = now;
    pokes.current = [...pokes.current.filter((t) => now - t < 4000), now];
    const n = pokes.current.length;
    enter('poked');
    window.setTimeout(() => setMode((m) => (m === 'poked' ? 'idle' : m)), 500);
    if (n >= 5) {
      pokes.current = [];
      say('Fine, you have my attention. Open Projects?', 3400);
      findSecret('poke');
    } else {
      say(POKES[n - 1], 1600);
    }
  };

  /** Where a pointer is, in the SVG's 400×470 viewBox. */
  const toView = (e: PointerEvent) => {
    const r = root.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: ((e.clientX - r.left) / r.width) * 400, y: ((e.clientY - r.top) / r.height) * 470 };
  };
  const onDown = (e: PointerEvent) => {
    const v = toView(e);
    pat.current = { down: v.y < 150, lastX: v.x, dir: 0, turns: [], moved: 0 };
  };
  const onMove = (e: PointerEvent) => {
    const p = pat.current;
    if (!p.down || e.buttons === 0) return;
    const v = toView(e);
    const dx = v.x - p.lastX;
    if (Math.abs(dx) < 4) return;
    p.moved += Math.abs(dx);
    const dir = Math.sign(dx);
    if (p.dir && dir !== p.dir) {
      const now = performance.now();
      p.turns = [...p.turns.filter((t) => now - t < 1600), now];
      if (p.turns.length >= 4 && live.current.mode !== 'happy') {
        p.turns = [];
        enter('happy');
        say('Aw. Thanks. Code review approved.', 2400);
        findSecret('pat');
        window.setTimeout(() => setMode((m) => (m === 'happy' ? 'idle' : m)), 2400);
      }
    }
    p.dir = dir;
    p.lastX = v.x;
  };
  const onClick = (e: React.MouseEvent) => {
    const moved = pat.current.moved;
    pat.current.down = false;
    if (moved > 12) return; // that was a pat, not a poke
    const part = closest(e.target, '[data-part]')?.getAttribute('data-part');
    if (part === 'string-l' || part === 'string-r') {
      tugString(part === 'string-l' ? 'l' : 'r');
      return;
    }
    poke();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      poke();
    } else if (e.key === 'h' || e.key === 'H') {
      toggleHood();
    }
  };

  const dizzy = mode === 'dizzy';
  const asleepish = mode === 'sleep' || mode === 'dozing';
  const stringDrop = hood ? 22 : 0;

  const strings = (
    <>
      {(['l', 'r'] as const).map((side) => {
        const x1 = side === 'l' ? 178 : 222;
        const x2 = side === 'l' ? 172 : 228;
        const y2 = 404 + stringDrop;
        const anim = tug?.side === side ? `tug-${tug.n % 2}` : '';
        return (
          <g key={side} className={`char-string ${anim}`} data-part={`string-${side}`}>
            <path
              d={`M${x1} 342L${x2} ${y2}`}
              stroke="#FF7A3D"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <rect x={x2 - 6} y={y2 - 4} width="12" height="16" rx="3" fill="#E8D5BF" />
            {/* A wider, invisible target so the strings are easy to grab. */}
            <path
              d={`M${x1} 342L${x2} ${y2 + 12}`}
              stroke="transparent"
              strokeWidth="26"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </>
  );

  const body = (
    <>
      {bubble && <output className="char-bubble">{bubble}</output>}
      {mode === 'sleep' && (
        <span className="char-z" aria-hidden="true">
          <span>z</span>
          <span>z</span>
          <span>Z</span>
        </span>
      )}
      <svg viewBox="0 0 400 470" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="ch-sk" cx=".42" cy=".38" r=".75">
            <stop offset="0" stopColor="#F4C7A3" />
            <stop offset=".6" stopColor="#DDA07C" />
            <stop offset="1" stopColor="#B9785A" />
          </radialGradient>
          <linearGradient id="ch-hr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3A322E" />
            <stop offset="1" stopColor="#0F0D0C" />
          </linearGradient>
          <linearGradient id="ch-hd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#36343C" />
            <stop offset="1" stopColor="#141318" />
          </linearGradient>
          <radialGradient id="ch-ir" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#7A4224" />
            <stop offset=".7" stopColor="#2A160C" />
            <stop offset="1" stopColor="#140A06" />
          </radialGradient>
          {EYES.map((e, i) => (
            <clipPath key={e.cx} id={`ch-eye${i}`}>
              <ellipse cx={e.cx} cy={e.cy} rx={RX + 1} ry={RY + 1} />
            </clipPath>
          ))}
        </defs>
        <ellipse cx="200" cy="462" rx="170" ry="9" fill="#000" opacity=".5" />
        <g ref={torso}>
          <rect x="172" y="276" width="56" height="58" rx="16" fill="#B8775A" />
          <path d="M36 470Q44 352 146 322H254Q356 352 364 470Z" fill="url(#ch-hd)" />
          <path
            d="M36 470Q44 352 146 322"
            fill="none"
            stroke="#FF7A3D"
            strokeWidth="3"
            opacity=".7"
          />
          <path d="M132 326Q200 376 268 326Q250 312 200 316Q150 312 132 326Z" fill="#1C1B21" />
          {/* A small chest print. It is a function call, of course. */}
          <text
            x="290"
            y="420"
            fontSize="15"
            fontFamily="IBM Plex Mono, monospace"
            fill="#FF7A3D"
            opacity=".55"
          >
            ship()
          </text>
          {strings}
        </g>
        <g ref={head}>
          {hood && (
            <path
              className="char-hood"
              d="M112 326Q58 252 70 168Q84 50 200 38Q316 50 330 168Q342 252 288 326Z"
              fill="url(#ch-hd)"
            />
          )}
          <ellipse cx="95" cy="200" rx="18" ry="27" fill="#CB8C68" />
          <ellipse cx="305" cy="200" rx="18" ry="27" fill="#CB8C68" />
          <ellipse cx="200" cy="192" rx="106" ry="120" fill="url(#ch-sk)" />
          <path
            d="M96 210Q100 300 180 310"
            stroke="#FF7A3D"
            strokeWidth="3"
            fill="none"
            opacity=".55"
          />
          <path
            d="M90 186Q78 78 176 56Q262 40 304 108Q318 140 308 182Q300 140 270 122Q262 150 226 140Q236 120 222 108Q196 140 150 138Q164 120 160 108Q124 132 106 182Z"
            fill="url(#ch-hr)"
          />
          <path
            d="M150 74Q210 58 262 82"
            stroke="#5A4D45"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            opacity=".7"
          />
          {hood && (
            <g className="char-hood">
              <path
                d="M116 306Q70 196 108 112Q148 50 200 48Q252 50 292 112Q330 196 284 306"
                fill="none"
                stroke="#2A2830"
                strokeWidth="32"
                strokeLinecap="round"
              />
              <path
                d="M132 300Q92 196 124 122Q158 66 200 64Q242 66 276 122Q308 196 268 300"
                fill="none"
                stroke="#FF7A3D"
                strokeWidth="2"
                opacity=".5"
              />
            </g>
          )}
          <path
            className="brows"
            d={
              dizzy
                ? 'M136 160Q160 172 184 160M216 158Q242 170 266 158'
                : mode === 'drowsy' || mode === 'yawn'
                  ? 'M136 168Q160 162 184 168M216 166Q242 160 266 166'
                  : 'M136 166Q160 154 184 162M216 160Q242 150 266 160'
            }
            stroke="#1A1412"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {EYES.map((e, i) => (
            <g key={e.cx}>
              <g clipPath={`url(#ch-eye${i})`}>
                <ellipse cx={e.cx} cy={e.cy} rx={RX} ry={RY} fill="#FBF7F2" />
                {dizzy ? (
                  <g className="spiral" style={{ transformOrigin: `${e.cx}px ${e.cy}px` }}>
                    <path
                      d={`M${e.cx} ${e.cy}m-3 0a3 3 0 1 1 6 0a6 6 0 1 1-12 0a9 9 0 1 1 18 0a12 12 0 1 1-24 0a15 15 0 1 1 30 0`}
                      fill="none"
                      stroke="#1A1412"
                      strokeWidth="3"
                    />
                  </g>
                ) : (
                  <g
                    ref={(el) => {
                      irises.current[i] = el;
                    }}
                  >
                    <circle
                      cx={e.cx}
                      cy={e.cy}
                      r="15"
                      fill="url(#ch-ir)"
                      stroke="#FF7A3D"
                      strokeWidth="1.5"
                      strokeOpacity=".6"
                    />
                    <circle cx={e.cx + 1} cy={e.cy - 1} r="7" fill="#0A0605" />
                    <circle cx={e.cx - 5} cy={e.cy - 7} r="4.5" fill="#fff" />
                  </g>
                )}
                <path
                  ref={(el) => {
                    lids.current[i].top = el;
                  }}
                  fill={LID}
                />
                <path
                  ref={(el) => {
                    lids.current[i].bottom = el;
                  }}
                  fill={LID}
                />
              </g>
              <path
                ref={(el) => {
                  lids.current[i].lash = el;
                }}
                stroke="#1A1412"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          ))}
          {mode === 'happy' && (
            <path
              d="M136 212Q160 190 184 212M218 210Q242 188 266 210"
              stroke="#1A1412"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          )}
          <path
            d="M201 222Q196 246 207 250"
            stroke="#A9694C"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <Mouth mode={mode} />
          <ellipse
            cx="138"
            cy="250"
            rx="16"
            ry="9"
            fill="#FF7A3D"
            opacity={mode === 'poked' || mode === 'happy' ? 0.45 : asleepish ? 0.26 : 0.18}
          />
          <ellipse
            cx="266"
            cy="248"
            rx="16"
            ry="9"
            fill="#FF7A3D"
            opacity={mode === 'poked' || mode === 'happy' ? 0.45 : asleepish ? 0.26 : 0.18}
          />
        </g>
        {dizzy && (
          <g className="stars">
            <path d="M78 104l5 10 11 1-8 7 2 11-10-6-10 6 2-11-8-7 11-1z" fill="#FF7A3D" />
            <path d="M326 82l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#F6D38C" />
            <path d="M240 54l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#FF7A3D" />
          </g>
        )}
      </svg>
    </>
  );

  const style = { width: size, height: size * 1.175 };
  const className = `char char-${mode}${hood ? ' char-hooded' : ''}`;
  if (!interactive) {
    return (
      <div
        ref={(el) => {
          root.current = el;
        }}
        className={className}
        style={style}
        aria-hidden="true"
      >
        {body}
      </div>
    );
  }
  return (
    <button
      ref={(el) => {
        root.current = el;
      }}
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onKeyDown={onKey}
      aria-label="Atul. Poke him. Press H for his hood."
    >
      {body}
    </button>
  );
}

function Mouth({ mode }: { mode: Mode }) {
  const line = { stroke: '#7A3B2A', strokeWidth: 5, fill: 'none', strokeLinecap: 'round' as const };
  switch (mode) {
    case 'poked':
      return <ellipse cx="204" cy="274" rx="10" ry="12" fill="#7A3B2A" />;
    case 'yawn':
      return <ellipse className="ch-yawn-mouth" cx="204" cy="276" rx="17" ry="24" fill="#5E2A1E" />;
    case 'dizzy':
      return <path d="M178 272Q190 262 202 272Q214 282 226 272" {...line} />;
    case 'dozing':
    case 'sleep':
      return <ellipse cx="205" cy="276" rx="6" ry="5" fill="#7A3B2A" />;
    case 'drowsy':
    case 'waking':
      return <path d="M188 274Q204 280 220 273" {...line} />;
    case 'happy':
      return <path d="M172 266Q204 300 236 264" {...line} />;
    default:
      return <path d="M176 270Q204 290 232 268" {...line} />;
  }
}
