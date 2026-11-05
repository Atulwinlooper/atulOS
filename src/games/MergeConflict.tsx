import { useEffect, useRef, useState } from 'react';
import { useLatest } from '../lib/hooks';
import { rnd, useControls, type Dir } from './kit';
import { GIcon, type GameDef, type GameProps } from './Shell';

export const N = 4;
/** A board cell: 0 empty, a power of two, or CONFLICT (a blocker that cannot merge). */
export const CONFLICT = -1;
export type Board = number[][];
type Cell = { v: number; id: number; age: number; merged?: boolean; fresh?: boolean };

const TUTORIAL = 'atulos.merge.tutorial';
const tutorialDone = () => {
  try {
    return localStorage.getItem(TUTORIAL) === '1';
  } catch {
    return true;
  }
};
const markTutorialDone = () => {
  try {
    localStorage.setItem(TUTORIAL, '1');
  } catch {
    // Private mode: the tip just shows again next time.
  }
};

/** What each tile value is called on its way from a typo to a store release. */
export const LADDER = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
export const STAGES: Record<number, string> = {
  2: 'typo',
  4: 'fix',
  8: 'commit',
  16: 'PR',
  32: 'review',
  64: 'merge',
  128: 'beta',
  256: 'RC',
  512: 'v1.0',
  1024: 'store',
  2048: '#1 app',
};

/**
 * Slides one row toward index 0 and merges equal neighbours once, 2048-style.
 * Conflicts (-1) are walls: tiles cannot pass or merge through them.
 * Returns the new row and the points scored (the sum of merged values).
 */
export function slideRow(row: number[]): { row: number[]; points: number } {
  const out: number[] = [];
  let points = 0;
  let segment: number[] = [];
  const flush = () => {
    const merged: number[] = [];
    for (let i = 0; i < segment.length; i++) {
      if (i + 1 < segment.length && segment[i] === segment[i + 1]) {
        merged.push(segment[i] * 2);
        points += segment[i] * 2;
        i++;
      } else merged.push(segment[i]);
    }
    return merged;
  };
  let start = 0;
  for (let i = 0; i <= row.length; i++) {
    if (i === row.length || row[i] === CONFLICT) {
      segment = row.slice(start, i).filter((v) => v > 0);
      const m = flush();
      const len = i - start;
      out.push(...m, ...Array(len - m.length).fill(0));
      if (i < row.length) out.push(CONFLICT);
      start = i + 1;
    }
  }
  return { row: out, points };
}

/** Applies a move to a board. Returns the new board, points, and whether anything moved. */
export function move(board: Board, dir: Dir): { board: Board; points: number; moved: boolean } {
  const get = (r: number, c: number) => board[r][c];
  const lines: [number, number][][] = [];
  for (let i = 0; i < N; i++) {
    const line: [number, number][] = [];
    for (let j = 0; j < N; j++) {
      if (dir === 'left') line.push([i, j]);
      if (dir === 'right') line.push([i, N - 1 - j]);
      if (dir === 'up') line.push([j, i]);
      if (dir === 'down') line.push([N - 1 - j, i]);
    }
    lines.push(line);
  }
  const next = board.map((r) => [...r]);
  let points = 0;
  let moved = false;
  for (const line of lines) {
    const { row, points: p } = slideRow(line.map(([r, c]) => get(r, c)));
    points += p;
    line.forEach(([r, c], k) => {
      if (next[r][c] !== row[k]) moved = true;
      next[r][c] = row[k];
    });
  }
  return { board: next, points, moved };
}

/** True when no move changes the board. */
export const stuck = (b: Board) =>
  (['up', 'down', 'left', 'right'] as Dir[]).every((d) => !move(b, d).moved);

function MergeGame({ onEnd }: GameProps) {
  const [cells, setCells] = useState<(Cell | null)[][]>(() => {
    const b: (Cell | null)[][] = Array.from({ length: N }, () => Array<Cell | null>(N).fill(null));
    // First game: two typos on one row, so the first move teaches the whole idea.
    if (!tutorialDone()) {
      b[1][0] = { v: 2, id: 1, age: 0, fresh: true };
      b[1][2] = { v: 2, id: 2, age: 0, fresh: true };
      return b;
    }
    return spawn(spawn(b));
  });
  const [tip, setTip] = useState<string | null>(() =>
    tutorialDone() ? null : 'Two typos, same row. Press ← (or swipe left) to merge them.',
  );
  const [score, setScore] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const end = useLatest(onEnd);
  const best = Math.max(...cells.flat().map((c) => c?.v ?? 0));

  // The live board, so quick key presses between renders never act on a stale one.
  const current = useRef(cells);
  const go = (dir: Dir) => {
    const prev = current.current;
    const values = prev.map((r) => r.map((c) => c?.v ?? 0));
    const { board, points, moved } = move(values, dir);
    if (!moved) return;
    const before = new Set(values.flat());
    const conflict = prev.flat().find((c) => c?.v === CONFLICT);
    const ids = { n: Date.now() };
    // Rebuild cells: the conflict ages and resolves after 12 moves; new merges get a pop.
    let next = board.map((r) =>
      r.map((v): Cell | null => {
        if (v === 0) return null;
        if (v === CONFLICT) {
          const age = (conflict?.age ?? 0) + 1;
          return age > 12 ? null : { v, id: conflict?.id ?? ++ids.n, age };
        }
        return { v, id: ++ids.n, age: 0, merged: points > 0 && !before.has(v) };
      }),
    );
    if (conflict && !next.flat().some((c) => c?.v === CONFLICT)) setNote('Conflict resolved.');
    const top = Math.max(...board.flat());
    const addConflict = top >= 64 && !conflict && Math.random() < 0.06;
    if (addConflict) {
      setNote('Merge conflict! It blocks tiles for 12 moves.');
      next = spawn(next, CONFLICT);
    }
    current.current = spawn(next);
    setCells(current.current);
    setScore((s) => s + points);
    // Guided first game: explain each milestone once.
    if (tip) {
      const made = Math.max(...board.flat());
      if (made >= 8) {
        setTip('That is the whole game. Keep pairing equal stages, all the way to a #1 app.');
        markTutorialDone();
        window.setTimeout(() => setTip(null), 4500);
      } else if (made >= 4) {
        setTip('Two typos became a fix. Now get two fixes together to make a commit.');
      } else if (points === 0) {
        setTip('Every move slides all tiles and adds a new typo. Line up two equal tiles.');
      }
    }
  };

  useControls(stage, { dir: (d, down) => down && go(d) });

  useEffect(() => {
    if (stuck(cells.map((r) => r.map((c) => c?.v ?? 0)))) {
      const t = window.setTimeout(() => end.current(score), 900);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [cells, score, end]);

  useEffect(() => {
    if (!note) return undefined;
    const t = window.setTimeout(() => setNote(null), 2200);
    return () => window.clearTimeout(t);
  }, [note]);

  return (
    <div className="game merge">
      <div className="game-hud">
        <span>
          Score <b className="mono">{score.toLocaleString()}</b>
        </span>
        <span>
          Reached <b className="mono">{STAGES[best] ?? best}</b>
        </span>
        {note && <span className="hot">{note}</span>}
      </div>
      {tip && <output className="merge-tip">{tip}</output>}
      <div
        ref={setStage}
        className="game-stage merge-stage"
        aria-label="Merge board. Use arrow keys or swipe."
      >
        <div className="merge-grid">
          {cells
            .flatMap((row, r) => row.map((c, k) => ({ pos: `${r}-${k}`, c })))
            .map(({ pos, c }) => (
              <div key={pos} className="merge-cell">
                {c && (
                  <span
                    key={c.id}
                    className={`merge-tile t${c.v > 0 ? Math.min(2048, c.v) : 'x'}${c.merged ? ' pop' : ''}${c.fresh ? ' fresh' : ''}`}
                  >
                    {c.v === CONFLICT ? (
                      <>
                        <b>conflict</b>
                        <small>{12 - c.age} moves</small>
                      </>
                    ) : (
                      <>
                        <b>{STAGES[c.v] ?? 'legend'}</b>
                        <small>level {Math.log2(c.v)}</small>
                      </>
                    )}
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
      <ol className="merge-ladder" aria-label="Stages, from first to last">
        {LADDER.map((v) => (
          <li key={v} className={`t${v}${v <= best ? ' got' : ''}${v === best * 2 ? ' next' : ''}`}>
            {STAGES[v]}
          </li>
        ))}
      </ol>
      <div className="row-actions merge-pad" aria-label="Move">
        {(['left', 'up', 'down', 'right'] as Dir[]).map((d) => (
          <button
            key={d}
            type="button"
            className="btn"
            onClick={() => go(d)}
            aria-label={`Move ${d}`}
          >
            {{ left: '←', up: '↑', down: '↓', right: '→' }[d]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Drops a new tile (usually 2, sometimes 4, or a given value) into an empty cell. */
function spawn(b: (Cell | null)[][], value?: number): (Cell | null)[][] {
  const empty: [number, number][] = [];
  b.forEach((r, i) => r.forEach((c, j) => !c && empty.push([i, j])));
  if (!empty.length) return b;
  const [i, j] = empty[rnd(empty.length)];
  const next = b.map((r) => [...r]);
  next[i][j] = {
    v: value ?? (Math.random() < 0.9 ? 2 : 4),
    id: Date.now() + Math.random(),
    age: 0,
    fresh: true,
  };
  return next;
}

export const mergeConflict: GameDef = {
  id: 'merge',
  name: 'Merge Conflict',
  blurb: 'Pair equal changes: typo → fix → commit → … → #1 app.',
  tile: '#8A8FD9',
  icon: <GIcon id="git" size={40} color="#fff" />,
  unit: 'points',
  howTo: [
    'Goal: merge your way from a typo to a #1 app.',
    'Slide every tile with the arrow keys, WASD or a swipe. Two tiles of the same stage that meet become the next stage: typo + typo = fix, fix + fix = commit, and so on.',
    'Each move adds a new typo. The game ends when the board is full and nothing can merge.',
    'Later on, a merge conflict tile may block a square for 12 moves. Work around it.',
  ],
  atul: () => 'merge',
  Game: MergeGame,
};
