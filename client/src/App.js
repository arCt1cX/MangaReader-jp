import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LibraryProvider } from './contexts/LibraryContext';
import { JapaneseProvider } from './contexts/JapaneseContext';
import Header from './components/Header';
import Home from './pages/Home';

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
              </Routes>
            </main>
          </div>
        </Router>
      </JapaneseProvider>
    </LibraryProvider>
  );
}

export default App;
