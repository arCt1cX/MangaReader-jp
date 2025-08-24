import React, { useState } from 'react';
import { useLibrary } from '../contexts/LibraryContext';

const MangaCard = ({ manga, onClick, showProgress = false }) => {
  const { isMangaInLibrary, getMangaProgress } = useLibrary();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const isInLibrary = isMangaInLibrary(manga.id);
  const progress = getMangaProgress(manga.id);

  const handleImageError = (e) => {
    console.log('Image failed to load:', manga.coverImage, e);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div
      onClick={onClick}
      className="bg-manga-gray rounded-lg overflow-hidden cursor-pointer hover:bg-manga-light transition-colors touch-improvement group"
    >
      {/* Cover Image */}
      <div className="aspect-[3/4] bg-manga-light relative overflow-hidden">
        {manga.coverImage && !imageError ? (
          <>
            {imageLoading && (
              <div className="w-full h-full flex items-center justify-center text-4xl text-manga-text/50 animate-pulse">
                📚
              </div>
            )}
            <img
              src={manga.coverImage}
              alt={manga.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-manga-text/50">
            📚
          </div>
        )}
        
        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && imageError && manga.coverImage && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 opacity-80">
            IMG ERROR: {manga.coverImage.substring(0, 40)}...
          </div>
        )}
        
        {/* Library Indicator */}
        {isInLibrary && (
          <div className="absolute top-2 right-2 bg-manga-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            ✓
          </div>
        )}

        {/* Progress Indicator */}
        {showProgress && progress && progress.currentChapter && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Ch. {progress.currentChapter}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-manga-text line-clamp-2 group-hover:text-manga-accent transition-colors">
          {manga.title}
        </h3>
        
        {manga.author && (
          <p className="text-xs text-manga-text/70 mt-1 truncate">
            by {manga.author}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {manga.status && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              manga.status.toLowerCase() === 'completed' 
                ? 'bg-green-900/30 text-green-400'
                : manga.status.toLowerCase() === 'ongoing'
                ? 'bg-blue-900/30 text-blue-400'
                : 'bg-gray-900/30 text-gray-400'
            }`}>
              {manga.status}
            </span>
          )}

          {manga.chaptersCount && (
            <span className="text-xs text-manga-text/70">
              {manga.chaptersCount} chapters
            </span>
          )}
        </div>

        {/* Rating */}
        {manga.rating && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-xs text-manga-text/70">
              {manga.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Genres */}
        {manga.genres && manga.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {manga.genres.slice(0, 2).map((genre, index) => (
              <span
                key={index}
                className="text-xs bg-manga-light text-manga-text/70 px-2 py-1 rounded"
              >
                {genre}
              </span>
            ))}
            {manga.genres.length > 2 && (
              <span className="text-xs text-manga-text/50">
                +{manga.genres.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Reading Progress */}
        {showProgress && progress && (
          <div className="mt-2 pt-2 border-t border-manga-light">
            <div className="flex justify-between items-center text-xs text-manga-text/70">
              <span>
                Chapter {progress.currentChapter || 1}
                {progress.currentPage && ` • Page ${progress.currentPage}`}
              </span>
              {progress.lastRead && (
                <span>
                  {new Date(progress.lastRead).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaCard;
