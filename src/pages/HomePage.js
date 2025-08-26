import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import { DEFAULT_MANGA_SITES } from '../config/api';
import apiService from '../services/apiService';

const HomePage = () => {
  const navigate = useNavigate();
  const { getRecentlyRead } = useLibrary();
  const [recentManga, setRecentManga] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    // Check backend status
    checkBackendStatus();
    
    // Load recent manga
    const recent = getRecentlyRead(5);
    setRecentManga(recent);
  }, [getRecentlyRead]);

  const checkBackendStatus = async () => {
    try {
      const isAvailable = await apiService.isBackendAvailable();
      setBackendStatus(isAvailable ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const handleSiteClick = (site) => {
    navigate(`/search/${site.id}`);
  };

  const handleRecentMangaClick = (manga) => {
    navigate(`/manga/${manga.site}/${manga.id}`, {
      state: { 
        mangaData: manga,
        fromLibrary: true,
        from: '/' // Pass home page as referrer
      }
    });
  };

  // Helper function to create absolute URL for cover images
  const getAbsoluteCoverImageUrl = (coverImage) => {
    if (!coverImage) return null;
    
    // If it's already an absolute URL, return as-is
    if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
      return coverImage;
    }
    
    // If it's a relative API URL, make it absolute
    if (coverImage.startsWith('/api/')) {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://manga-reader-server-avc1.onrender.com'
        : 'http://localhost:5000';
      return `${API_BASE_URL}${coverImage}`;
    }
    
    return coverImage;
  };

  return (
    <div className="min-h-screen bg-manga-dark pb-20">
      {/* Header */}
      <header className="bg-manga-gray shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-manga-text text-center">
            📚 Manga Reader
          </h1>
          <p className="text-manga-text/70 text-center mt-2">
            Read manga with Japanese learning features
          </p>
        </div>
      </header>

      {/* Backend Status */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          backendStatus === 'online' 
            ? 'bg-green-900/30 border border-green-700' 
            : backendStatus === 'offline'
            ? 'bg-red-900/30 border border-red-700'
            : 'bg-yellow-900/30 border border-yellow-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            backendStatus === 'online' ? 'bg-green-400' :
            backendStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
          }`}></div>
          <span className="text-sm">
            {backendStatus === 'online' && 'Server online - Ready to read manga!'}
            {backendStatus === 'offline' && 'Server offline - Some features may not work'}
            {backendStatus === 'checking' && 'Checking server status...'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Manga Sites */}
        <section>
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            🌐 Browse Manga Sites
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_MANGA_SITES.map((site) => (
              <div
                key={site.id}
                onClick={() => handleSiteClick(site)}
                className="bg-manga-gray rounded-lg p-6 cursor-pointer hover:bg-manga-light transition-colors touch-improvement group"
              >
                <div 
                  className="w-4 h-4 rounded-full mb-3"
                  style={{ backgroundColor: site.color }}
                ></div>
                <h3 className="font-semibold text-manga-text group-hover:text-manga-accent transition-colors">
                  {site.name}
                </h3>
                <p className="text-sm text-manga-text/70 mt-1">
                  {site.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-manga-text/50">
                    {site.url}
                  </span>
                  <div className="text-manga-accent group-hover:transform group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Manga */}
        {recentManga.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-manga-text mb-4">
              📖 Continue Reading
            </h2>
            <div className="grid gap-4">
              {recentManga.map((manga) => (
                <div
                  key={manga.id}
                  onClick={() => handleRecentMangaClick(manga)}
                  className="bg-manga-gray rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-manga-light transition-colors touch-improvement"
                >
                  <div className="w-16 h-20 bg-manga-light rounded overflow-hidden flex-shrink-0">
                    {manga.coverImage ? (
                      <img
                        src={getAbsoluteCoverImageUrl(manga.coverImage)}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('❌ Failed to load cover image:', manga.coverImage);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ display: manga.coverImage ? 'none' : 'flex' }}>
                      📚
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-manga-text truncate">
                      {manga.title}
                    </h3>
                    <p className="text-sm text-manga-text/70 truncate">
                      Chapter {manga.currentChapter || 1}
                      {manga.currentPage && ` • Page ${manga.currentPage}`}
                    </p>
                    <p className="text-xs text-manga-text/50 mt-1">
                      {new Date(manga.lastRead).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-manga-accent">→</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            ⚡ Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/library')}
              className="bg-manga-gray rounded-lg p-6 text-left hover:bg-manga-light transition-colors touch-improvement group"
            >
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold text-manga-text group-hover:text-manga-accent">
                My Library
              </h3>
              <p className="text-sm text-manga-text/70 mt-1">
                View saved manga and reading progress
              </p>
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="bg-manga-gray rounded-lg p-6 text-left hover:bg-manga-light transition-colors touch-improvement group"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold text-manga-text group-hover:text-manga-accent">
                Settings
              </h3>
              <p className="text-sm text-manga-text/70 mt-1">
                Customize reading experience and Japanese helper
              </p>
            </button>
          </div>
        </section>

        {/* Features Preview */}
        <section>
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            ✨ Features
          </h2>
          <div className="bg-manga-gray rounded-lg p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-medium text-manga-text">OCR Reading</h4>
                <p className="text-xs text-manga-text/70 mt-1">
                  Extract Japanese text from images
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">📖</div>
                <h4 className="font-medium text-manga-text">Dictionary</h4>
                <p className="text-xs text-manga-text/70 mt-1">
                  Instant word and kanji lookup
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">🌐</div>
                <h4 className="font-medium text-manga-text">Translation</h4>
                <p className="text-xs text-manga-text/70 mt-1">
                  DeepL-powered translations
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-medium text-manga-text">PWA</h4>
                <p className="text-xs text-manga-text/70 mt-1">
                  Install as native app
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
