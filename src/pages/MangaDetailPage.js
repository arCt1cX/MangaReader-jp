import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import apiService from '../services/apiService';
import chapterCache from '../services/cacheService';
import LoadingSpinner from '../components/LoadingSpinner';

const MangaDetailPage = () => {
  const { site, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addManga, removeManga, isMangaInLibrary } = useLibrary();
  
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get manga data from navigation state if available
  const mangaFromState = location.state?.mangaData;
  
  // Track where user came from for smart back navigation
  const referrerPath = location.state?.from;

  const isInLibrary = manga ? isMangaInLibrary(manga.id) : false;

  const loadMangaDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cachedManga = chapterCache.getMangaDetails(site, id);
      if (cachedManga) {
        console.log('📦 Using cached manga details');
        // Use cover image from search results if available and not in cache
        if (mangaFromState?.coverImage && !cachedManga.coverImage) {
          cachedManga.coverImage = mangaFromState.coverImage;
        }
        setManga(cachedManga);
        setLoading(false);
        return;
      }
      
      // Not in cache, fetch from API
      console.log('🌐 Fetching manga details from API');
      const response = await apiService.getMangaInfo(site, id);
      
      if (response.success) {
        const mangaData = response.data;
        
        // Use cover image from search results if available (it's already processed correctly)
        if (mangaFromState?.coverImage) {
          mangaData.coverImage = mangaFromState.coverImage;
          console.log('Using cover image from search results:', mangaData.coverImage);
        }
        
        // Cache the manga details for future use
        chapterCache.setMangaDetails(site, id, mangaData);
        
        setManga(mangaData);
      } else {
        setError(response.error || 'Failed to load manga details');
      }
    } catch (error) {
      console.error('Error loading manga details:', error);
      setError('Failed to load manga details');
    } finally {
      setLoading(false);
    }
  }, [site, id, mangaFromState]);

  useEffect(() => {
    loadMangaDetails();
  }, [loadMangaDetails]);

  const handleLibraryToggle = () => {
    if (isInLibrary) {
      removeManga(manga.id);
    } else {
      addManga(manga);
    }
  };

  const handleBackNavigation = () => {
    // Smart back navigation: try to go to the original page instead of just browser history
    if (referrerPath) {
      // If we know where they came from, go there directly
      navigate(referrerPath);
    } else {
      // If we can detect common patterns, navigate appropriately
      if (document.referrer.includes('/search') || document.referrer.includes('?query=')) {
        navigate('/search');
      } else if (document.referrer.includes('/library')) {
        navigate('/library');
      } else {
        // Default to browser back, but skip if the previous page was a reader page
        const historyLength = window.history.length;
        if (historyLength > 1) {
          navigate(-1);
        } else {
          // Fallback to home if no history
          navigate('/');
        }
      }
    }
  };

  const handleChapterClick = (chapter) => {
    // Pass chapter info through navigation state to avoid URL encoding issues
    navigate(`/reader/${site}/${encodeURIComponent(id)}/${chapter.id || chapter.number}`, {
      state: { 
        chapterUrl: chapter.url,
        chapterData: chapter,
        mangaData: manga, // Pass full manga data for navigation
        from: location.pathname // Track current page for back navigation
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-manga-dark flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-manga-text/70 mt-4">Loading manga details...</p>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-manga-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-xl font-semibold text-manga-text mb-2">
            Error loading manga
          </h3>
          <p className="text-manga-text/70 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-manga-accent hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-manga-dark pb-20">
      {/* Header */}
      <header className="bg-manga-gray shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleBackNavigation}
            className="text-manga-accent hover:text-manga-text transition-colors mb-4"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Manga Info */}
        <div className="bg-manga-gray rounded-lg p-6 mb-6">
          <div className="flex gap-6">
            {/* Cover */}
            <div className="w-32 h-44 bg-manga-light rounded overflow-hidden flex-shrink-0">
              {manga.coverImage ? (
                <img
                  src={manga.coverImage}
                  alt={manga.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  📚
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-manga-text mb-2">
                {manga.title}
              </h1>
              
              {manga.author && (
                <p className="text-manga-text/70 mb-2">by {manga.author}</p>
              )}

              <div className="flex items-center gap-4 mb-4">
                {manga.status && (
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    manga.status.toLowerCase() === 'completed' 
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-blue-900/30 text-blue-400'
                  }`}>
                    {manga.status}
                  </span>
                )}
                
                {manga.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-manga-text">{manga.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {manga.genres && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {manga.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="text-sm bg-manga-light text-manga-text px-2 py-1 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleLibraryToggle}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-colors ${
                    isInLibrary
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-manga-accent hover:bg-blue-600 text-white'
                  }`}
                >
                  {isInLibrary ? '❤️ Remove from Library' : '💝 Add to Library'}
                </button>
                {/* Start from Chapter 1 Button */}
                {manga.chapters && manga.chapters.length > 0 && (
                  <button
                    className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium bg-manga-accent text-white hover:bg-blue-600 transition-colors"
                    onClick={() => handleChapterClick(manga.chapters[manga.chapters.length - 1])}
                  >
                    ▶️ Start from Chapter 1
                  </button>
                )}
              </div>
            </div>
          </div>

          {manga.description && (
            <div className="mt-6 pt-6 border-t border-manga-light">
              <h3 className="font-semibold text-manga-text mb-2">Description</h3>
              <p className="text-manga-text/70 leading-relaxed">
                {manga.description}
              </p>
            </div>
          )}
        </div>

        {/* Chapters List */}
        <div className="bg-manga-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            Chapters ({manga.chapters?.length || 0})
          </h2>
          
          {manga.chapters && manga.chapters.length > 0 ? (
            <div className="space-y-2">
              {manga.chapters.map((chapter) => (
                <div
                  key={chapter.number}
                  onClick={() => handleChapterClick(chapter)}
                  className="flex items-center justify-between p-3 hover:bg-manga-light rounded-lg cursor-pointer transition-colors touch-improvement"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-manga-text">
                      Chapter {chapter.number}
                      {chapter.title && ` - ${chapter.title}`}
                    </h4>
                    {chapter.publishedAt && (
                      <p className="text-sm text-manga-text/70">
                        {new Date(chapter.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-manga-accent">→</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-manga-text/70 text-center py-8">
              No chapters available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MangaDetailPage;
