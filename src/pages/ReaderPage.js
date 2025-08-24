import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const ReaderPage = () => {
  const { site, chapter } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUI, setShowUI] = useState(true);

  // Get chapter URL from navigation state if available
  const chapterUrl = location.state?.chapterUrl;

  const loadChapterPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use chapter URL from navigation state if available, otherwise fall back to chapter ID
      const chapterIdentifier = chapterUrl || chapter;
      console.log('Loading chapter with identifier:', chapterIdentifier);
      console.log('Site:', site);
      
      const response = await apiService.getChapterImages(chapterIdentifier, site);
      
      if (response.success) {
        setPages(response.data.pages);
      } else {
        setError(response.error || 'Failed to load chapter pages');
      }
    } catch (err) {
      console.error('Error loading chapter pages:', err);
      setError('Failed to load chapter pages');
    } finally {
      setLoading(false);
    }
  }, [site, chapter, chapterUrl]);

  useEffect(() => {
    loadChapterPages();
  }, [loadChapterPages]);

  useEffect(() => {
    // Auto-hide UI after 3 seconds
    const timer = setTimeout(() => setShowUI(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const goToNextPage = useCallback(() => {
    if (settings.readingMode === 'double') {
      // In double page mode, advance by 2 pages unless at the end
      const nextPage = currentPage + 2;
      if (nextPage < pages.length) {
        setCurrentPage(nextPage);
      } else if (currentPage + 1 < pages.length) {
        setCurrentPage(currentPage + 1);
      }
    } else if (settings.readingMode === 'scroll') {
      // In scroll mode, scroll down instead of changing page
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    } else {
      // Single page mode
      if (currentPage < pages.length - 1) {
        setCurrentPage(currentPage + 1);
      }
    }
  }, [currentPage, pages.length, settings.readingMode]);

  const goToPrevPage = useCallback(() => {
    if (settings.readingMode === 'double') {
      // In double page mode, go back by 2 pages unless at the beginning
      const prevPage = currentPage - 2;
      if (prevPage >= 0) {
        setCurrentPage(prevPage);
      } else if (currentPage > 0) {
        setCurrentPage(0);
      }
    } else if (settings.readingMode === 'scroll') {
      // In scroll mode, scroll up instead of changing page
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    } else {
      // Single page mode
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  }, [currentPage, settings.readingMode]);

  const handleImageClick = (e) => {
    if (settings.readingMode === 'scroll') {
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
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  // Debug: log current page data
  if (currentPageData) {
    console.log('Current page data:', currentPageData);
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Top UI Bar */}
      {showUI && (
        <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur z-50 p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="text-center">
              <h1 className="font-semibold">Chapter {chapter}</h1>
              <p className="text-sm text-white/70">
                {settings.readingMode === 'scroll' 
                  ? `${pages.length} pages (Continuous Scroll)`
                  : settings.readingMode === 'double' && currentPage + 1 < pages.length
                    ? `Pages ${currentPage + 1}-${Math.min(currentPage + 2, pages.length)} of ${pages.length}`
                    : `Page ${currentPage + 1} of ${pages.length}`
                }
              </p>
            </div>
            <button
              onClick={() => setShowUI(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {settings.readingMode === 'scroll' ? (
          // Continuous Scroll Mode
          <div className="max-w-4xl mx-auto space-y-4">
            {pages.map((page, index) => (
              <div key={index} className="flex justify-center">
                <img
                  src={page.url}
                  alt={`Page ${index + 1}`}
                  className="manga-page cursor-pointer select-none max-w-full h-auto"
                  onClick={() => setShowUI(!showUI)}
                  crossOrigin="anonymous"
                  style={{
                    width: settings.zoom.fitToWidth ? '100%' : 'auto',
                    maxWidth: settings.zoom.fitToWidth ? '100%' : `${settings.zoom.defaultZoom}%`
                  }}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/800x1200/1f2937/f9fafb?text=Page%20${index + 1}%20Error`;
                  }}
                />
              </div>
            ))}
          </div>
        ) : settings.readingMode === 'double' ? (
          // Double Page Mode
          <div className="max-w-6xl mx-auto flex gap-4 justify-center">
            {currentPage < pages.length && (
              <img
                src={pages[currentPage].url}
                alt={`Page ${currentPage + 1}`}
                className="manga-page cursor-pointer select-none"
                onClick={handleImageClick}
                crossOrigin="anonymous"
                style={{
                  width: settings.zoom.fitToWidth ? '48%' : 'auto',
                  maxWidth: settings.zoom.fitToWidth ? '48%' : `${settings.zoom.defaultZoom}%`
                }}
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/800x1200/1f2937/f9fafb?text=Page%20${currentPage + 1}%20Error`;
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
                style={{
                  width: settings.zoom.fitToWidth ? '48%' : 'auto',
                  maxWidth: settings.zoom.fitToWidth ? '48%' : `${settings.zoom.defaultZoom}%`
                }}
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/800x1200/1f2937/f9fafb?text=Page%20${currentPage + 2}%20Error`;
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
              style={{
                width: settings.zoom.fitToWidth ? '100%' : 'auto',
                maxWidth: settings.zoom.fitToWidth ? '100%' : `${settings.zoom.defaultZoom}%`
              }}
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/800x1200/1f2937/f9fafb?text=Page%20${currentPage + 1}%20Error`;
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom UI Bar */}
      {showUI && settings.readingMode !== 'scroll' && (
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
      {settings.readingMode !== 'scroll' && settings.navigation?.swipeEnabled && (
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
