import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './services/serviceWorkerRegistration';

// Register service worker for complete offline PWA & cache-first capabilities
registerServiceWorker({
  onSuccess: () => console.log('[FarmFlow Pro] Offline capabilities active and cached.'),
  onUpdate: () => console.log('[FarmFlow Pro] New application update available.')
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

