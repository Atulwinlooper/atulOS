import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { OSProvider } from './os/store';
// Fonts are self-hosted: no request to a third-party font CDN, and a tighter CSP.
import '@fontsource-variable/onest';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('AtulOS: #root is missing from index.html');
createRoot(root).render(
  <StrictMode>
    <OSProvider>
      <App />
    </OSProvider>
  </StrictMode>,
);
