import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ATUL_BEST } from '../eggs/secrets';
import { useOS } from '../os/store';
import { beats, ICONS, useScores, type IconId } from './kit';

export type GameProps = {
  /** The chosen mode, e.g. difficulty. */
  option: string;
  /** Call once when the run is over. */
  onEnd: (score: number) => void;
};

export type GameDef = {
  id: string;
  name: string;
  blurb: string;
  tile: string;
  icon: ReactNode;
  /** What the score counts: "points", "moves", "floors"... */
  unit: string;
  lowerIsBetter?: boolean;
  howTo: string[];
  /** Optional modes (e.g. difficulty). The first is the default. */
  options?: { id: string; label: string; note?: string }[];
  /** Key into ATUL_BEST for a mode. */
  atul: (option: string) => keyof typeof ATUL_BEST;
  Game: (p: GameProps) => ReactNode;
};

type Phase = 'menu' | 'count' | 'play' | 'over';

/**
 * Every Arcade game runs inside this shell: a main menu (how to play, your best, your last
 * score, Atul's best), a 3-2-1 countdown, the game, then a results screen.
 */
const fmt = (n: number | null) => (n === null ? '–' : n.toLocaleString());

export function GameShell({ def }: { def: GameDef }) {
  const { findSecret, open } = useOS();
  const [phase, setPhase] = useState<Phase>('menu');
  const [option, setOption] = useState(def.options?.[0]?.id ?? '');
  const [count, setCount] = useState(3);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<{
    score: number;
    newBest: boolean;
    prevBest: number | null;
  } | null>(null);
  const scoreKey = def.options ? `${def.id}.${option}` : def.id;
  const { best, last, record } = useScores(scoreKey, def.lowerIsBetter);
  const atul = ATUL_BEST[def.atul(option)];
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase === 'menu' || phase === 'over') primary.current?.focus({ preventScroll: true });
  }, [phase]);

  // 3, 2, 1, Go, then play. Each step is set from a timer, never synchronously.
  useEffect(() => {
    if (phase !== 'count') return undefined;
    const t = window.setTimeout(
      () => (count === 0 ? setPhase('play') : setCount((c) => c - 1)),
      count === 0 ? 400 : 650,
    );
    return () => window.clearTimeout(t);
  }, [phase, count]);

  const start = () => {
    setCount(3);
    setRun((r) => r + 1);
    setPhase('count');
  };
  const end = (score: number) => {
    const prevBest = best;
    const newBest = record(score);
    setResult({ score, newBest, prevBest });
    setPhase('over');
    if (beats(score, atul, def.lowerIsBetter) && score > 0) findSecret('highscore');
  };

  const beatAtul = result && result.score > 0 && beats(result.score, atul, def.lowerIsBetter);

  return (
    <div className="gshell">
      {phase === 'play' && (
        <div className="gplay" key={run}>
          <def.Game option={option} onEnd={end} />
        </div>
      )}

      {phase === 'count' && (
        <div className="gscreen gcount" aria-live="assertive">
          <span key={count} className="gcount-n">
            {count || 'Go'}
          </span>
        </div>
      )}

      {phase === 'menu' && (
        <div className="gscreen gmenu">
          <span className="gmenu-art" style={{ background: def.tile }} aria-hidden="true">
            {def.icon}
          </span>
          <h3 className="gmenu-title">{def.name}</h3>
          <p className="muted gmenu-blurb">{def.blurb}</p>
          {def.options && (
            <fieldset className="gopts">
              <legend className="sr-only">Mode</legend>
              {def.options.map((o) => (
                <label key={o.id} className={`gopt${option === o.id ? ' on' : ''}`}>
                  <input
                    type="radio"
                    name={`${def.id}-mode`}
                    className="sr-only"
                    checked={option === o.id}
                    onChange={() => setOption(o.id)}
                  />
                  <b>{o.label}</b>
                  {o.note && <small>{o.note}</small>}
                </label>
              ))}
            </fieldset>
          )}
          <ul className="ghow">
            {def.howTo.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <dl className="gstats">
            <div>
              <dt>Your best</dt>
              <dd className="mono">{fmt(best)}</dd>
            </div>
            <div>
              <dt>Last game</dt>
              <dd className="mono">{fmt(last)}</dd>
            </div>
            <div>
              <dt>Atul's best</dt>
              <dd className="mono">{fmt(atul)}</dd>
            </div>
          </dl>
          <button ref={primary} type="button" className="btn primary gbig" onClick={start}>
            Play
          </button>
        </div>
      )}

      {phase === 'over' && result && (
        <div className="gscreen gover">
          {result.newBest && <span className="gbadge">New personal best</span>}
          <span className="gscore mono">{result.score.toLocaleString()}</span>
          <span className="muted">{def.unit}</span>
          <p className="gverdict">
            {beatAtul
              ? 'You beat Atul. He will want a rematch.'
              : def.lowerIsBetter
                ? `Atul did it in ${fmt(atul)}. Can you?`
                : `Atul's best is ${fmt(atul)}. ${result.score >= atul * 0.75 ? 'So close.' : 'Keep going.'}`}
          </p>
          <dl className="gstats">
            <div>
              <dt>Your best</dt>
              <dd className="mono">{fmt(result.newBest ? result.score : result.prevBest)}</dd>
            </div>
            <div>
              <dt>Before this</dt>
              <dd className="mono">{fmt(result.prevBest)}</dd>
            </div>
            <div>
              <dt>Atul's best</dt>
              <dd className="mono">{fmt(atul)}</dd>
            </div>
          </dl>
          <div className="row-actions">
            <button ref={primary} type="button" className="btn primary" onClick={start}>
              Play again
            </button>
            <button type="button" className="btn" onClick={() => setPhase('menu')}>
              Menu
            </button>
            {beatAtul && (
              <button
                type="button"
                className="btn"
                onClick={() =>
                  open('mail', { subject: `I beat your ${def.name} score: ${result.score}` })
                }
              >
                Brag by email
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** An icon from the shared game set, as inline SVG. */
export function GIcon({
  id,
  size = 24,
  color = 'currentColor',
}: {
  id: IconId;
  size?: number;
  color?: string;
}) {
  const icon: { d: string; fill?: boolean } = ICONS[id];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d={icon.d}
        fill={icon.fill ? color : 'none'}
        stroke={icon.fill ? 'none' : color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
