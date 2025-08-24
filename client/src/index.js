import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Dynamically determine the correct path for sw.js
    let swPath = '/sw.js';
    if (window.location.pathname.startsWith('/MangaReader-jp')) {
      swPath = '/MangaReader-jp/sw.js';
    }
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
