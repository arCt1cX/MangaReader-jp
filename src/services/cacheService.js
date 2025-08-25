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
    let totalSizeBytes = 0;
    const items = [];
    
    for (const [key, cached] of this.cache.entries()) {
      // Estimate size: each page URL is roughly 100-200 bytes
      // Plus some overhead for the data structure
      const itemSize = this.estimateSize(cached.data);
      totalSizeBytes += itemSize;
      
      items.push({
        key,
        pages: cached.data.pages?.length || 0,
        sizeBytes: itemSize,
        timestamp: cached.timestamp,
        timeRemaining: Math.max(0, this.CACHE_DURATION - (Date.now() - cached.timestamp))
      });
    }
    
    return {
      count: this.cache.size,
      totalSizeBytes,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      items,
      keys: Array.from(this.cache.keys())
    };
  }

  // Estimate memory usage of cached data
  estimateSize(data) {
    if (!data || !data.pages) return 0;
    
    // Rough estimate: each page object with URL and metadata
    // URL: ~150 bytes average, plus object overhead ~50 bytes
    const avgPageSize = 200;
    return data.pages.length * avgPageSize + 1000; // +1000 for object overhead
  }

  // Clear all cache
  clear() {
    const stats = this.getStats();
    this.cache.clear();
    console.log(`🗑️ Cache cleared - freed ${stats.totalSizeMB} MB`);
    return stats;
  }
}

// Export singleton instance
export const chapterCache = new CacheService();
export default chapterCache;
