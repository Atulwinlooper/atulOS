import { useEffect, useRef } from 'react';
import { Boot } from './os/Boot';
import { Desktop } from './os/Desktop';
import { Lock } from './os/Lock';
import { MobileShell } from './os/MobileShell';
import { useOS } from './os/store';

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function App() {
  const { phase, isPhone, toggleRetro, findSecret } = useOS();
  const seq = useRef<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      seq.current = [...seq.current, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(
        -KONAMI.length,
      );
      if (KONAMI.every((k, i) => seq.current[i] === k)) {
        seq.current = [];
        toggleRetro();
        findSecret('konami');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleRetro, findSecret]);

  // While the tab is in the background, its title calls you back.
  useEffect(() => {
    const original = document.title;
    const lines = ['Psst… Atul is still here', 'Come back, he misses you', original];
    const t = { id: 0, i: 0 };
    const onVisibility = () => {
      window.clearInterval(t.id);
      if (!document.hidden) {
        document.title = original;
        return;
      }
      t.i = 0;
      document.title = lines[0];
      t.id = window.setInterval(() => {
        t.i = (t.i + 1) % lines.length;
        document.title = lines[t.i];
      }, 2000);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(t.id);
      document.title = original;
    };
  }, []);

  if (phase === 'boot') return <Boot />;
  if (phase === 'lock') return <Lock />;
  return isPhone ? <MobileShell /> : <Desktop />;
}
