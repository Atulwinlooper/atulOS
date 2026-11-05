import { useEffect, useRef } from 'react';
import { Avatar } from '../character/Avatar';
import { Character } from '../character/Character';
import { profile } from '../data/cv';
import { RESUME_PDF } from '../data/resume';
import { Icon } from './icons';
import { useOS } from './store';
import { delhiDate, delhiTime, useNow } from './useNow';
import './screens.css';

export function Lock() {
  const { setPhase } = useOS();
  const now = useNow(1000);
  const enterBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    enterBtn.current?.focus({ preventScroll: true });
    const k = (e: KeyboardEvent) => {
      // Let Enter on the quick links below open them instead of unlocking.
      if (e.target instanceof HTMLAnchorElement) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setPhase('desktop');
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [setPhase]);

  return (
    <main className="lock" aria-label="Lock screen">
      <div className="wall" />
      <div className="lock-sleeper">
        <Character size={520} asleep interactive={false} />
      </div>
      <div className="lock-shade" aria-hidden="true" />
      <button
        type="button"
        className="lock-catch"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => setPhase('desktop')}
      />
      <div className="lock-time">
        <span className="lock-date">{delhiDate(now)}</span>
        <time className="lock-clock" dateTime={now.toISOString()}>
          {delhiTime(now)}
        </time>
        <span className="lock-zone">Delhi time</span>
      </div>
      <div className="lock-user">
        <div className="lock-avatar" aria-hidden="true">
          <Avatar />
        </div>
        <h1 className="lock-name">{profile.name}</h1>
        <p className="lock-role">{profile.role} · Flutter &amp; React Native</p>
        <button
          ref={enterBtn}
          type="button"
          className="lock-enter"
          onClick={() => setPhase('desktop')}
        >
          Enter AtulOS <Icon.arrow size={16} />
        </button>
        <span className="muted">No password. Click anywhere or press Enter to wake him up.</span>
        {/* The fast path for a busy recruiter: no need to explore first. */}
        <nav className="lock-quick" aria-label="Quick links">
          <span className="muted">In a hurry?</span>
          <a href={RESUME_PDF} download>
            Résumé (PDF)
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </nav>
      </div>
    </main>
  );
}
