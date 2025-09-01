import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useLibrary } from '../contexts/LibraryContext';
import apiService from '../services/apiService';
import chapterCache from '../services/cacheService';
import LoadingSpinner from '../components/LoadingSpinner';

const ReaderPage = () => {
  const { site, id, chapter } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const { markChapterRead, markPreviousChaptersRead, isMangaInLibrary } = useLibrary();
  
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const [contentFormat, setContentFormat] = useState(null); // 'manga' or 'manhwa'

  // Get chapter URL from navigation state if available
  const chapterUrl = location.state?.chapterUrl;
  const chapterData = location.state?.chapterData;
  const mangaData = location.state?.mangaData;

  // Helper function to get image styles based on zoom settings
  const getImageStyles = (isDoublePageMode = false) => {
    if (settings.zoom.fitToWidth) {
      // When zoom control is enabled, use the zoom percentage
      const zoomPercentage = isDoublePageMode 
        ? Math.floor(settings.zoom.defaultZoom / 2) // Split for double page
        : settings.zoom.defaultZoom;
      
      return {
        width: `${zoomPercentage}%`,
        maxWidth: `${zoomPercentage}%`,
        height: 'auto',
        display: 'block',
        margin: '0 auto'
      };
    } else {
      // When zoom control is disabled, use natural image size
      return {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        display: 'block',
        margin: '0 auto'
      };
    }
  };

  // Get page spacing styles
  const getPageSpacingStyle = () => {
    return { marginBottom: `${settings.pageSpacing * 8}px` }; // 0-80px spacing
  };

  // Find next chapter for navigation
  const getNextChapter = () => {
    if (!mangaData?.chapters || !chapterData) return null;
    
    const currentChapterIndex = mangaData.chapters.findIndex(
      ch => (ch.id || ch.number) === (chapterData.id || chapterData.number)
    );
    
    // Chapters are ordered with latest first, so next chapter has a lower index
    if (currentChapterIndex > 0) {
      return mangaData.chapters[currentChapterIndex - 1];
    }
    
    return null;
  };

  const nextChapter = getNextChapter();

  const goToNextChapter = () => {
    if (nextChapter) {
      // Mark current chapter as read if manga is in library
      const mangaId = mangaData?.id || id;
      if (isMangaInLibrary(mangaId)) {
        // Get the current chapter number from chapterData or find it in mangaData
        let currentChapterNum;
        if (chapterData?.number) {
          currentChapterNum = parseFloat(chapterData.number);
        } else if (chapterData?.id) {
          currentChapterNum = parseFloat(chapterData.id);
        } else {
          // Fallback: find current chapter in manga chapters list
          const currentChapter = mangaData?.chapters?.find(ch => 
            ch.id === chapter || ch.number === chapter || 
            ch.id === parseFloat(chapter) || ch.number === parseFloat(chapter)
          );
          currentChapterNum = parseFloat(currentChapter?.number || currentChapter?.id || chapter);
        }
        
        markChapterRead(mangaId, currentChapterNum);

        // Mark all previous chapters as read when marking this one as read
        if (mangaData.chapters && mangaData.chapters.length > 1) {
          markPreviousChaptersRead(mangaId, currentChapterNum, mangaData.chapters);
        }
      }
      
      // Explicitly reset to first page before navigation
      setCurrentPage(0);
      
      navigate(`/reader/${site}/${encodeURIComponent(mangaId)}/${encodeURIComponent(nextChapter.id || nextChapter.number)}`, {
        state: { 
          chapterUrl: nextChapter.url,
          chapterData: nextChapter,
          mangaData: mangaData,
          from: location.state?.from, // Preserve the original referrer
          resetToFirstPage: true // Flag to ensure we reset to first page
        }
      });
    }
  };

  const goToMangaDetails = () => {
    // Navigate directly to manga details page instead of going back in history
    const mangaId = mangaData?.id || id; // fallback to URL param if no manga data
    navigate(`/manga/${site}/${encodeURIComponent(mangaId)}`, {
      state: {
        mangaData: mangaData,
        from: location.state?.from // Preserve the original referrer
      }
    });
  };

  const loadChapterPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ALWAYS reset to first page when loading any chapter
      setCurrentPage(0);
      
      // Use chapter URL from navigation state if available, otherwise fall back to chapter ID
      let chapterIdentifier = chapterUrl || chapter;
      
      // If chapterIdentifier is a full URL, extract just the chapter ID part
      if (chapterIdentifier && chapterIdentifier.startsWith('http')) {
        // Extract chapter ID from URL
        const urlMatch = chapterIdentifier.match(/\/manga\/(.+)/);
        if (urlMatch) {
          chapterIdentifier = urlMatch[1];
          console.log(`Extracted chapter ID from URL: ${chapterIdentifier}`);
        }
      }
      
      // Check cache first
      const cachedData = chapterCache.get(id, chapter);
      if (cachedData && cachedData.pages) {
        setPages(cachedData.pages);
        setContentFormat(cachedData.format || 'manga'); // Set format from cache
        setLoading(false);
        return;
      }
      
      // Not in cache, fetch from API
      const response = await apiService.getChapterImages(chapterIdentifier, site);
      
      if (response.success) {
        setPages(response.data.pages);
        setContentFormat(response.data.format || 'manga'); // Set format from API response
        // Cache the response for future use
        chapterCache.set(id, chapter, response.data);
      } else {
        setError(response.error || 'Failed to load chapter pages');
      }
    } catch (err) {
      console.error('Error loading chapter pages:', err);
      setError('Failed to load chapter pages');
    } finally {
      setLoading(false);
    }
  }, [site, id, chapter, chapterUrl]);

  useEffect(() => {
    loadChapterPages();
  }, [loadChapterPages]);


  useEffect(() => {
    // Auto-hide UI after 3 seconds
    const timer = setTimeout(() => setShowUI(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Clean up expired cache entries periodically
    const cleanup = setInterval(() => {
      chapterCache.clearExpired();
    }, 5 * 60 * 1000); // Clean every 5 minutes
    
    return () => clearInterval(cleanup);
  }, []);

  // Auto-mark last chapter as read when entering it
  useEffect(() => {
    if (!chapterData || !mangaData || !isMangaInLibrary(mangaData.id)) {
      return;
    }

    // Get the current chapter number
    let currentChapterNum;
    if (chapterData?.number) {
      currentChapterNum = parseFloat(chapterData.number);
    } else if (chapterData?.id) {
      currentChapterNum = parseFloat(chapterData.id);
    } else {
      // Fallback: find current chapter in manga chapters list
      const currentChapter = mangaData?.chapters?.find(ch => 
        ch.id === chapter || ch.number === chapter || 
        ch.id === parseFloat(chapter) || ch.number === parseFloat(chapter)
      );
      currentChapterNum = parseFloat(currentChapter?.number || currentChapter?.id || chapter);
    }

    // Check if this is the last chapter (highest numbered chapter)
    if (mangaData?.chapters && mangaData.chapters.length > 0) {
      const maxChapterNum = Math.max(...mangaData.chapters.map(ch => parseFloat(ch.number || ch.id || 0)));
      
      if (currentChapterNum >= maxChapterNum) {
        // This is the last chapter - mark it as read immediately
        markChapterRead(mangaData.id, currentChapterNum);

        // Mark all previous chapters as read as well
        markPreviousChaptersRead(mangaData.id, currentChapterNum, mangaData.chapters);
      }
    }
  }, [chapterData, mangaData, markChapterRead, markPreviousChaptersRead, isMangaInLibrary, chapter]);

  const goToNextPage = useCallback(() => {
    // Force scroll mode for manhwa content
    const effectiveReadingMode = contentFormat === 'manhwa' ? 'scroll' : settings.readingMode;
    
    if (effectiveReadingMode === 'double') {
      // In double page mode, advance by 2 pages unless at the end
      const nextPage = currentPage + 2;
      if (nextPage < pages.length) {
        setCurrentPage(nextPage);
      } else if (currentPage + 1 < pages.length) {
        setCurrentPage(currentPage + 1);
      }
    } else if (effectiveReadingMode === 'scroll') {
      // In scroll mode, scroll down instead of changing page
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    } else {
      // Single page mode
      if (currentPage < pages.length - 1) {
        setCurrentPage(currentPage + 1);
      }
    }
  }, [currentPage, pages.length, settings.readingMode, contentFormat]);

  const goToPrevPage = useCallback(() => {
    // Force scroll mode for manhwa content
    const effectiveReadingMode = contentFormat === 'manhwa' ? 'scroll' : settings.readingMode;
    
    if (effectiveReadingMode === 'double') {
      // In double page mode, go back by 2 pages unless at the beginning
      const prevPage = currentPage - 2;
      if (prevPage >= 0) {
        setCurrentPage(prevPage);
      } else if (currentPage > 0) {
        setCurrentPage(0);
      }
    } else if (effectiveReadingMode === 'scroll') {
      // In scroll mode, scroll up instead of changing page
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    } else {
      // Single page mode
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  }, [currentPage, settings.readingMode, contentFormat]);

  const handleImageClick = (e) => {
    // Force scroll mode for manhwa content
    const effectiveReadingMode = contentFormat === 'manhwa' ? 'scroll' : settings.readingMode;
    
    if (effectiveReadingMode === 'scroll') {
      // In scroll mode, just toggle UI
      setShowUI(!showUI);
      return;
    }

    if (!settings.navigation?.tapToTurn) {
      setShowUI(!showUI);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickArea = clickX / rect.width;

    const tapZones = settings.navigation?.tapZones || { left: 30, right: 30, center: 40 };
    const leftZone = tapZones.left / 100;
    const rightZone = 1 - (tapZones.right / 100);

    if (clickArea < leftZone) {
      goToPrevPage();
    } else if (clickArea > rightZone) {
      goToNextPage();
    } else {
      setShowUI(!showUI);
    }
  };

  const handleKeyPress = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
        goToPrevPage();
        break;
      case 'ArrowRight':
        goToNextPage();
        break;
      case 'Escape':
        navigate(-1);
        break;
      default:
        break;
    }
  }, [goToPrevPage, goToNextPage, navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-white/70 mt-4">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-xl font-semibold mb-2">Error loading chapter</h3>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={goToMangaDetails}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Top UI Bar */}
      {showUI && (
        <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur z-50 p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={goToMangaDetails}
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="text-center">
              <h1 className="font-semibold">
                {chapterData ? 
                  `Chapter ${chapterData.number}${chapterData.title ? ` - ${chapterData.title}` : ''}` : 
                  `Chapter ${chapter}`
                }
              </h1>
              <p className="text-sm text-white/70">
                {(contentFormat === 'manhwa' || settings.readingMode === 'scroll')
                  ? `${pages.length} pages (${contentFormat === 'manhwa' ? 'Manhwa - ' : ''}Continuous Scroll)`
                  : settings.readingMode === 'double' && currentPage + 1 < pages.length
                    ? `Pages ${currentPage + 1}-${Math.min(currentPage + 2, pages.length)} of ${pages.length}`
                    : `Page ${currentPage + 1} of ${pages.length}`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {nextChapter && (
                <button
                  onClick={goToNextChapter}
                  className="text-white/70 hover:text-white transition-colors text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
                >
                  Next →
                </button>
              )}
              <button
                onClick={() => setShowUI(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {(contentFormat === 'manhwa' || settings.readingMode === 'scroll') ? (
          // Continuous Scroll Mode (forced for manhwa)
          <div className="max-w-4xl mx-auto">
            {contentFormat === 'manhwa' && (
              <div className="text-center mb-6 p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm">
                  📖 This is a manhwa (Korean webtoon) - optimized for vertical scrolling
                </p>
              </div>
            )}
            {pages.map((page, index) => (
              <div 
                key={index} 
                className="flex justify-center"
                style={index < pages.length - 1 ? getPageSpacingStyle() : {}}
              >
                <img
                  src={page.url}
                  alt={`Page ${index + 1}`}
                  className="manga-page cursor-pointer select-none max-w-full h-auto"
                  onClick={() => setShowUI(!showUI)}
                  crossOrigin="anonymous"
                  style={getImageStyles()}
                  onError={(e) => {
                    if (!e.target.dataset.errorHandled) {
                      e.target.dataset.errorHandled = 'true';
                      e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
                          <rect width="100%" height="100%" fill="#1f2937"/>
                          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#f9fafb" text-anchor="middle" alignment-baseline="middle">
                            Page ${index + 1} Error
                          </text>
                        </svg>
                      `);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        ) : settings.readingMode === 'double' ? (
          // Double Page Mode
          <div 
            className="max-w-6xl mx-auto flex justify-center"
            style={{ gap: `${settings.pageSpacing * 4}px` }}
          >
            {currentPage < pages.length && (
              <img
                src={pages[currentPage].url}
                alt={`Page ${currentPage + 1}`}
                className="manga-page cursor-pointer select-none"
                onClick={handleImageClick}
                crossOrigin="anonymous"
                style={getImageStyles(true)}
                onError={(e) => {
                  if (!e.target.dataset.errorHandled) {
                    e.target.dataset.errorHandled = 'true';
                    e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
                        <rect width="100%" height="100%" fill="#1f2937"/>
                        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#f9fafb" text-anchor="middle" alignment-baseline="middle">
                          Page ${currentPage + 1} Error
                        </text>
                      </svg>
                    `);
                  }
                }}
              />
            )}
            {currentPage + 1 < pages.length && (
              <img
                src={pages[currentPage + 1].url}
                alt={`Page ${currentPage + 2}`}
                className="manga-page cursor-pointer select-none"
                onClick={handleImageClick}
                crossOrigin="anonymous"
                style={getImageStyles(true)}
                onError={(e) => {
                  if (!e.target.dataset.errorHandled) {
                    e.target.dataset.errorHandled = 'true';
                    e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
                        <rect width="100%" height="100%" fill="#1f2937"/>
                        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#f9fafb" text-anchor="middle" alignment-baseline="middle">
                          Page ${currentPage + 2} Error
                        </text>
                      </svg>
                    `);
                  }
                }}
              />
            )}
          </div>
        ) : (
          // Single Page Mode
          <div className="max-w-4xl mx-auto">
            <img
              src={currentPageData.url}
              alt={`Page ${currentPage + 1}`}
              className="manga-page cursor-pointer select-none"
              onClick={handleImageClick}
              crossOrigin="anonymous"
              style={getImageStyles()}
              onError={(e) => {
                if (!e.target.dataset.errorHandled) {
                  e.target.dataset.errorHandled = 'true';
                  e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
                      <rect width="100%" height="100%" fill="#1f2937"/>
                      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#f9fafb" text-anchor="middle" alignment-baseline="middle">
                        Page ${currentPage + 1} Error
                      </text>
                    </svg>
                  `);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Next Chapter Button - Show at end of chapter */}
      {((contentFormat === 'manhwa' || settings.readingMode === 'scroll') || 
        (settings.readingMode === 'single' && currentPage === pages.length - 1) ||
        (settings.readingMode === 'double' && currentPage >= pages.length - 2)
       ) && (
        <div className="flex flex-col items-center py-8 bg-black border-t border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Chapter Complete!</h2>
            <p className="text-white/70">
              {chapterData ? 
                `You've finished Chapter ${chapterData.number}` : 
                'You\'ve reached the end of this chapter'
              }
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={goToMangaDetails}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ← Back to Chapters
            </button>
            
            {nextChapter ? (
              <button
                onClick={goToNextChapter}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <span>Next: Chapter {nextChapter.number}</span>
                <span>→</span>
              </button>
            ) : (
              <div className="px-6 py-3 bg-gray-800 text-gray-400 rounded-lg">
                No more chapters available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom UI Bar */}
      {showUI && (contentFormat !== 'manhwa' && settings.readingMode !== 'scroll') && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur z-50 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ 
                  width: settings.readingMode === 'double' 
                    ? `${Math.min(((currentPage + 2) / pages.length) * 100, 100)}%`
                    : `${((currentPage + 1) / pages.length) * 100}%` 
                }}
              ></div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowUI(!showUI)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Japanese Helper
                </button>
                <span className="text-sm text-white/70">
                  {settings.readingMode === 'double' && currentPage + 1 < pages.length
                    ? `${currentPage + 1}-${Math.min(currentPage + 2, pages.length)} / ${pages.length}`
                    : `${currentPage + 1} / ${pages.length}`
                  }
                </span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={
                  settings.readingMode === 'double' 
                    ? currentPage >= pages.length - 1
                    : currentPage === pages.length - 1
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Touch Areas for Mobile - only for non-scroll modes */}
      {(contentFormat !== 'manhwa' && settings.readingMode !== 'scroll') && settings.navigation?.swipeEnabled && (
        <div className="fixed inset-0 flex pointer-events-none">
          <div 
            className="pointer-events-auto"
            style={{ width: `${settings.navigation?.tapZones?.left || 30}%` }}
            onClick={goToPrevPage}
          ></div>
          <div 
            className="pointer-events-auto"
            style={{ width: `${settings.navigation?.tapZones?.center || 40}%` }}
            onClick={() => setShowUI(!showUI)}
          ></div>
          <div 
            className="pointer-events-auto"
            style={{ width: `${settings.navigation?.tapZones?.right || 30}%` }}
            onClick={goToNextPage}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
