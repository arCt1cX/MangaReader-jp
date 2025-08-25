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
    setImageSrc(cachedUrl);
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  const handleImageLoad = (e) => {
    setIsLoading(false);
    setImageError(false);
    
    // Only track non-proxy images in our custom cache service
    // Proxy images are already cached by browser with proper headers
    if (src && !src.includes('/api/manga/image-proxy')) {
      imageCacheService.markAsCached(src);
    }
    
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', imageSrc, e);
    setIsLoading(false);
    
    // If this is a CORS error or the image failed to load from proxy, try fallback
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      console.log('Trying fallback image:', fallbackSrc);
      setImageSrc(fallbackSrc);
      setImageError(false);
      return;
    }
    
    // If proxy URL failed and we haven't tried without cache parameters, try that
    if (imageSrc.includes('/api/manga/image-proxy') && (imageSrc.includes('_cb=') || imageSrc.includes('_cache='))) {
      const baseUrl = imageSrc.split('&_')[0]; // Remove cache parameters
      console.log('Retrying without cache parameters:', baseUrl);
      setImageSrc(baseUrl);
      setImageError(false);
      return;
    }
    
    setImageError(true);
    
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
