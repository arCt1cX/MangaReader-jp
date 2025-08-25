/**
 * Image Cache Service
 * Handles local caching of manga chapter images to reduce bandwidth usage
 * Uses Cache API for image storage and IndexedDB for metadata tracking
 */

class ImageCacheService {
  constructor() {
    this.cacheName = 'manga-images-cache';
    this.dbName = 'manga-cache-db';
    this.dbVersion = 1;
    this.storeName = 'image-metadata';
    this.cacheExpiration = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.maxCacheSize = 100; // Maximum number of cached images
    this.db = null;
    this.cache = null;
    
    this.initializeCache();
  }

  /**
   * Initialize Cache API and IndexedDB
   */
  async initializeCache() {
    try {
      // Initialize Cache API
      this.cache = await caches.open(this.cacheName);
      
      // Initialize IndexedDB
      this.db = await this.openDatabase();
      
      // Clean up expired cache entries on initialization
      await this.cleanupExpiredCache();
      
      console.log('Image cache service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize image cache service:', error);
    }
  }

  /**
   * Open IndexedDB database
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for image metadata
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('chapterId', 'chapterId', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key for an image URL
   */
  generateCacheKey(imageUrl, chapterId, pageNumber) {
    return `${chapterId}-page-${pageNumber}-${btoa(imageUrl).slice(0, 10)}`;
  }

  /**
   * Check if an image is cached and not expired
   */
  async isCached(imageUrl, chapterId, pageNumber) {
    try {
      if (!this.cache || !this.db) return false;

      const cacheKey = this.generateCacheKey(imageUrl, chapterId, pageNumber);
      const cached = await this.cache.match(cacheKey);
      
      if (!cached) return false;

      // Check if cache entry is expired
      const metadata = await this.getImageMetadata(imageUrl);
      if (!metadata || this.isCacheExpired(metadata.timestamp)) {
        // Remove expired cache entry
        await this.removeCachedImage(imageUrl, chapterId, pageNumber);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  /**
   * Get cached image
   */
  async getCachedImage(imageUrl, chapterId, pageNumber) {
    try {
      if (!this.cache) return null;

      const cacheKey = this.generateCacheKey(imageUrl, chapterId, pageNumber);
      const cached = await this.cache.match(cacheKey);
      
      if (cached) {
        console.log(`Retrieved cached image: ${cacheKey}`);
        return cached;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached image:', error);
      return null;
    }
  }

  /**
   * Cache an image
   */
  async cacheImage(imageUrl, chapterId, pageNumber) {
    try {
      if (!this.cache || !this.db) return null;

      // Check cache size limit
      await this.enforceMaxCacheSize();

      const cacheKey = this.generateCacheKey(imageUrl, chapterId, pageNumber);
      
      // Fetch image from network
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      // Clone response for caching
      const responseClone = response.clone();
      
      // Store in Cache API
      await this.cache.put(cacheKey, responseClone);
      
      // Store metadata in IndexedDB
      await this.storeImageMetadata({
        url: imageUrl,
        cacheKey: cacheKey,
        chapterId: chapterId,
        pageNumber: pageNumber,
        timestamp: Date.now(),
        size: response.headers.get('content-length') || 0
      });

      console.log(`Cached image: ${cacheKey}`);
      return response;
      
    } catch (error) {
      console.error('Error caching image:', error);
      // Return network response even if caching fails
      try {
        return await fetch(imageUrl);
      } catch (fetchError) {
        console.error('Failed to fetch image from network:', fetchError);
        throw fetchError;
      }
    }
  }

  /**
   * Get image with caching logic
   */
  async getImage(imageUrl, chapterId, pageNumber) {
    try {
      // Check if image is already cached
      if (await this.isCached(imageUrl, chapterId, pageNumber)) {
        const cachedResponse = await this.getCachedImage(imageUrl, chapterId, pageNumber);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // Cache and return image
      return await this.cacheImage(imageUrl, chapterId, pageNumber);
      
    } catch (error) {
      console.error('Error getting image:', error);
      // Fallback to direct network request
      return await fetch(imageUrl);
    }
  }

  /**
   * Store image metadata in IndexedDB
   */
  async storeImageMetadata(metadata) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get image metadata from IndexedDB
   */
  async getImageMetadata(imageUrl) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(imageUrl);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if cache entry is expired
   */
  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheExpiration;
  }

  /**
   * Remove cached image and its metadata
   */
  async removeCachedImage(imageUrl, chapterId, pageNumber) {
    try {
      const cacheKey = this.generateCacheKey(imageUrl, chapterId, pageNumber);
      
      // Remove from Cache API
      if (this.cache) {
        await this.cache.delete(cacheKey);
      }
      
      // Remove metadata from IndexedDB
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
          const request = store.delete(imageUrl);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      console.log(`Removed cached image: ${cacheKey}`);
    } catch (error) {
      console.error('Error removing cached image:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache() {
    try {
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const expiredTime = Date.now() - this.cacheExpiration;
      const range = IDBKeyRange.upperBound(expiredTime);
      
      const request = index.openCursor(range);
      const expiredEntries = [];
      
      request.onsuccess = async (event) => {
        const cursor = event.target.result;
        if (cursor) {
          expiredEntries.push(cursor.value);
          cursor.continue();
        } else {
          // Remove expired entries
          for (const entry of expiredEntries) {
            await this.removeCachedImage(entry.url, entry.chapterId, entry.pageNumber);
          }
          console.log(`Cleaned up ${expiredEntries.length} expired cache entries`);
        }
      };
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
    }
  }

  /**
   * Enforce maximum cache size by removing oldest entries
   */
  async enforceMaxCacheSize() {
    try {
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const countRequest = store.count();
      countRequest.onsuccess = async () => {
        const count = countRequest.result;
        
        if (count >= this.maxCacheSize) {
          // Get oldest entries to remove
          const index = store.index('timestamp');
          const request = index.openCursor();
          const entriesToRemove = [];
          
          request.onsuccess = async (event) => {
            const cursor = event.target.result;
            if (cursor && entriesToRemove.length < (count - this.maxCacheSize + 10)) {
              entriesToRemove.push(cursor.value);
              cursor.continue();
            } else {
              // Remove oldest entries
              for (const entry of entriesToRemove) {
                await this.removeCachedImage(entry.url, entry.chapterId, entry.pageNumber);
              }
              console.log(`Removed ${entriesToRemove.length} oldest cache entries to enforce size limit`);
            }
          };
        }
      };
    } catch (error) {
      console.error('Error enforcing cache size limit:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clearCache() {
    try {
      if (this.cache) {
        await caches.delete(this.cacheName);
        this.cache = await caches.open(this.cacheName);
      }
      
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      console.log('All cached images cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      if (!this.db) return { totalEntries: 0, totalSize: 0 };

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const entries = request.result;
          const totalSize = entries.reduce((sum, entry) => sum + (parseInt(entry.size) || 0), 0);
          resolve({
            totalEntries: entries.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
          });
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }

  /**
   * Preload chapter images for faster reading
   */
  async preloadChapterImages(pages, chapterId) {
    try {
      console.log(`Preloading ${pages.length} images for chapter ${chapterId}`);
      
      // Load images in batches to avoid overwhelming the network
      const batchSize = 3;
      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (page, index) => {
            try {
              await this.getImage(page.url, chapterId, i + index + 1);
            } catch (error) {
              console.error(`Failed to preload image ${i + index + 1}:`, error);
            }
          })
        );
        
        // Small delay between batches
        if (i + batchSize < pages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Finished preloading images for chapter ${chapterId}`);
    } catch (error) {
      console.error('Error preloading chapter images:', error);
    }
  }
}

// Create singleton instance
const imageCacheService = new ImageCacheService();

export default imageCacheService;
