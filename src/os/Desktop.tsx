import { useEffect, useRef, useState } from 'react';
import { useViewport } from '../lib/hooks';
import { renderApp } from '../apps/registry';
import { RESUME_FILE, RESUME_PDF } from '../data/resume';
import { Character } from '../character/Character';
import { profile } from '../data/cv';
import { Bulb } from '../widgets/Bulb';
import { IdCard } from '../widgets/IdCard';
import { ClockCard, GitHubCard, LinkedInCard, NowCard } from '../widgets/Widgets';
import { Dock } from './Dock';
import { MenuBar } from './MenuBar';
import { useOS } from './store';
import { APP_TITLES } from './titles';
import { Toasts } from './Toasts';
import { Window } from './Window';
import './desktop.css';

export function Desktop() {
  const { wins, toast } = useOS();
  const { w, h } = useViewport();
  const [binAsk, setBinAsk] = useState(false);

  const showRight = w >= 1120;
  const showClock = h >= 860;
  const showNow = h >= 780;
  const leftX = 28;
  const anchorX = leftX + 165;
  const charSize = Math.max(240, Math.min(400, h * 0.46, (showRight ? w - 720 : w - 380) * 0.95));
  const centerLeft = showRight ? w / 2 : 360 + (w - 360) / 2;
  // The bulb hangs just outside Atul's clickable area, if there is room next to the ID card.
  const bulbX = centerLeft - charSize / 2 - 34;

  return (
    <div className="desktop">
      <div className="wall" />
      <MenuBar />

      <IdCard anchorX={anchorX} anchorY={30} length={78} />

      {/* A pendant light just left of Atul's head. Pull the cord. */}
      {bulbX > anchorX + 170 && <Bulb x={bulbX} />}

      {showClock && (
        <div className="d-col left" style={{ left: leftX, top: 520 }}>
          <ClockCard />
        </div>
      )}

      <DesktopIcons onBin={() => setBinAsk(true)} />

      <div className="d-center" style={{ left: centerLeft, top: Math.max(50, h * 0.08) }}>
        <Character size={charSize} />
        <div className="hello">
          <h1>Hi, I'm {profile.first}.</h1>
          <p className="muted">{profile.tagline}</p>
          <span className="hint">
            <i /> Move your cursor. He's watching.
          </span>
        </div>
      </div>

      {showRight && (
        <div className="d-col right" style={{ right: 28, top: 46 }}>
          <GitHubCard />
          <LinkedInCard />
          {showNow && <NowCard />}
        </div>
      )}

      <div className="win-layer">
        {wins.map((win) => (
          <Window key={win.id} win={win} title={APP_TITLES[win.id]}>
            {renderApp(win.id, win.props)}
          </Window>
        ))}
      </div>

      <Dock
        onBin={() => toast('The Bin is empty', "Atul doesn't throw code away. He refactors it.")}
      />
      <Toasts />
      {binAsk && <BinDialog onClose={() => setBinAsk(false)} />}
    </div>
  );
}

/** True when the point is over the Bin icon in the dock. */
function overBin(x: number, y: number) {
  const r = document.querySelector('[data-dock="bin"]')?.getBoundingClientRect();
  return !!r && x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 20 && y <= r.bottom + 10;
}

/** Desktop files. Drag the CV onto the Bin in the dock to find a secret. */
function DesktopIcons({ onBin }: { onBin: () => void }) {
  const { open, findSecret } = useOS();
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean }>({ x: 0, y: 0, moved: false });

  const icons = [
    { id: 'cv', label: `${RESUME_FILE}.pdf`, glyph: <PdfIcon />, act: () => open('resume') },
    { id: 'projects', label: 'Projects', glyph: <FolderIcon />, act: () => open('projects') },
    { id: 'secrets', label: 'secrets.txt', glyph: <TxtIcon />, act: () => open('secrets') },
  ];

  return (
    <div className="d-icons">
      {icons.map((ic) => {
        const d = drag?.id === ic.id ? drag : null;
        return (
          <button
            key={ic.id}
            type="button"
            className={`d-icon${d ? ' dragging' : ''}`}
            style={d ? { transform: `translate(${d.dx}px, ${d.dy}px)` } : undefined}
            onPointerDown={(e) => {
              start.current = { x: e.clientX, y: e.clientY, moved: false };
              e.currentTarget.setPointerCapture(e.pointerId);
              setDrag({ id: ic.id, dx: 0, dy: 0 });
            }}
            onPointerMove={(e) => {
              if (!drag || drag.id !== ic.id) return;
              const dx = e.clientX - start.current.x;
              const dy = e.clientY - start.current.y;
              if (Math.hypot(dx, dy) > 4) start.current.moved = true;
              setDrag({ id: ic.id, dx, dy });
            }}
            onPointerUp={(e) => {
              const moved = start.current.moved;
              setDrag(null);
              if (moved && overBin(e.clientX, e.clientY)) {
                if (ic.id === 'cv') {
                  findSecret('bin');
                  onBin();
                }
              }
            }}
            onDoubleClick={ic.act}
            onKeyDown={(e) => e.key === 'Enter' && ic.act()}
            onClick={(e) => {
              if (e.detail === 0) ic.act();
            }}
            aria-label={`${ic.label}. Double-click to open.`}
          >
            {ic.glyph}
            <span>{ic.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function BinDialog({ onClose }: { onClose: () => void }) {
  const { toast, open } = useOS();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('.btn.primary')?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="modal-wrap">
      <button
        type="button"
        className="modal-scrim"
        aria-label="Cancel"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={ref}
        className="modal glass"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bin-t"
        aria-describedby="bin-d"
      >
        <div className="modal-head">
          <PdfIcon small />
          <b id="bin-t">Move {RESUME_FILE}.pdf to the Bin?</b>
        </div>
        <p id="bin-d" className="muted">
          Recruiters who did this later asked for it back. It is also the only copy with his phone
          number on it.
        </p>
        <div className="row-actions end">
          <button
            type="button"
            className="btn"
            onClick={() => {
              onClose();
              toast(
                'Restored from backup',
                'Atul keeps backups of everything. The CV is back on the desktop.',
              );
            }}
          >
            Delete anyway
          </button>
          <a
            className="btn primary"
            href={RESUME_PDF}
            download
            onClick={() => {
              onClose();
              open('resume');
            }}
          >
            Keep it, and download
          </a>
        </div>
      </div>
    </div>
  );
}

function PdfIcon({ small }: { small?: boolean }) {
  return (
    <svg width={small ? 34 : 46} height={small ? 40 : 56} viewBox="0 0 52 62" aria-hidden="true">
      <path d="M4 4h30l14 14v40H4z" fill="#EFE9E1" />
      <path d="M34 4v14h14" fill="#CFC6BC" />
      <rect x="0" y="34" width="34" height="16" rx="3" fill="#FF7A3D" />
      <text
        x="17"
        y="46"
        textAnchor="middle"
        fontFamily="Onest Variable, Onest, sans-serif"
        fontWeight="700"
        fontSize="10"
        fill="#160C07"
      >
        PDF
      </text>
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="56" height="48" viewBox="0 0 62 52" aria-hidden="true">
      <path
        d="M2 8a4 4 0 014-4h18l6 6h26a4 4 0 014 4v32a4 4 0 01-4 4H6a4 4 0 01-4-4z"
        fill="#C9572A"
      />
      <path d="M2 16h58v30a4 4 0 01-4 4H6a4 4 0 01-4-4z" fill="#FF7A3D" />
    </svg>
  );
}
function TxtIcon() {
  return (
    <svg width="46" height="56" viewBox="0 0 52 62" aria-hidden="true">
      <path d="M4 4h30l14 14v40H4z" fill="#F6D38C" />
      <path d="M34 4v14h14" fill="#E3A93E" />
      <path
        d="M12 28h28M12 36h28M12 44h18"
        stroke="#8A5A12"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
