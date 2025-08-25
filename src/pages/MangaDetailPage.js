import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import apiService from '../services/apiService';
import chapterCache from '../services/cacheService';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/Icon';

const MangaDetailPage = () => {
  const { site, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addManga, removeManga, isMangaInLibrary, isChapterRead, getNextUnreadChapter } = useLibrary();
  
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
    console.log('🔙 Back button clicked - referrerPath:', referrerPath);
    console.log('🔙 location.state:', location.state);
    
    // Smart back navigation: try to go to the original page instead of just browser history
    if (referrerPath) {
      // If we know where they came from, go there directly
      console.log('🔙 Navigating to referrerPath:', referrerPath);
      navigate(referrerPath);
    } else {
      // If we can detect common patterns, navigate appropriately
      console.log('🔙 No referrerPath, checking document.referrer:', document.referrer);
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
        from: referrerPath || location.state?.from // Preserve the original referrer, don't overwrite it
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
            className="bg-manga-accent hover:opacity-90 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
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
            className="flex items-center justify-center w-12 h-12 bg-manga-light text-manga-text hover:bg-manga-accent hover:text-white rounded-full transition-all duration-200 shadow-lg"
            aria-label="Go back"
          >
            <Icon name="arrowLeft" size={20} />
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
                      : 'bg-manga-accent/20 text-manga-accent'
                  }`}>
                    {manga.status}
                  </span>
                )}
                
                {manga.rating && (
                  <div className="flex items-center gap-1">
                    <Icon name="starFilled" size={16} color="#fbbf24" />
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
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center ${
                    isInLibrary
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-manga-accent hover:opacity-90 text-white'
                  }`}
                >
                  <Icon name={isInLibrary ? "heartFilled" : "heart"} size={16} />
                  {isInLibrary ? 'Remove from Library' : 'Add to Library'}
                </button>
                {/* Continue Reading / Start from Chapter 1 Button */}
                {manga.chapters && manga.chapters.length > 0 && (() => {
                  const nextChapter = isInLibrary 
                    ? getNextUnreadChapter(manga.id, manga.chapters)
                    : manga.chapters[manga.chapters.length - 1]; // First chapter (sorted last in the array)
                  
                  const isFirstChapter = nextChapter === manga.chapters[manga.chapters.length - 1];
                  const chapterNum = parseFloat(nextChapter?.number || nextChapter?.id);
                  
                  return (
                    <button
                      className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium bg-manga-accent text-white hover:opacity-90 transition-all duration-200 flex items-center gap-2 justify-center"
                      onClick={() => handleChapterClick(nextChapter)}
                    >
                      <Icon name="play" size={16} />
                      {isInLibrary && !isFirstChapter 
                        ? `Continue from Chapter ${chapterNum}`
                        : 'Start from Chapter 1'
                      }
                    </button>
                  );
                })()}
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
              {manga.chapters.map((chapter) => {
                const chapterNum = parseFloat(chapter.number || chapter.id);
                const isRead = isInLibrary && isChapterRead(manga.id, chapterNum);
                
                return (
                  <div
                    key={chapter.number}
                    onClick={() => handleChapterClick(chapter)}
                    className={`flex items-center justify-between p-3 hover:bg-manga-light rounded-lg cursor-pointer transition-colors touch-improvement ${
                      isRead ? 'bg-manga-accent/10 border-l-4 border-manga-accent' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${isRead ? 'text-manga-accent' : 'text-manga-text'}`}>
                          Chapter {chapter.number}
                          {chapter.title && ` - ${chapter.title}`}
                        </h4>
                        {isRead && (
                          <Icon name="check" size={16} color="var(--accent)" />
                        )}
                      </div>
                      {chapter.publishedAt && (
                        <p className="text-sm text-manga-text/70">
                          {new Date(chapter.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className={`${isRead ? 'text-manga-accent' : 'text-manga-accent'}`}>
                      <Icon name="arrowRight" size={16} />
                    </div>
                  </div>
                );
              })}
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
