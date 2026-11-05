import type { AppId } from '../os/store';
import { About } from './About';
import { Arcade } from './Arcade';
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
      return <Arcade />;
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
