import { useEffect, useRef, useState } from 'react';
import { useLatest } from '../lib/hooks';
import { pick } from './kit';
import { GIcon, type GameDef, type GameProps } from './Shell';

const WORDS = [
  'widget',
  'state',
  'build',
  'flutter',
  'dart',
  'async',
  'await',
  'future',
  'stream',
  'bloc',
  'provider',
  'react',
  'native',
  'props',
  'hooks',
  'redux',
  'expo',
  'gradle',
  'xcode',
  'swift',
  'kotlin',
  'render',
  'layout',
  'column',
  'scaffold',
  'navigator',
  'route',
  'theme',
  'gesture',
  'animation',
  'firebase',
  'sentry',
  'fastlane',
  'release',
  'commit',
  'merge',
  'rebase',
  'deploy',
  'pubspec',
  'useEffect',
  'setState',
  'context',
  'riverpod',
  'testflight',
  'playstore',
  'hotreload',
];
const LIVES = 3;

type Word = {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  kind: 'word' | 'hotfix' | 'coffee';
};

/** Pure: which falling word the typed text is aimed at (the lowest one it is a prefix of). */
export function target(words: { text: string; y: number }[], typed: string) {
  if (!typed) return null;
  const matches = words.filter((w) => w.text.startsWith(typed));
  return matches.length ? matches.reduce((a, b) => (a.y > b.y ? a : b)) : null;
}

function TypingGame({ onEnd }: GameProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [typed, setTyped] = useState('');
  const [hud, setHud] = useState({ score: 0, lives: LIVES, level: 1, note: '' });
  const input = useRef<HTMLInputElement>(null);
  const end = useLatest(onEnd);
  const g = useRef({
    id: 0,
    words: [] as Word[],
    score: 0,
    lives: LIVES,
    level: 1,
    cleared: 0,
    nextAt: 0,
    slowUntil: 0,
    over: false,
    t0: 0,
  });

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
    const s = g.current;
    const tick = window.setInterval(() => {
      if (s.over) return;
      const now = performance.now();
      const slow = now < s.slowUntil ? 0.45 : 1;
      if (now > s.nextAt) {
        const gap = Math.max(650, 2100 - s.level * 160);
        s.nextAt = now + gap * (0.8 + Math.random() * 0.4);
        const r = Math.random();
        const kind: Word['kind'] = r < 0.05 ? 'hotfix' : r < 0.09 ? 'coffee' : 'word';
        s.words.push({
          id: ++s.id,
          text: kind === 'word' ? pick(WORDS) : kind,
          x: 4 + Math.random() * 70,
          y: 0,
          speed: (0.045 + s.level * 0.012) * (0.85 + Math.random() * 0.3),
          kind,
        });
      }
      for (const w of s.words) w.y += w.speed * slow * 5;
      const landed = s.words.filter((w) => w.y >= 100);
      if (landed.length) {
        s.words = s.words.filter((w) => w.y < 100);
        s.lives -= landed.filter((w) => w.kind === 'word').length;
        if (s.lives <= 0) {
          s.over = true;
          window.setTimeout(() => end.current(s.score), 700);
        }
      }
      setWords([...s.words]);
      setHud((h) => ({ ...h, lives: Math.max(0, s.lives), level: s.level, score: s.score }));
    }, 50);
    return () => window.clearInterval(tick);
  }, [end]);

  const onType = (value: string) => {
    const s = g.current;
    const v = value.trim().toLowerCase();
    const hitWord = s.words.find((w) => w.text.toLowerCase() === v);
    if (hitWord) {
      s.words = s.words.filter((w) => w !== hitWord);
      s.cleared += 1;
      let note = '';
      if (hitWord.kind === 'hotfix') {
        s.score += s.words.length * 50 * s.level;
        s.words = [];
        note = 'Hotfix shipped: screen cleared';
      } else if (hitWord.kind === 'coffee') {
        s.slowUntil = performance.now() + 5000;
        note = 'Coffee: everything slows down';
      }
      s.score += hitWord.text.length * 10 * s.level;
      if (s.cleared % 10 === 0) {
        s.level += 1;
        note = `Level ${s.level}: faster`;
      }
      setWords([...s.words]);
      setHud({ score: s.score, lives: s.lives, level: s.level, note });
      setTyped('');
      return;
    }
    setTyped(v);
  };

  const aim = target(
    words.map((w) => ({ ...w, text: w.text.toLowerCase() })),
    typed,
  );
  return (
    <div className="game typing">
      <div className="game-hud">
        <span>
          Score <b className="mono">{hud.score.toLocaleString()}</b>
        </span>
        <span>
          Level <b className="mono">{hud.level}</b>
        </span>
        <span className="lives" aria-label={`${hud.lives} lives`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <span key={i} className={i < hud.lives ? 'on' : ''}>
              <GIcon id="heart" size={16} />
            </span>
          ))}
        </span>
        {hud.note && <span className="hot">{hud.note}</span>}
      </div>
      <div
        className="game-stage typing-stage"
        onPointerDown={() => window.setTimeout(() => input.current?.focus(), 0)}
        aria-hidden="true"
      >
        {words.map((w) => {
          const aimed =
            aim &&
            w.id === words.find((x) => x.text.toLowerCase() === aim.text && x.y === aim.y)?.id;
          return (
            <span
              key={w.id}
              className={`tword k-${w.kind}${aimed ? ' aimed' : ''}`}
              style={{ left: `${w.x}%`, top: `${w.y}%` }}
            >
              {aimed ? (
                <>
                  <b>{w.text.slice(0, typed.length)}</b>
                  {w.text.slice(typed.length)}
                </>
              ) : (
                w.text
              )}
            </span>
          );
        })}
        <span className="prod-line">production</span>
      </div>
      <input
        ref={input}
        className="tinput mono"
        value={typed}
        onChange={(e) => onType(e.target.value)}
        aria-label="Type the falling words"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="type here…"
      />
    </div>
  );
}

export const typingSprint: GameDef = {
  id: 'typing',
  name: 'Typing Sprint',
  blurb: 'Type the stack before it hits production.',
  tile: '#8FD19E',
  icon: <GIcon id="text" size={40} color="#0b0a0c" />,
  unit: 'points',
  howTo: [
    'Words from Flutter and React fall toward production. Type one to clear it. No Enter needed.',
    'Three words reaching production and the sprint is over.',
    'Type gold "hotfix" to clear the screen, blue "coffee" to slow everything down.',
    'Every ten words the level goes up and they fall faster. Longer words score more.',
  ],
  atul: () => 'typing',
  Game: TypingGame,
};
