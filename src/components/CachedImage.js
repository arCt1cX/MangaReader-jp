import React, { useState, useEffect, useRef } from 'react';
import imageCacheService from '../services/imageCacheService';

/**
 * CachedImage Component
 * Displays images with intelligent caching to reduce bandwidth usage
 */
const CachedImage = ({ 
  src, 
  alt, 
  chapterId, 
  pageNumber, 
  className = '',
  style = {},
  onLoad = () => {},
  onError = () => {},
  loading = 'lazy',
  placeholder = null
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Get image from cache service
        const response = await imageCacheService.getImage(src, chapterId, pageNumber);
        
        if (abortControllerRef.current.signal.aborted) {
          return;
        }
        
        // Convert response to blob URL for display
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        setImageSrc(blobUrl);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error loading cached image:', error);
        
        if (!abortControllerRef.current.signal.aborted) {
          setHasError(true);
          setIsLoading(false);
          onError(error);
        }
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Revoke blob URL to free memory
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, chapterId, pageNumber, onError, imageSrc]);

  // Cleanup blob URL when component unmounts or imageSrc changes
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad();
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
    onError();
  };

  // Show placeholder while loading
  if (isLoading && placeholder) {
    return placeholder;
  }

  // Show error state
  if (hasError) {
    return (
      <div 
        className={`cached-image-error ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#666',
          minHeight: '200px',
          border: '1px dashed #ccc',
          ...style
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <div>Failed to load image</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Page {pageNumber}
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className={`cached-image-loading ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d',
          minHeight: '200px',
          ...style
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '8px'
          }}></div>
          <div>Loading page {pageNumber}...</div>
        </div>
      </div>
    );
  }

  // Render the cached image
  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onLoad={handleImageLoad}
      onError={handleImageError}
      draggable={false}
    />
  );
};

export default CachedImage;
