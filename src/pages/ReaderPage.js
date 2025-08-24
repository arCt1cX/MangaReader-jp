import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const ReaderPage = () => {
  const { site, chapter } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
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
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pages.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickArea = clickX / rect.width;

    if (clickArea < 0.3) {
      goToPrevPage();
    } else if (clickArea > 0.7) {
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
                Page {currentPage + 1} of {pages.length}
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
        <div className="max-w-4xl mx-auto">
          <img
            src={currentPageData.imageUrl}
            alt={`Page ${currentPage + 1}`}
            className="manga-page cursor-pointer select-none"
            onClick={handleImageClick}
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/800x1200/1f2937/f9fafb?text=Page%20${currentPage + 1}%20Error`;
            }}
          />
        </div>
      </div>

      {/* Bottom UI Bar */}
      {showUI && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur z-50 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
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
                  {currentPage + 1} / {pages.length}
                </span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === pages.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Touch Areas for Mobile */}
      <div className="fixed inset-0 flex pointer-events-none">
        <div 
          className="w-1/3 h-full pointer-events-auto"
          onClick={goToPrevPage}
        ></div>
        <div 
          className="w-1/3 h-full pointer-events-auto"
          onClick={() => setShowUI(!showUI)}
        ></div>
        <div 
          className="w-1/3 h-full pointer-events-auto"
          onClick={goToNextPage}
        ></div>
      </div>
    </div>
  );
};

export default ReaderPage;
