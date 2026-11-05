import { useEffect, useState } from 'react';
import { profile } from '../data/cv';
import { rafLoop } from '../lib/dom';
import { useOS } from './store';
import './screens.css';

const STEPS = [
  'flutter.engine',
  'react-native.bridge',
  'bloc.state',
  'redux.store',
  'fastlane.lanes',
  'sentry.watch',
  'atul.profile',
];

/** True when this browser tab has already seen the full boot. */
function seenBoot() {
  try {
    const seen = sessionStorage.getItem('atulos.booted') === '1';
    sessionStorage.setItem('atulos.booted', '1');
    return seen;
  } catch {
    return false;
  }
}

export function Boot() {
  const { setPhase } = useOS();
  const [p, setP] = useState(0);

  useEffect(() => {
    const total = seenBoot() ? 1100 : 2800;
    const start = performance.now();
    const done = { timer: 0 };
    const stop = rafLoop((_dt, now) => {
      const k = Math.min(1, (now - start) / total);
      setP(k);
      if (k >= 1) {
        stop();
        done.timer = window.setTimeout(() => setPhase('lock'), 250);
      }
    });
    const skip = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') setPhase('lock');
    };
    window.addEventListener('keydown', skip);
    return () => {
      stop();
      window.clearTimeout(done.timer);
      window.removeEventListener('keydown', skip);
    };
  }, [setPhase]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))];

  return (
    <main className="boot" aria-label="Starting AtulOS">
      <div className="boot-glow" aria-hidden="true" />
      <div className="boot-mark" aria-hidden="true">
        <span className="deva">अ</span>
      </div>
      <h1 className="boot-name">
        Atul<b>OS</b>
      </h1>
      <progress
        className="boot-bar"
        max={100}
        value={Math.round(p * 100)}
        aria-label="Starting AtulOS"
      />
      <div className="boot-log mono" aria-hidden="true">
        loading {step}
      </div>
      <button type="button" className="boot-skip" onClick={() => setPhase('lock')}>
        Skip intro
      </button>
      <div className="boot-foot">ATULOS 5.0 · BUILT IN DELHI SINCE {profile.since}</div>
    </main>
  );
}
