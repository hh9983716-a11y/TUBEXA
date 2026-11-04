import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA compliance and offline caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[TUBEXA] New content ready');
    },
    onOfflineReady() {
      console.log('[TUBEXA] Ready for offline playback & discovery');
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
