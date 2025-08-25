import React, { useState, useEffect, useRef } from 'react';
import imageCache from '../services/imageCacheService';

const CachedImage = ({ src, alt, className, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    // Check cache first
    const cachedImage = imageCache.get(src);
    if (cachedImage) {
      setImageSrc(cachedImage);
      setLoading(false);
      return;
    }

    // Load image and cache it
    loadAndCacheImage(src);
  }, [src]);

  const loadAndCacheImage = async (imageUrl) => {
    try {
      setLoading(true);
      setError(false);

      // Create a new image element to load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        // Image loaded successfully, cache it
        await imageCache.set(imageUrl, img);
        setImageSrc(imageUrl);
        setLoading(false);
      };

      img.onerror = () => {
        console.warn('Failed to load image:', imageUrl);
        setError(true);
        setLoading(false);
        if (onError) onError();
      };

      img.src = imageUrl;
    } catch (err) {
      console.error('Error loading image:', err);
      setError(true);
      setLoading(false);
      if (onError) onError();
    }
  };

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`${className} bg-gray-800 flex items-center justify-center`}>
        <div className="text-gray-400 text-sm text-center">
          <div className="text-2xl mb-1">📚</div>
          <div>No Image</div>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

export default CachedImage;