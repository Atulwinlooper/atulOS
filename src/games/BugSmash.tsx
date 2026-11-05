import { useEffect, useRef, useState } from 'react';
import { useLatest } from '../lib/hooks';
import { GIcon, type GameDef, type GameProps } from './Shell';
import { pick, type IconId } from './kit';

const HOLES = 12;
const ROUND = 45;
const LIVES = 5;
const LABELS = ['ERR', 'NULL', '404', 'NaN', 'ANR', 'OOM'];

type Kind = 'bug' | 'p0' | 'feature' | 'heisen' | 'freeze' | 'rollback' | 'time';
type Pop = { id: number; hole: number; kind: Kind; label: string; until: number; hp: number };

const POWER: Partial<Record<Kind, { icon: IconId; name: string }>> = {
  freeze: { icon: 'snow', name: 'Hotfix: bugs frozen' },
  rollback: { icon: 'wrench', name: 'Rollback: screen cleared' },
  time: { icon: 'clock', name: 'CI cache: +5s' },
};

/** What pops up next. Power-ups are rare; features show up more as the game goes on. */
function nextKind(p: number): Kind {
  const r = Math.random();
  if (r < 0.04) return pick(['freeze', 'rollback', 'time'] as const);
  if (r < 0.1) return 'p0';
  if (r < 0.1 + 0.06 + p * 0.1) return 'feature';
  if (r < 0.3 + p * 0.08) return 'heisen';
  return 'bug';
}

function BugSmashGame({ onEnd }: GameProps) {
  const [pops, setPops] = useState<Pop[]>([]);
  const [hud, setHud] = useState({ score: 0, combo: 1, left: ROUND, lives: LIVES });
  const [fx, setFx] = useState<{ hole: number; text: string; id: number; bad?: boolean } | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [frozen, setFrozen] = useState(false);
  // All mutable game state in one ref, so the timer loop never reads stale React state.
  const g = useRef({
    id: 0,
    t0: 0,
    bonus: 0,
    nextAt: 0,
    frozenUntil: 0,
    score: 0,
    combo: 1,
    lives: LIVES,
    pops: [] as Pop[],
    over: false,
  });
  const endRef = useLatest(onEnd);

  const sync = () => {
    const s = g.current;
    setPops([...s.pops]);
    const left = Math.max(0, ROUND + s.bonus - (performance.now() - s.t0) / 1000);
    setHud({ score: s.score, combo: s.combo, left: Math.ceil(left), lives: s.lives });
    setFrozen(performance.now() < s.frozenUntil);
  };
  const flash = (hole: number, text: string, bad = false) =>
    setFx({ hole, text, bad, id: ++g.current.id });
  const announce = (text: string) => {
    setBanner(text);
    window.setTimeout(() => setBanner((b) => (b === text ? null : b)), 1400);
  };

  const fx$ = useLatest({ sync, flash });
  useEffect(() => {
    const s = g.current;
    const { sync: syncNow, flash: flashAt } = {
      sync: () => fx$.current.sync(),
      flash: (hole: number, text: string, bad?: boolean) => fx$.current.flash(hole, text, bad),
    };
    s.t0 = performance.now();
    const tick = window.setInterval(() => {
      if (s.over) return;
      const now = performance.now();
      const elapsed = (now - s.t0) / 1000;
      const p = Math.min(1, elapsed / ROUND); // difficulty ramps from 0 to 1
      const isFrozen = now < s.frozenUntil;
      // Bugs that stayed up too long reach a user.
      if (!isFrozen) {
        const escaped = s.pops.filter((b) => b.until <= now);
        if (escaped.length) {
          s.pops = s.pops.filter((b) => b.until > now);
          for (const b of escaped) {
            if (b.kind === 'bug' || b.kind === 'p0' || b.kind === 'heisen') {
              s.lives -= 1;
              s.combo = 1;
              flashAt(b.hole, 'A user saw it', true);
            }
          }
        }
      }
      const cap = 2 + Math.floor(p * 4);
      if (!isFrozen && now > s.nextAt && s.pops.length < cap) {
        const gap = 1250 - 800 * p;
        s.nextAt = now + gap * (0.7 + Math.random() * 0.6);
        const free = Array.from({ length: HOLES }, (_, i) => i).filter(
          (i) => !s.pops.some((b) => b.hole === i),
        );
        if (free.length) {
          const kind = nextKind(p);
          const life = 2100 - 1100 * p;
          s.pops.push({
            id: ++s.id,
            hole: pick(free),
            kind,
            label: kind === 'p0' ? 'P0' : kind === 'feature' ? 'feat' : pick(LABELS),
            until: now + (kind === 'p0' ? life * 0.6 : POWER[kind] ? life * 0.8 : life),
            hp: kind === 'heisen' ? 2 : 1,
          });
        }
      }
      const left = ROUND + s.bonus - elapsed;
      if (left <= 0 || s.lives <= 0) {
        s.over = true;
        syncNow();
        window.setTimeout(() => endRef.current(s.score), 600);
        return;
      }
      syncNow();
    }, 50);
    return () => window.clearInterval(tick);
  }, [fx$, endRef]);

  const hit = (b: Pop) => {
    const s = g.current;
    if (s.over || !s.pops.some((x) => x.id === b.id)) return;
    const now = performance.now();
    if (b.kind === 'feature') {
      s.score = Math.max(0, s.score - 300);
      s.combo = 1;
      s.pops = s.pops.filter((x) => x.id !== b.id);
      flash(b.hole, 'That was a feature. −300', true);
    } else if (b.kind === 'heisen' && b.hp > 1) {
      // Observed, it moves.
      const free = Array.from({ length: HOLES }, (_, i) => i).filter(
        (i) => !s.pops.some((x) => x.hole === i),
      );
      const hole = free.length ? pick(free) : b.hole;
      s.pops = s.pops.map((x) =>
        x.id === b.id ? { ...x, hp: x.hp - 1, hole, until: now + 1200 } : x,
      );
      flash(hole, 'Heisenbug moved!');
    } else if (POWER[b.kind]) {
      s.pops = s.pops.filter((x) => x.id !== b.id);
      if (b.kind === 'freeze') {
        s.frozenUntil = now + 3000;
        s.pops = s.pops.map((x) => ({ ...x, until: x.until + 3000 }));
      } else if (b.kind === 'time') {
        s.bonus += 5;
      } else {
        const cleared = s.pops.filter((x) => x.kind !== 'feature');
        s.score += cleared.length * 100 * s.combo;
        s.pops = s.pops.filter((x) => x.kind === 'feature');
      }
      announce(POWER[b.kind]?.name ?? '');
    } else {
      const pts = (b.kind === 'p0' ? 500 : b.kind === 'heisen' ? 250 : 100) * s.combo;
      s.score += pts;
      s.combo = Math.min(8, s.combo + 1);
      s.pops = s.pops.filter((x) => x.id !== b.id);
      flash(b.hole, `+${pts}`);
    }
    sync();
  };
  const miss = () => {
    g.current.combo = 1;
    sync();
  };

  return (
    <div className="game bugs">
      <div className="game-hud">
        <span>
          Score <b className="mono">{hud.score.toLocaleString()}</b>
        </span>
        <span className={hud.left <= 10 ? 'hot' : ''}>
          Time <b className="mono">{hud.left}s</b>
        </span>
        <span className={hud.combo > 1 ? 'hot' : ''}>
          Combo <b className="mono">×{hud.combo}</b>
        </span>
        <span className="lives" aria-label={`${hud.lives} of ${LIVES} users still happy`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <span key={i} className={i < hud.lives ? 'on' : ''}>
              <GIcon id="heart" size={16} />
            </span>
          ))}
        </span>
      </div>
      <div className={`game-stage${frozen ? ' frozen' : ''}`}>
        {banner && <output className="gbanner">{banner}</output>}
        <div className="holes">
          {Array.from({ length: HOLES }, (_, i) => {
            const b = pops.find((x) => x.hole === i);
            return (
              <div key={i} className="hole" onPointerDown={() => !b && miss()}>
                <span className="phone" />
                {b && (
                  <button
                    key={b.id + ':' + b.hole}
                    type="button"
                    className={`bug k-${b.kind}`}
                    aria-label={
                      POWER[b.kind]?.name ??
                      (b.kind === 'feature' ? 'A feature. Leave it.' : `Smash bug ${b.label}`)
                    }
                    onPointerDown={() => hit(b)}
                    onClick={(e) => e.detail === 0 && hit(b)}
                  >
                    {POWER[b.kind] ? (
                      <span className="power">
                        <GIcon id={POWER[b.kind]?.icon ?? 'star'} size={30} color="#0b0a0c" />
                      </span>
                    ) : (
                      <BugSvg kind={b.kind} label={b.label} />
                    )}
                  </button>
                )}
                {fx?.hole === i && (
                  <span key={fx.id} className={`smash${fx.bad ? ' bad' : ''}`} aria-hidden="true">
                    {fx.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const COLORS: Record<string, string> = {
  bug: '#E3311D',
  p0: '#F6D38C',
  heisen: '#9B6BFF',
  feature: '#7FB7C9',
};

function BugSvg({ kind, label }: { kind: Kind; label: string }) {
  const fill = COLORS[kind] ?? COLORS.bug;
  const dark = kind === 'p0' || kind === 'feature';
  return (
    <svg viewBox="0 0 76 70" width="100%" height="100%" aria-hidden="true">
      {kind !== 'feature' && (
        <path
          d="M18 30L4 22M16 42L2 42M18 54L6 62M58 30L72 22M60 42L74 42M58 54L70 62M30 14L24 2M46 14L52 2"
          stroke="#111012"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      {kind === 'feature' ? (
        <>
          <path
            d="M38 6l8 18 20 2-15 13 5 20-18-11-18 11 5-20-15-13 20-2z"
            fill={fill}
            stroke="#111012"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <ellipse cx="38" cy="42" rx="22" ry="24" fill={fill} stroke="#111012" strokeWidth="3" />
          <circle cx="38" cy="18" r="10" fill="#111012" />
          <circle cx="34" cy="17" r="2.5" fill="#fff" />
          <circle cx="42" cy="17" r="2.5" fill="#fff" />
          <path d="M38 22v42" stroke="#111012" strokeWidth="2" />
        </>
      )}
      <text
        x="38"
        y={kind === 'feature' ? 42 : 50}
        textAnchor="middle"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
        fontSize={label.length > 3 ? 9 : 11}
        fill={dark ? '#111012' : '#fff'}
      >
        {label}
      </text>
    </svg>
  );
}

export const bugSmash: GameDef = {
  id: 'bugSmash',
  name: 'Bug Smash',
  blurb: 'Smash production bugs before users see them.',
  tile: '#D42B18',
  icon: <GIcon id="bug" size={40} color="#fff" />,
  unit: 'points',
  howTo: [
    'Tap or click bugs as they pop out of phones. It starts slow and speeds up.',
    'Every bug you miss reaches a user. Five unhappy users and the release is pulled.',
    'Blue stars are features: leave them. Purple Heisenbugs move when you hit them.',
    'Gold P0s are worth 500. Grab power-ups: Hotfix freezes, Rollback clears, CI cache adds time.',
  ],
  atul: () => 'bugSmash',
  Game: BugSmashGame,
};
