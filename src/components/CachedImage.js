import React, { useState, useEffect } from 'react';
import imageCacheService from '../services/imageCacheService';

const CachedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = null, 
  onLoad = null, 
  onError = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    // Get cached version of the image URL
    const cachedUrl = imageCacheService.getCachedImageUrl(src);
    console.log('CachedImage: Original URL:', src);
    console.log('CachedImage: Cached URL:', cachedUrl);
    setImageSrc(cachedUrl);
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  const handleImageLoad = (e) => {
    setIsLoading(false);
    setImageError(false);
    
    // Mark image as successfully cached
    if (src) {
      imageCacheService.markAsCached(src);
    }
    
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleImageError = (e) => {
    console.error('CachedImage: Image failed to load:', {
      originalSrc: src,
      imageSrc: imageSrc,
      error: e
    });
    setIsLoading(false);
    setImageError(true);
    
    // Try fallback image if provided
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      console.log('CachedImage: Trying fallback:', fallbackSrc);
      setImageSrc(fallbackSrc);
      return;
    }
    
    if (onError) {
      onError(e);
    }
  };

  if (!src) {
    return (
      <div className={`bg-gray-300 flex items-center justify-center ${className}`} {...props}>
        <span className="text-gray-500 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {imageError ? (
        <div className={`bg-gray-300 flex items-center justify-center ${className}`} {...props}>
          <span className="text-gray-500 text-sm">Image Error</span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: isLoading ? 'none' : 'block' }}
          {...props}
        />
      )}
    </div>
  );
};

export default CachedImage;
