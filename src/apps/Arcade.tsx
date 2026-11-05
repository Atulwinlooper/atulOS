import { useState } from 'react';
import { bugSmash } from '../games/BugSmash';
import { codeReview } from '../games/CodeReview';
import { mergeConflict } from '../games/MergeConflict';
import { GameShell, type GameDef } from '../games/Shell';
import { shipIt } from '../games/ShipIt';
import { snake } from '../games/Snake';
import { stackOverflow } from '../games/StackOverflow';
import { typingSprint } from '../games/TypingSprint';
import { widgetMatch } from '../games/WidgetMatch';

const GAMES: GameDef[] = [
  bugSmash,
  shipIt,
  snake,
  widgetMatch,
  mergeConflict,
  codeReview,
  stackOverflow,
  typingSprint,
];

export function Arcade() {
  const [id, setId] = useState(GAMES[0].id);
  const game = GAMES.find((g) => g.id === id) ?? GAMES[0];
  return (
    <div className="app arcade">
      <nav className="side" aria-label="Games">
        <span className="label side-h">Library · {GAMES.length} games</span>
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`side-item game-item${id === g.id ? ' on' : ''}`}
            aria-current={id === g.id ? 'true' : undefined}
            onClick={() => setId(g.id)}
          >
            <span className="gtile" style={{ background: g.tile }} aria-hidden="true">
              {g.icon}
            </span>
            <span className="prow-text">
              <b>{g.name}</b>
              <small>{g.blurb}</small>
            </span>
          </button>
        ))}
        <p className="side-note muted">Beat Atul's best in any game. Something might happen.</p>
      </nav>
      <div className="arcade-stage">
        <GameShell key={game.id} def={game} />
      </div>
    </div>
  );
}
