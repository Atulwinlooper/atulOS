import { useEffect, useRef, useState } from 'react';
import { confetti } from '../eggs/confetti';
import { isPassphrase, PASSPHRASE, revealed, SECRETS } from '../eggs/secrets';
import { useOS } from '../os/store';

const WRONG = [
  'The door does not move. Not even a little.',
  'Wrong. The dial clicks back to zero.',
  'Twelve letters. Every secret you find gives you one.',
  'Still locked. Have you read secrets.txt lately?',
];

/**
 * The hidden vault: a door that opens with the 12-letter passphrase, spelled out one letter
 * per secret. Behind it, the true ending.
 */
export function Vault() {
  const { found, findSecret, open } = useOS();
  const [guess, setGuess] = useState('');
  const [tries, setTries] = useState(0);
  const [shake, setShake] = useState(0);
  const [opened, setOpened] = useState(() => found.includes('vault'));
  const input = useRef<HTMLInputElement>(null);
  const letters = revealed(found);
  const known = letters.filter(Boolean).length;
  const typed = guess.toUpperCase().replace(/[^A-Z]/g, '');

  useEffect(() => {
    if (!opened) input.current?.focus({ preventScroll: true });
  }, [opened]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPassphrase(guess)) {
      setOpened(true);
      findSecret('vault');
      confetti();
    } else {
      setTries((t) => t + 1);
      setShake((n) => n + 1);
    }
  };

  if (opened) {
    return (
      <div className="app pad vault opened">
        <div className="vault-door open" aria-hidden="true">
          <Door angle={0} />
        </div>
        <article className="vault-letter">
          <span className="label">Inside the vault</span>
          <h2>You found it.</h2>
          <p>
            Most people open a portfolio, skim the projects and leave. You poked, pulled, flicked
            and decoded your way to a hidden door. That is how I like to work too: curious about how
            things behave when you push on them, and stubborn about making them behave well.
          </p>
          <p>
            If you are hiring, building something, or just want to talk about mobile apps, I would
            like to hear from you.
          </p>
          <p className="vault-sign">— Atul</p>
          <div className="row-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => open('mail', { subject: 'I opened the vault' })}
            >
              Write to Atul
            </button>
          </div>
          <details className="vault-credits">
            <summary>
              Credits · {found.length} of {SECRETS.length} secrets
            </summary>
            <ul>
              {SECRETS.map((s) => (
                <li key={s.id} className={found.includes(s.id) ? 'got' : ''}>
                  {found.includes(s.id) ? s.title : '???'}
                </li>
              ))}
            </ul>
          </details>
        </article>
      </div>
    );
  }

  const angle = typed.length * 30;
  return (
    <div className="app pad vault">
      <div key={shake} className={`vault-door${shake ? ' shake' : ''}`} aria-hidden="true">
        <Door angle={angle} />
      </div>
      <form className="vault-form" onSubmit={submit}>
        <label htmlFor="vault-pass" className="label">
          Passphrase
        </label>
        <div className="vault-slots mono" aria-hidden="true">
          {PASSPHRASE.split('').map((_, i) => (
            // A fixed 12-slot row: the position is the identity.
            // oxlint-disable-next-line react/no-array-index-key
            <span key={i} className={letters[i] ? 'known' : ''}>
              {typed[i] ?? letters[i] ?? '·'}
            </span>
          ))}
        </div>
        <input
          ref={input}
          id="vault-pass"
          className="tinput mono"
          value={guess}
          maxLength={24}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="twelve letters"
        />
        <button type="submit" className="btn primary">
          Turn the handle
        </button>
        <output className="muted vault-msg">
          {tries ? WRONG[(tries - 1) % WRONG.length] : `You know ${known} of 12 letters.`}
        </output>
      </form>
    </div>
  );
}

function Door({ angle }: { angle: number }) {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <circle cx="100" cy="100" r="94" fill="#2a2530" stroke="#4a4350" strokeWidth="6" />
      <circle cx="100" cy="100" r="78" fill="#3a3340" />
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2;
        return (
          <circle
            key={`bolt-${a}`}
            cx={100 + Math.cos(a) * 86}
            cy={100 + Math.sin(a) * 86}
            r="4"
            fill="#8f8680"
          />
        );
      })}
      <g
        className="vault-dial"
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}
      >
        <circle cx="100" cy="100" r="40" fill="#5c524b" stroke="#ff7a3d" strokeWidth="3" />
        {Array.from({ length: 12 }, (_, k) => (
          <rect
            key={`tick-${k * 30}`}
            x="99"
            y="62"
            width="2"
            height="8"
            fill="#e8d5bf"
            transform={`rotate(${k * 30} 100 100)`}
          />
        ))}
        <path d="M100 100L100 70" stroke="#ff7a3d" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="9" fill="#ff7a3d" />
    </svg>
  );
}
