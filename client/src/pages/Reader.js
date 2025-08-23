import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useHotkeys } from 'react-hotkeys-hook';
import { getChapterImages, getChapters, getProxiedImageUrl } from '../utils/api';
import { useLibrary } from '../contexts/LibraryContext';
import { useJapanese } from '../contexts/JapaneseContext';
import JapaneseTextPopup from '../components/JapaneseTextPopup';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Reader() {
  const { site, mangaId, chapterId } = useParams();
  const navigate = useNavigate();
  const { updateProgress } = useLibrary();
  const { isJapaneseMode, tokenizer } = useJapanese();
  
  const [images, setImages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [selectedText, setSelectedText] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
  const imageRefs = useRef([]);

  const loadChapter = useCallback(async () => {
    if (!chapterId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getChapterImages(site, chapterId);
      setImages(data.images);
      setCurrentPage(0);
      
      // Update reading progress
      updateProgress(mangaId, site, chapterId);
    } catch (err) {
      setError('Failed to load chapter');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [site, chapterId, updateProgress, mangaId]);

  const loadChapters = useCallback(async () => {
    try {
      const data = await getChapters(site, mangaId);
      setChapters(data.chapters);
    } catch (err) {
      console.error('Failed to load chapters:', err);
    }
  }, [site, mangaId]);

  useEffect(() => {
    loadChapter();
    loadChapters();
  }, [loadChapter, loadChapters]);

  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < images.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      nextChapter();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else {
      prevChapter();
    }
  };

  const nextChapter = () => {
    const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      navigate(`/reader/${site}/${mangaId}/${nextChapter.id}`);
    }
  };

  const prevChapter = () => {
    const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      navigate(`/reader/${site}/${mangaId}/${prevChapter.id}`);
    }
  };

  const handleImageClick = async (event) => {
    if (!isJapaneseMode || !tokenizer) return;

    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setPopupPosition({ x: event.clientX, y: event.clientY });
    setSelectedText({ loading: true, x, y });

    try {
      // This would be implemented with OCR for the clicked area
      // For now, showing a placeholder
      setSelectedText({
        text: 'こんにちは',
        translation: 'Hello',
        x,
        y
      });
    } catch (error) {
      console.error('Failed to process text:', error);
      setSelectedText(null);
    }
  };

  // Keyboard controls
  useHotkeys('left', prevPage);
  useHotkeys('right', nextPage);
  useHotkeys('escape', () => navigate(-1));

  // Touch controls
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextPage,
    onSwipedRight: prevPage,
    trackMouse: true
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-mode min-h-screen bg-black relative" {...swipeHandlers}>
      {/* Controls Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm transition-transform ${
        showControls ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            ← Back
          </button>
          <div className="text-white text-sm">
            Page {currentPage + 1} of {images.length}
          </div>
          <div className="flex items-center space-x-2">
            {isJapaneseMode && (
              <span className="text-green-400 text-xs">JP Mode</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {images[currentPage] && (
          <img
            ref={el => imageRefs.current[currentPage] = el}
            src={getProxiedImageUrl(images[currentPage].url)}
            alt={`Page ${currentPage + 1}`}
            className="reader-image max-h-screen cursor-pointer"
            onClick={isJapaneseMode ? handleImageClick : () => setShowControls(!showControls)}
            onLoad={() => setShowControls(true)}
          />
        )}
      </div>

      {/* Navigation Areas */}
      <div className="fixed inset-0 flex">
        <div className="w-1/3 h-full" onClick={prevPage} />
        <div className="w-1/3 h-full" onClick={() => setShowControls(!showControls)} />
        <div className="w-1/3 h-full" onClick={nextPage} />
      </div>

      {/* Page Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm transition-transform ${
        showControls ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={prevChapter}
            disabled={chapters.findIndex(ch => ch.id === chapterId) === 0}
            className="text-white hover:text-gray-300 disabled:text-gray-600 transition-colors"
          >
            ← Prev Chapter
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 px-3 py-1 rounded text-white transition-colors"
            >
              ←
            </button>
            <span className="text-white text-sm min-w-[100px] text-center">
              {currentPage + 1} / {images.length}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === images.length - 1}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 px-3 py-1 rounded text-white transition-colors"
            >
              →
            </button>
          </div>

          <button
            onClick={nextChapter}
            disabled={chapters.findIndex(ch => ch.id === chapterId) === chapters.length - 1}
            className="text-white hover:text-gray-300 disabled:text-gray-600 transition-colors"
          >
            Next Chapter →
          </button>
        </div>
      </div>

      {/* Japanese Text Popup */}
      {selectedText && (
        <JapaneseTextPopup
          text={selectedText}
          position={popupPosition}
          onClose={() => setSelectedText(null)}
        />
      )}
    </div>
  );
}
