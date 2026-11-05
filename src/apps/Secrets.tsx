import { revealed, SECRETS } from '../eggs/secrets';
import { GIcon } from '../games/Shell';
import { useOS } from '../os/store';

/**
 * secrets.txt: a board of stickers. Found secrets show their sticker and story; the rest show
 * only a riddle. Each sticker gives a letter of the passphrase that opens the vault.
 */
export function Secrets() {
  const { found, open } = useOS();
  const letters = revealed(found);
  const vaultOpen = found.includes('vault');

  return (
    <div className="app pad secrets-board">
      <header className="sb-head">
        <span>
          <b className="mono">secrets.txt</b>
          <span className="muted">
            {found.length} of {SECRETS.length} found
          </span>
        </span>
        <div
          className="sb-phrase mono"
          aria-label={`Passphrase so far: ${letters.map((l) => l ?? 'blank').join(' ')}`}
        >
          {letters.map((l, i) => (
            // Twelve fixed slots; the position is the identity.
            // oxlint-disable-next-line react/no-array-index-key
            <span key={i} className={l ? 'on' : ''}>
              {l ?? '?'}
            </span>
          ))}
        </div>
      </header>

      <ul className="sb-grid">
        {SECRETS.map((s, i) => {
          const got = found.includes(s.id);
          return (
            <li
              key={s.id}
              className={`sb-card${got ? ' got' : ''}`}
              style={{ ['--tilt' as string]: `${((i * 37) % 7) - 3}deg` }}
            >
              <span
                className="sb-sticker"
                style={{ background: got ? s.sticker.color : undefined }}
                aria-hidden="true"
              >
                <GIcon
                  id={got ? s.sticker.icon : 'lock'}
                  size={26}
                  color={got ? '#0b0a0c' : 'currentColor'}
                />
              </span>
              <span className="sb-text">
                <b>{got ? s.title : `No. ${String(i + 1).padStart(2, '0')}`}</b>
                <span className={got ? 'muted' : 'sb-riddle'}>{got ? s.text : s.riddle}</span>
              </span>
              {s.slot !== undefined && (
                <span
                  className="sb-letter mono"
                  aria-label={got ? `Letter ${letters[s.slot]}` : 'Letter hidden'}
                >
                  {got ? letters[s.slot] : '?'}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="sb-foot">
        <span className="muted">
          {vaultOpen
            ? 'You opened the vault. Thank you for paying this much attention.'
            : 'Somewhere on this machine there is a door. It opens with all twelve letters.'}
        </span>
        <button type="button" className="btn" onClick={() => open('vault')}>
          {vaultOpen ? 'Back to the vault' : 'Try the door'}
        </button>
      </footer>
    </div>
  );
}
