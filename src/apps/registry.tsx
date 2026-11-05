import { Component, lazy, Suspense, type ReactNode } from 'react';
import { Icon } from '../os/icons';
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

// The Arcade (eight games) is the heaviest app, so it is a separate download. It is fetched
// quietly once the browser is idle, so it is usually ready before anyone opens it.
const loadArcade = () => import('./Arcade');
const Arcade = lazy(() => loadArcade().then((m) => ({ default: m.Arcade })));
if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
  const whenIdle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2500));
  whenIdle(() => void loadArcade().catch(() => undefined));
}

function AppLoading({ label }: { label: string }) {
  return (
    <output className="app app-loading">
      <span className="app-loading-icon" aria-hidden="true">
        <Icon.gamepad size={34} />
      </span>
      <span>Loading {label}…</span>
    </output>
  );
}

/**
 * Catches a failed download (a dropped connection, or a tab left open across a new deploy whose
 * old file is gone) so one app can fail without blanking the whole OS.
 */
class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app app-loading" role="alert">
        <b>This app didn’t load.</b>
        <span className="muted">Check your connection, then reload AtulOS.</span>
        <button type="button" className="btn primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}

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
        <AppBoundary>
          <Suspense fallback={<AppLoading label="the Arcade" />}>
            <Arcade />
          </Suspense>
        </AppBoundary>
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
