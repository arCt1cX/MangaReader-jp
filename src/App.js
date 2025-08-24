import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LibraryProvider } from './contexts/LibraryContext';
import { SettingsProvider } from './contexts/SettingsContext';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MangaDetailPage from './pages/MangaDetailPage';
import ReaderPage from './pages/ReaderPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import Navigation from './components/Navigation';

function App() {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <Router basename="/MangaReader-jp">
          <div className="min-h-screen bg-manga-dark text-manga-text">
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
      </LibraryProvider>
    </SettingsProvider>
  );
}

export default App;
