// Simple image cache service for manga cover images
class ImageCacheService {
  constructor() {
    this.CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.STORAGE_KEY = 'manga_image_cache';
    this.initializeCache();
  }

  // Initialize cache from localStorage
  initializeCache() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      this.cache = stored ? new Map(JSON.parse(stored)) : new Map();
      
      // Clean up expired items on startup
      this.clearExpired();
      
      console.log(`🖼️ Image cache initialized with ${this.cache.size} items`);
    } catch (error) {
      console.warn('Failed to load image cache from localStorage:', error);
      this.cache = new Map();
    }
  }

  // Save cache to localStorage
  saveCache() {
    try {
      const cacheArray = Array.from(this.cache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save image cache to localStorage:', error);
      // If storage is full, try clearing expired items and retry
      this.clearExpired();
      try {
        const cacheArray = Array.from(this.cache.entries());
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheArray));
      } catch (retryError) {
        console.error('Failed to save image cache even after cleanup:', retryError);
      }
    }
  }

  // Generate cache key for an image URL
  getCacheKey(imageUrl) {
    // Use the original image URL as the key (before proxy conversion)
    return imageUrl.replace(/^.*\/api\/manga\/image-proxy\?url=/, '').replace(/%/g, '');
  }

  // Check if image is in cache and not expired
  get(imageUrl) {
    const key = this.getCacheKey(imageUrl);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      this.saveCache();
      return null;
    }

    console.log(`🖼️ Image cache HIT for ${key.substring(0, 50)}...`);
    return cached.dataUrl;
  }

  // Store image in cache as base64 data URL
  async set(imageUrl, imgElement) {
    try {
      const key = this.getCacheKey(imageUrl);
      
      // Convert image to base64 data URL
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      
      ctx.drawImage(imgElement, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress to 80% quality
      
      this.cache.set(key, {
        dataUrl: dataUrl,
        timestamp: Date.now()
      });
      
      console.log(`🖼️ Cached image ${key.substring(0, 50)}... (${Math.round(dataUrl.length / 1024)}KB)`);
      this.saveCache();
      
    } catch (error) {
      console.warn('Failed to cache image:', error);
    }
  }

  // Clear expired items
  clearExpired() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🗑️ Removed ${removedCount} expired image cache entries`);
      this.saveCache();
    }
  }

  // Get cache stats
  getStats() {
    let totalSizeBytes = 0;
    const items = [];
    
    for (const [key, cached] of this.cache.entries()) {
      const itemSize = cached.dataUrl ? cached.dataUrl.length : 0;
      totalSizeBytes += itemSize;
      
      items.push({
        key: key.substring(0, 50) + '...',
        sizeBytes: itemSize,
        sizeMB: (itemSize / (1024 * 1024)).toFixed(2),
        timestamp: cached.timestamp,
        timeRemaining: Math.max(0, this.CACHE_DURATION - (Date.now() - cached.timestamp)),
        daysRemaining: Math.max(0, (this.CACHE_DURATION - (Date.now() - cached.timestamp)) / (24 * 60 * 60 * 1000)).toFixed(1)
      });
    }
    
    return {
      count: this.cache.size,
      totalSizeBytes,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      items
    };
  }

  // Clear all cache
  clear() {
    const stats = this.getStats();
    this.cache.clear();
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear image cache from localStorage:', error);
    }
    
    console.log(`🗑️ Image cache cleared - freed ${stats.totalSizeMB} MB`);
    return stats;
  }
}

// Export singleton instance
export const imageCache = new ImageCacheService();
export default imageCache;
