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
}

export default App;
