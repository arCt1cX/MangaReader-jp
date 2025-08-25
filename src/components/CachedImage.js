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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Try to get from cache first
        const cachedUrl = await imageCache.get(src);
        
        if (cachedUrl && isMounted) {
          setImageSrc(cachedUrl);
          setLoading(false);
          return;
        }

        // If not cached, download and cache it
        const newCachedUrl = await imageCache.cacheImage(src);
        
        if (newCachedUrl && isMounted) {
          setImageSrc(newCachedUrl);
        } else if (isMounted) {
          // Fallback to original URL if caching fails
          setImageSrc(src);
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('CachedImage error:', err);
        if (isMounted) {
          setImageSrc(src); // Fallback to original URL
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      // Clean up blob URLs to prevent memory leaks
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  const handleLoad = (e) => {
    setLoading(false);
    setError(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setLoading(false);
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
