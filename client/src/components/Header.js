import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useJapanese } from '../contexts/JapaneseContext';

export default function Header() {
  const location = useLocation();
  const { isJapaneseMode, toggleJapaneseMode, isLoading } = useJapanese();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-lg">Manga Reader JP</span>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Home
            </Link>
            <Link
              to="/library"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/library') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Library
            </Link>
            <Link
              to="/search"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/search') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Search
            </Link>

            <button
              onClick={toggleJapaneseMode}
              disabled={isLoading}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isJapaneseMode ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {isLoading ? '...' : isJapaneseMode ? '日本語 ON' : '日本語 OFF'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
