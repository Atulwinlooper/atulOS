import { useEffect, useRef, useState } from 'react';
import { useLatest } from '../lib/hooks';
import { shuffle, type IconId } from './kit';
import { GIcon, type GameDef, type GameProps } from './Shell';

type Mode = 'easy' | 'normal' | 'hard';
const SIZES: Record<Mode, { pairs: number; cols: number }> = {
  easy: { pairs: 6, cols: 4 },
  normal: { pairs: 8, cols: 4 },
  hard: { pairs: 12, cols: 6 },
};

/** The deck: Flutter widgets, React Native pieces and tools from Atul's stack. */
const DECK: { k: string; icon: IconId; c: string; fact: string }[] = [
  { k: 'Column', icon: 'column', c: '#7FB7C9', fact: 'Most screens he builds start as a Column.' },
  {
    k: 'Row',
    icon: 'row',
    c: '#F6D38C',
    fact: 'Rows inside Columns: the whole of Flutter layout, really.',
  },
  {
    k: 'Stack',
    icon: 'stack',
    c: '#FF9A63',
    fact: 'Stack is how badges and overlays sit on top of things.',
  },
  { k: 'ListView', icon: 'list', c: '#8FD19E', fact: 'Lazy lists keep 10,000-item feeds smooth.' },
  {
    k: 'Container',
    icon: 'container',
    c: '#B9A6FF',
    fact: 'Container: padding, colour and size in one widget.',
  },
  {
    k: 'Image',
    icon: 'image',
    c: '#7FB7C9',
    fact: 'Cached, sized images are the cheapest performance win.',
  },
  {
    k: 'Card',
    icon: 'card',
    c: '#FF7A3D',
    fact: 'Cards hold most of a commerce app’s product grid.',
  },
  {
    k: 'Switch',
    icon: 'switch',
    c: '#8FD19E',
    fact: 'Settings screens: half switches, half sliders.',
  },
  {
    k: 'Slider',
    icon: 'slider',
    c: '#F6D38C',
    fact: 'Sliders need big touch targets. 44 points, minimum.',
  },
  {
    k: 'BLoC',
    icon: 'cube',
    c: '#8A8FD9',
    fact: 'BLoC keeps business logic out of widgets and testable.',
  },
  {
    k: 'Firebase',
    icon: 'flame',
    c: '#E3A93E',
    fact: 'Auth, push and crash reports, wired up on day one.',
  },
  { k: 'Git', icon: 'git', c: '#D9798E', fact: 'Small pull requests ship faster. Every time.' },
  {
    k: 'Fastlane',
    icon: 'rocket',
    c: '#FF7A3D',
    fact: 'One command to build, sign and upload. Releases got boring.',
  },
  { k: 'Device', icon: 'phone', c: '#B9A6FF', fact: 'Test on the cheapest phone your users have.' },
  { k: 'Perf', icon: 'gauge', c: '#8FD19E', fact: 'Startup time is a feature. Measure it in CI.' },
  {
    k: 'Secure',
    icon: 'lock',
    c: '#7FB7C9',
    fact: 'Tokens in secure storage, never in plain prefs.',
  },
  { k: 'Analytics', icon: 'chart', c: '#F6D38C', fact: 'If it is not measured, it did not ship.' },
  { k: 'Push', icon: 'bell', c: '#FF9A63', fact: 'A good notification is one the user wanted.' },
  {
    k: 'Text',
    icon: 'text',
    c: '#D9798E',
    fact: 'Text scales with the user’s font size. Design for 200%.',
  },
  {
    k: 'Button',
    icon: 'button',
    c: '#8A8FD9',
    fact: 'Every button needs a pressed, disabled and loading state.',
  },
];

type Card = { id: number; k: string; icon: IconId; c: string; fact: string };
const deal = (pairs: number): Card[] => {
  const picked = shuffle(DECK).slice(0, pairs);
  return shuffle([...picked, ...picked]).map((p, i) => ({
    id: i,
    k: p.k,
    icon: p.icon,
    c: p.c,
    fact: p.fact,
  }));
};

const isMode = (o: string): o is Mode => o === 'easy' || o === 'normal' || o === 'hard';

function WidgetMatchGame({ option, onEnd }: GameProps) {
  const mode: Mode = isMode(option) ? option : 'normal';
  const { pairs, cols } = SIZES[mode];
  const [cards] = useState(() => deal(pairs));
  const [up, setUp] = useState<number[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [fact, setFact] = useState<string | null>(null);
  // A short peek at the start, so the first flips are not pure luck.
  const [peek, setPeek] = useState(true);
  const t0 = useRef(0);
  const [secs, setSecs] = useState(0);
  const end = useLatest(onEnd);

  useEffect(() => {
    t0.current = performance.now();
    const t = window.setTimeout(() => setPeek(false), mode === 'hard' ? 1800 : 1200);
    const s = window.setInterval(
      () => setSecs(Math.floor((performance.now() - t0.current) / 1000)),
      500,
    );
    return () => {
      window.clearTimeout(t);
      window.clearInterval(s);
    };
  }, [mode]);

  useEffect(() => {
    if (done.length === pairs) {
      const t = window.setTimeout(() => end.current(moves), 900);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [done, pairs, moves, end]);

  const flip = (card: Card) => {
    if (peek || up.length === 2 || up.includes(card.id) || done.includes(card.k)) return;
    const next = [...up, card.id];
    setUp(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((id) => cards[id]);
    if (a.k === b.k) {
      setDone((d) => [...d, a.k]);
      setStreak((s) => s + 1);
      setFact(`${a.k}: ${a.fact}`);
      setUp([]);
    } else {
      setStreak(0);
      window.setTimeout(() => setUp([]), 750);
    }
  };

  return (
    <div className="game match">
      <div className="game-hud">
        <span>
          Moves <b className="mono">{moves}</b>
        </span>
        <span>
          Pairs{' '}
          <b className="mono">
            {done.length}/{pairs}
          </b>
        </span>
        <span>
          Time <b className="mono">{secs}s</b>
        </span>
        {streak > 1 && <span className="hot">Streak ×{streak}</span>}
      </div>
      <div className="mgrid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cards.map((c) => {
          const shown = peek || up.includes(c.id) || done.includes(c.k);
          return (
            <button
              key={c.id}
              type="button"
              className={`mcard${shown ? ' shown' : ''}${done.includes(c.k) ? ' done' : ''}`}
              onClick={() => flip(c)}
              aria-label={shown ? c.k : 'Hidden card'}
            >
              <span className="mback" aria-hidden="true">
                ?
              </span>
              <span className="mface" style={{ background: c.c }} aria-hidden="true">
                <GIcon id={c.icon} size={26} color="#0b0a0c" />
                <small>{c.k}</small>
              </span>
            </button>
          );
        })}
      </div>
      <output className="mfact muted">{peek ? 'Memorise…' : fact}</output>
    </div>
  );
}

export const widgetMatch: GameDef = {
  id: 'widgetMatch',
  name: 'Widget Match',
  blurb: 'Memory pairs from my stack. A new deck every game.',
  tile: '#7FB7C9',
  icon: <GIcon id="card" size={40} color="#0b0a0c" />,
  unit: 'moves',
  lowerIsBetter: true,
  options: [
    { id: 'easy', label: 'Easy', note: '6 pairs' },
    { id: 'normal', label: 'Normal', note: '8 pairs' },
    { id: 'hard', label: 'Hard', note: '12 pairs' },
  ],
  howTo: [
    'All cards show for a moment. Memorise, then find the pairs.',
    'Fewest moves wins. Each match tells you something about building apps.',
    'The deck is dealt from 20 cards, so every game is different.',
  ],
  atul: (o) =>
    o === 'easy' ? 'widgetMatchEasy' : o === 'hard' ? 'widgetMatchHard' : 'widgetMatch',
  Game: WidgetMatchGame,
};
