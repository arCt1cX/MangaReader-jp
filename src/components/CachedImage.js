import React, { useState, useEffect } from 'react';
import imageCache from '../services/imageCacheService';

const CachedImage = ({ 
  src, 
  alt, 
  className = '', 
  onLoad, 
  onError,
  fallback = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setError(true);
      return;
    }

    let isMounted = true;
    let blobUrlToCleanup = null;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(false);

        // Try to get from cache first
        const cachedUrl = await imageCache.get(src);
        
        if (cachedUrl && isMounted) {
          setImageSrc(cachedUrl);
          blobUrlToCleanup = cachedUrl;
          setIsLoading(false);
          return;
        }

        // If not cached, download and cache it
        const newCachedUrl = await imageCache.cacheImage(src);
        
        if (newCachedUrl && isMounted) {
          setImageSrc(newCachedUrl);
          blobUrlToCleanup = newCachedUrl;
        } else if (isMounted) {
          // Fallback to original URL if caching fails
          setImageSrc(src);
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('CachedImage error:', err);
        if (isMounted) {
          setImageSrc(src); // Fallback to original URL
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      // Clean up blob URLs to prevent memory leaks
      if (blobUrlToCleanup && blobUrlToCleanup.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlToCleanup);
      }
    };
  }, [src]); // Only depend on src, not imageSrc

  const handleLoad = (e) => {
    setIsLoading(false);
    setError(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setError(true);
    if (onError) onError(e);
  };

  if (error && fallback) {
    return fallback;
  }

  if (error || !imageSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <span className="text-gray-400 text-2xl">📚</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default CachedImage;
