// Image cache service for cover images and other static images
class ImageCacheService {
  constructor() {
    this.CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.STORAGE_KEY = 'manga_image_cache_meta';
    this.initializeCache();
  }

  // Initialize cache metadata from localStorage
  initializeCache() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      this.cacheMetadata = stored ? new Map(JSON.parse(stored)) : new Map();
      
      // Clean up expired entries on startup
      this.clearExpired();
      
      console.log(`🖼️ Image cache initialized with ${this.cacheMetadata.size} cached images`);
    } catch (error) {
      console.warn('Failed to load image cache metadata:', error);
      this.cacheMetadata = new Map();
    }
  }

  // Save cache metadata to localStorage
  saveCacheMetadata() {
    try {
      const metadataArray = Array.from(this.cacheMetadata.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metadataArray));
    } catch (error) {
      console.warn('Failed to save image cache metadata:', error);
    }
  }

  // Generate cache key for an image URL
  getCacheKey(imageUrl) {
    // Use a simplified version of the URL as key
    return btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  // Check if image is cached and not expired
  isCached(imageUrl) {
    const key = this.getCacheKey(imageUrl);
    const metadata = this.cacheMetadata.get(key);
    
    if (!metadata) {
      return false;
    }

    // Check if cache is expired
    if (Date.now() - metadata.timestamp > this.CACHE_DURATION) {
      this.cacheMetadata.delete(key);
      this.saveCacheMetadata();
      return false;
    }

    return true;
  }

  // Get cached image URL with cache-friendly parameters
  getCachedImageUrl(originalUrl) {
    // If URL is already going through image proxy, don't add cache parameters
    if (originalUrl.includes('/api/manga/image-proxy')) {
      console.log('🖼️ Using proxy URL (browser cached):', originalUrl.substring(0, 80) + '...');
      return originalUrl;
    }

    const key = this.getCacheKey(originalUrl);
    const metadata = this.cacheMetadata.get(key);
    
    if (!metadata || Date.now() - metadata.timestamp > this.CACHE_DURATION) {
      // Not cached or expired, return original URL with cache buster to ensure fresh fetch
      const separator = originalUrl.includes('?') ? '&' : '?';
      console.log('🔄 Fetching fresh image:', originalUrl.substring(0, 80) + '...');
      return `${originalUrl}${separator}_cb=${Date.now()}`;
    }

    // Cached and valid, return URL with cache timestamp to leverage browser cache
    const separator = originalUrl.includes('?') ? '&' : '?';
    console.log('✅ Using cached image:', originalUrl.substring(0, 80) + '...');
    return `${originalUrl}${separator}_cache=${metadata.timestamp}`;
  }

  // Mark image as cached
  markAsCached(imageUrl) {
    // Don't track proxy images in our custom cache (they're browser cached)
    if (imageUrl.includes('/api/manga/image-proxy')) {
      console.log('🖼️ Skipping cache tracking for proxy image (browser handles it)');
      return;
    }

    const key = this.getCacheKey(imageUrl);
    this.cacheMetadata.set(key, {
      url: imageUrl,
      timestamp: Date.now()
    });
    this.saveCacheMetadata();
    console.log(`✅ Marked non-proxy image as cached: ${imageUrl.substring(0, 50)}...`);
  }

  // Clear expired cache entries
  clearExpired() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (now - metadata.timestamp > this.CACHE_DURATION) {
        this.cacheMetadata.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🗑️ Removed ${removedCount} expired image cache entries`);
      this.saveCacheMetadata();
    }
  }

  // Get cache statistics
  getStats() {
    const items = [];
    let validCount = 0;
    const now = Date.now();
    
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      const timeRemaining = Math.max(0, this.CACHE_DURATION - (now - metadata.timestamp));
      const isValid = timeRemaining > 0;
      
      if (isValid) validCount++;
      
      items.push({
        key,
        url: metadata.url,
        timestamp: metadata.timestamp,
        timeRemaining,
        isValid,
        daysRemaining: Math.floor(timeRemaining / (24 * 60 * 60 * 1000))
      });
    }
    
    return {
      total: this.cacheMetadata.size,
      valid: validCount,
      expired: this.cacheMetadata.size - validCount,
      items: items.sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
    };
  }

  // Clear all image cache
  clear() {
    const stats = this.getStats();
    this.cacheMetadata.clear();
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear image cache metadata:', error);
    }
    
    console.log(`🗑️ Image cache cleared - removed ${stats.total} entries`);
    return stats;
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();
export default imageCacheService;
