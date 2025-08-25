// Simple cache service for manga chapters
class CacheService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  // Generate cache key for a chapter
  getCacheKey(mangaId, chapterNumber) {
    return `${mangaId}_${chapterNumber}`;
  }

  // Check if item is in cache and not expired
  get(mangaId, chapterNumber) {
    const key = this.getCacheKey(mangaId, chapterNumber);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    console.log(`📦 Cache HIT for ${key}`);
    return cached.data;
  }

  // Store item in cache
  set(mangaId, chapterNumber, data) {
    const key = this.getCacheKey(mangaId, chapterNumber);
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    console.log(`💾 Cached ${key} (${data.pages?.length || 0} pages)`);
  }

  // Clear expired items (optional cleanup)
  clearExpired() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats (for debugging)
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const chapterCache = new CacheService();
export default chapterCache;
