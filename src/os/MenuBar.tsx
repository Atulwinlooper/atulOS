import { useEffect, useRef, useState } from 'react';
import { SECRETS } from '../eggs/secrets';
import { isElement } from '../lib/dom';
import { Icon } from './icons';
import { useOS } from './store';
import { APP_TITLES } from './titles';
import { useNow } from './useNow';

export function MenuBar() {
  const { focused, open, setPhase, found } = useOS();
  const now = useNow(15000);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return undefined;
    const off = (e: PointerEvent) => {
      if (!isElement(e.target) || !menuRef.current?.contains(e.target)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('pointerdown', off);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', off);
      window.removeEventListener('keydown', esc);
    };
  }, [menu]);

  const when = now.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const pick = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  return (
    <header className="menubar">
      <nav className="mb-left" aria-label="Menu bar">
        <div className="mb-menu" ref={menuRef}>
          <button
            type="button"
            className="mb-logo"
            aria-label="AtulOS menu"
            aria-expanded={menu}
            aria-haspopup="true"
            onClick={() => setMenu((m) => !m)}
          >
            <span className="deva">अ</span>
          </button>
          {menu && (
            <div className="mb-drop glass">
              <button type="button" onClick={pick(() => open('about'))}>
                About Atul
              </button>
              <button type="button" onClick={pick(() => open('settings'))}>
                Settings…
              </button>
              <button type="button" onClick={pick(() => open('secrets'))}>
                secrets.txt
              </button>
              <hr />
              <button type="button" onClick={pick(() => setPhase('lock'))}>
                Lock screen
              </button>
              <button type="button" onClick={pick(() => setPhase('boot'))}>
                Restart…
              </button>
            </div>
          )}
        </div>
        <b className="mb-app">{focused ? APP_TITLES[focused] : 'AtulOS'}</b>
        <button type="button" className="mb-link" onClick={() => open('projects')}>
          Projects
        </button>
        <button type="button" className="mb-link" onClick={() => open('experience')}>
          Experience
        </button>
        <button type="button" className="mb-link" onClick={() => open('skills')}>
          Skills
        </button>
        <button type="button" className="mb-link" onClick={() => open('arcade')}>
          Arcade
        </button>
        <button type="button" className="mb-link" onClick={() => open('mail')}>
          Contact
        </button>
      </nav>
      <div className="mb-right">
        {found.length > 0 && (
          <button type="button" className="mb-secrets" onClick={() => open('secrets')}>
            {found.length} / {SECRETS.length} secrets
          </button>
        )}
        <Icon.wifi size={16} />
        <svg width="24" height="14" viewBox="0 0 26 14" fill="none" aria-hidden="true">
          <rect
            x="1"
            y="1"
            width="21"
            height="12"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect x="3.5" y="3.5" width="16" height="7" rx="1.5" fill="currentColor" />
          <path d="M24 5v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="mb-clock">
          {when}&nbsp;&nbsp;{time}
        </span>
      </div>
    </header>
  );
}
