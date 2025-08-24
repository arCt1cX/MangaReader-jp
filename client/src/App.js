import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LibraryProvider } from './contexts/LibraryContext';
import { JapaneseProvider } from './contexts/JapaneseContext';
import Header from './components/Header';
import Home from './pages/Home';
import Library from './pages/Library';
import Reader from './pages/Reader';
import Search from './pages/Search';
import Settings from './pages/Settings';

function App() {
  try {
    return (
      <LibraryProvider>
        <JapaneseProvider>
          <Router basename="/MangaReader-jp">
            <div className="min-h-screen bg-gray-900 text-white">
              <Header />
              <main className="pb-20">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/search/:site?" element={<Search />} />
                  <Route path="/reader/:site/:mangaId/:chapterId?" element={<Reader />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </Router>
        </JapaneseProvider>
      </LibraryProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Manga Reader JP</h1>
          <p className="text-red-400">Loading error. Please refresh the page.</p>
        </div>
      </div>
    );
  }
}

export default App;
