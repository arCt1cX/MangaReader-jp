import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LibraryProvider } from './contexts/LibraryContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { useSettings } from './contexts/SettingsContext';
import SplashScreen from './components/SplashScreen';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MangaDetailPage from './pages/MangaDetailPage';
import ReaderPage from './pages/ReaderPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import Navigation from './components/Navigation';

function AppContent() {
  const { settings } = useSettings();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  
  // Check if this is the first load or a fresh launch
  useEffect(() => {
    const lastSplashTime = localStorage.getItem('lastSplashTime');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Show splash if it's first time or more than 5 minutes since last splash
    if (!lastSplashTime || now - parseInt(lastSplashTime) > fiveMinutes) {
      setShowSplash(true);
      localStorage.setItem('lastSplashTime', now.toString());
    } else {
      setShowSplash(false);
      setAppReady(true);
    }
  }, []);
  
  const handleSplashComplete = () => {
    setShowSplash(false);
    setTimeout(() => setAppReady(true), 100); // Small delay for smooth transition
  };
  
  // Apply theme to document body
  useEffect(() => {
    document.body.className = `theme-${settings.theme}`;
    
    // Apply theme-specific background colors to body
    const themes = {
      standard: '#111827',
      dark: '#000000',
      light: '#ffffff',
      amoled: '#000000'
    };
    
    const bgColor = themes[settings.theme] || themes.standard;
    document.body.style.backgroundColor = bgColor;
    
    // Also apply to html for iOS PWA
    document.documentElement.style.backgroundColor = bgColor;
    
    // Set theme color meta tag for iOS status bar
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', bgColor);
    }
  }, [settings.theme]);
  
  // Show splash screen during initial load
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} theme={settings.theme} />;
  }
  
  // Show loading state briefly after splash
  if (!appReady) {
    return (
      <div className={`min-h-screen bg-manga-dark theme-${settings.theme} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-manga-accent"></div>
      </div>
    );
  }
  
  return (
    <Router>
      <div className={`min-h-screen text-manga-text theme-${settings.theme}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search/:site" element={<SearchPage />} />
          <Route path="/manga/:site/:id" element={<MangaDetailPage />} />
          <Route path="/reader/:site/:id/:chapter" element={<ReaderPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}

function App() {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <AppContent />
      </LibraryProvider>
    </SettingsProvider>
  );
}

export default App;
