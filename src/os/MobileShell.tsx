import { useEffect, useRef, useState } from 'react';
import { useLatest, useViewport } from '../lib/hooks';
import { renderApp } from '../apps/registry';
import { Character } from '../character/Character';
import { profile } from '../data/cv';
import { Bulb } from '../widgets/Bulb';
import { IdCard } from '../widgets/IdCard';
import { Avatar } from '../character/Avatar';
import { AppTile, Icon } from './icons';
import { useOS, type AppId, CLOSE_MS } from './store';
import { APP_TITLES } from './titles';
import { Toasts } from './Toasts';
import { delhiTime, useNow } from './useNow';
import './mobile.css';

const GRID: AppId[] = [
  'projects',
  'experience',
  'skills',
  'about',
  'terminal',
  'arcade',
  'resume',
  'mail',
  'settings',
  'secrets',
];
const DOCK: AppId[] = ['projects', 'arcade', 'terminal', 'mail'];

const isSheetState = (s: unknown) =>
  typeof s === 'object' && s !== null && 'atulosSheet' in s && s.atulosSheet === true;

/** AtulOS on a phone: a home screen with widgets, and apps that open as full-screen sheets. */
export function MobileShell() {
  const { wins, open, close } = useOS();
  const now = useNow(15000);
  const [badge, setBadge] = useState(false);
  const [badgeClosing, setBadgeClosing] = useState(false);
  const closeBadge = () => {
    setBadgeClosing(true);
    window.setTimeout(() => {
      setBadge(false);
      setBadgeClosing(false);
    }, CLOSE_MS);
  };
  const { w: vw, h: vh } = useViewport();

  const top = wins.filter((w) => !w.minimized).toSorted((a, b) => b.z - a.z)[0];
  const sheetOpen = !!top || badge;
  const home = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLElement>(null);
  const closeSheet = useLatest(() => (top ? close(top.id) : closeBadge()));

  // Behind a sheet, the home screen is inert: not focusable, not clickable, not announced.
  useEffect(() => {
    if (home.current) home.current.inert = sheetOpen;
  }, [sheetOpen]);

  // Move focus into each new sheet, and back to the home screen when it closes.
  const sheetKey = badge ? 'badge' : top?.id;
  useEffect(() => {
    if (!sheetKey) return undefined;
    const from = document.activeElement;
    sheet.current?.querySelector<HTMLElement>('.sheet-back')?.focus({ preventScroll: true });
    return () => {
      if (from instanceof HTMLElement && from.isConnected) from.focus({ preventScroll: true });
    };
  }, [sheetKey]);

  // The phone's back gesture closes the sheet instead of leaving the site.
  useEffect(() => {
    if (!sheetOpen) return undefined;
    history.pushState({ atulosSheet: true }, '');
    // Only close when the sheet's own entry was popped (StrictMode re-runs can stack two).
    const onPop = () => {
      if (!isSheetState(history.state)) closeSheet.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (isSheetState(history.state)) history.back();
    };
  }, [sheetOpen, closeSheet]);
  const date = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <div className="phone-os">
      <div className="wall" />
      <main ref={home} className="home">
        <header className="home-top">
          <span>
            <span className="label">Delhi · {date}</span>
            <span className="home-time">{delhiTime(now)}</span>
          </span>
          <span className="home-bulb">
            <Bulb x={20} compact />
          </span>
          <span className="home-seal deva" aria-hidden="true">
            अ
          </span>
        </header>

        <div className="home-hero">
          <Character size={Math.min(250, vw * 0.6, vh * 0.5)} />
          <h1>Hi, I'm {profile.first}.</h1>
          <p className="muted">{profile.tagline}</p>
        </div>

        <div className="home-widgets">
          <button type="button" className="hw-id" onClick={() => setBadge(true)}>
            <span className="hw-photo">
              <Avatar />
            </span>
            <span className="hw-text">
              <b>{profile.name}</b>
              <small>
                {profile.role} · since {profile.since}
              </small>
            </span>
            <span className="hw-tag mono">ID</span>
          </button>
          <a
            className="hw-card glass"
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <b>GitHub</b>
            <small className="mono muted">@{profile.githubUser}</small>
          </a>
          <a
            className="hw-card glass"
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            <b>LinkedIn</b>
            <small className="muted">in/winlooper</small>
          </a>
        </div>

        <ul className="home-grid">
          {GRID.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => open(id)}>
                <AppTile id={id === 'about' ? 'desk' : id} size={58} />
                <span>{APP_TITLES[id]}</span>
              </button>
            </li>
          ))}
        </ul>

        <nav className="home-dock glass" aria-label="Dock">
          {DOCK.map((id) => (
            <button key={id} type="button" onClick={() => open(id)} aria-label={APP_TITLES[id]}>
              <AppTile id={id} size={56} />
            </button>
          ))}
        </nav>
      </main>

      {top && (
        <section
          ref={sheet}
          className={`sheet${top.closing ? ' closing' : ''}`}
          key={top.id}
          aria-label={APP_TITLES[top.id]}
        >
          <header className="sheet-bar">
            <button type="button" className="sheet-back" onClick={() => close(top.id)}>
              <Icon.back size={18} /> Home
            </button>
            <b>{APP_TITLES[top.id]}</b>
          </header>
          {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region */}
          <section className="sheet-body" aria-label={`${APP_TITLES[top.id]} content`} tabIndex={0}>
            {renderApp(top.id, top.props)}
          </section>
        </section>
      )}

      {badge && (
        <section
          ref={sheet}
          className={`sheet badge-sheet${badgeClosing ? ' closing' : ''}`}
          aria-label="ID card"
        >
          <header className="sheet-bar">
            <button type="button" className="sheet-back" onClick={closeBadge}>
              <Icon.back size={18} /> Home
            </button>
            <b>Staff ID</b>
          </header>
          <IdCard anchorX={vw / 2} anchorY={64} length={70} />
          <p className="badge-hint muted">
            Drag the card and let go. Fling it hard to spin it. Tap to flip.
          </p>
        </section>
      )}
      <Toasts />
    </div>
  );
}
