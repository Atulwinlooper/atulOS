import { lazy, Suspense } from 'react';
import type { AppId } from '../os/store';
import { About } from './About';
import { Experience } from './Experience';
import { Mail } from './Mail';
import { Projects } from './Projects';
import { Resume } from './Resume';
import { Secrets } from './Secrets';
import { Vault } from './Vault';
import { Settings } from './Settings';
import { Skills } from './Skills';
import { Terminal } from './Terminal';
import './apps.css';

// The Arcade (eight games) is the heaviest app and most visitors never open it: load it on demand.
const Arcade = lazy(() => import('./Arcade').then((m) => ({ default: m.Arcade })));

export function renderApp(id: AppId, props?: Record<string, string>) {
  switch (id) {
    case 'projects':
      return <Projects />;
    case 'experience':
      return <Experience />;
    case 'skills':
      return <Skills />;
    case 'terminal':
      return <Terminal />;
    case 'resume':
      return <Resume />;
    case 'about':
      return <About />;
    case 'mail':
      return <Mail key={props?.subject} subject={props?.subject} />;
    case 'arcade':
      return (
        <Suspense fallback={<p className="app pad muted">Loading the Arcade…</p>}>
          <Arcade />
        </Suspense>
      );
    case 'settings':
      return <Settings />;
    case 'secrets':
      return <Secrets />;
    case 'vault':
      return <Vault />;
    default:
      return null;
  }
}
