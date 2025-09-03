import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import { DEFAULT_MANGA_SITES } from '../config/api';
import apiService from '../services/apiService';
import CachedImage from '../components/CachedImage';
import Icon from '../components/Icon';

const HomePage = () => {
  const navigate = useNavigate();
  const { getRecentlyRead, updateMangaData } = useLibrary();
  const [recentManga, setRecentManga] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to check if manga is completed (all available chapters read)
  const getMangaStatus = (manga) => {
    if (!manga.chaptersRead || manga.chaptersRead.length === 0) {
      return { status: 'unread', nextChapter: manga.currentChapter ? manga.currentChapter + 1 : 1 };
    }

    const highestReadChapter = Math.max(...manga.chaptersRead);
    const nextChapter = highestReadChapter + 1;

    // If manga has chapters list (from manga details), we can check if all are read
    if (manga.chapters && Array.isArray(manga.chapters)) {
      const totalChapters = manga.chapters.length;
      const readChapters = manga.chaptersRead.length;
      
      // Find the highest chapter number in the available chapters
      const highestAvailableChapter = Math.max(...manga.chapters.map(ch => 
        parseFloat(ch.number || ch.id || 0)
      ));
      
      // Check if user has read all available chapters OR read the highest available chapter
      if (readChapters >= totalChapters || highestReadChapter >= highestAvailableChapter) {
        return { status: 'completed', message: 'Up to date' };
      }
    }

    // Alternative check: if manga was recently read and has a high chapter count,
    // check if it might be an ongoing manga that user is caught up with
    const timeSinceLastRead = Date.now() - new Date(manga.lastRead).getTime();
    const isRecentlyRead = timeSinceLastRead < 7 * 24 * 60 * 60 * 1000; // Within 7 days
    
    // If user has read many chapters recently, they might be caught up
    if (isRecentlyRead && manga.chaptersRead.length >= 10) {
      // For manga without complete chapter list, assume caught up if recent and many chapters read
      if (!manga.chapters || manga.chapters.length === 0) {
        return { status: 'completed', message: 'Up to date' };
      }
    }

    return { status: 'reading', nextChapter };
  };

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

  const refreshMangaUpdates = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    console.log('🔄 Starting manga refresh check...');
    
    try {
      // Get mangas that show "Up to date"
      const upToDateMangas = recentManga.filter(manga => {
        const status = getMangaStatus(manga);
        return status.status === 'completed';
      });
      
      console.log(`📚 Found ${upToDateMangas.length} up-to-date mangas to check:`, upToDateMangas.map(m => m.title));
      
      // Check each manga for new chapters
      for (const manga of upToDateMangas) {
        try {
          console.log(`🔍 Checking ${manga.title} for new chapters...`);
          const response = await apiService.getMangaInfo(manga.site, manga.id);
          
          if (response.success && response.data.chapters) {
            const newChapters = response.data.chapters;
            const oldChapters = manga.chapters || [];
            
            // Check if there are new chapters
            const newChapterCount = newChapters.length;
            const oldChapterCount = oldChapters.length;
            
            if (newChapterCount > oldChapterCount) {
              console.log(`✨ Found ${newChapterCount - oldChapterCount} new chapters for ${manga.title}!`);
              
              // Update the manga in library with new chapter data
              const updatedManga = {
                ...manga,
                chapters: newChapters,
                // Keep all other library data intact
              };
              
              // Update existing manga data (this preserves read status)
              updateMangaData(updatedManga);
              
            } else {
              console.log(`📖 No new chapters found for ${manga.title}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error checking ${manga.title}:`, error);
        }
      }
      
      // Refresh the recent manga list to show updated status
      const refreshedRecent = getRecentlyRead(5);
      setRecentManga(refreshedRecent);
      
      console.log('✅ Manga refresh check completed!');
      
    } catch (error) {
      console.error('❌ Error during manga refresh:', error);
    } finally {
      setRefreshing(false);
    }
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
          <div className="flex flex-row gap-4 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-manga-accent/40 scrollbar-track-manga-gray/30 py-2">
            {DEFAULT_MANGA_SITES.map((site) => (
              <div
                key={site.id}
                onClick={() => handleSiteClick(site)}
                className="min-w-[220px] bg-manga-gray rounded-lg p-6 cursor-pointer hover:bg-manga-light transition-colors touch-improvement group flex-shrink-0"
              >
                <img
                  src={site.logo}
                  alt={site.name + ' logo'}
                  className="w-8 h-8 mb-3 rounded"
                  style={{ objectFit: 'contain', background: '#fff' }}
                />
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-manga-text">
                📖 Continue Reading
              </h2>
              <button
                onClick={refreshMangaUpdates}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  refreshing 
                    ? 'bg-manga-light text-manga-text/50 cursor-not-allowed' 
                    : 'bg-manga-accent hover:opacity-90 text-white'
                }`}
              >
                <Icon 
                  name="refresh" 
                  size={16} 
                  className={refreshing ? 'animate-spin' : ''} 
                />
                {refreshing ? 'Checking...' : 'Check for Updates'}
              </button>
            </div>
            <div className="grid gap-4">
              {recentManga.map((manga) => (
                <div
                  key={manga.id}
                  onClick={() => handleRecentMangaClick(manga)}
                  className="bg-manga-gray rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-manga-light transition-colors touch-improvement"
                >
                  <div className="w-16 h-20 bg-manga-light rounded overflow-hidden flex-shrink-0">
                    {manga.coverImage ? (
                      <CachedImage
                        src={manga.coverImage}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('❌ Failed to load cover image:', manga.coverImage);
                        }}
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            <Icon name="book" size={24} />
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        <Icon name="book" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-manga-text truncate">
                      {manga.title}
                    </h3>
                    <p className="text-sm text-manga-text/70 truncate">
                      {(() => {
                        const status = getMangaStatus(manga);
                        if (status.status === 'completed') {
                          return `✅ ${status.message}`;
                        } else if (status.status === 'ongoing') {
                          return `📖 ${status.message}`;
                        } else {
                          return `Next: Chapter ${status.nextChapter}`;
                        }
                      })()}
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
