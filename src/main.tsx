import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline asset caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PRISM Service Worker] New build available.');
  },
  onOfflineReady() {
    console.log('[PRISM Service Worker] Machine DeepDive assets cached and ready for offline operation.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
