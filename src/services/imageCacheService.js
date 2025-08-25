// Simple image cache service using IndexedDB for persistent storage
class ImageCacheService {
  constructor() {
    this.dbName = 'MangaImageCache';
    this.dbVersion = 1;
    this.storeName = 'images';
    this.CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.db = null;
    this.initPromise = this.initDB();
  }

  // Initialize IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('📦 Image cache DB initialized');
        this.cleanupExpired(); // Clean up on startup
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('📦 Image cache store created');
        }
      };
    });
  }

  // Generate a blob URL from cached data
  createBlobUrl(blob) {
    return URL.createObjectURL(blob);
  }

  // Get cached image
  async get(imageUrl) {
    try {
      await this.initPromise;
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(imageUrl);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            console.log(`🖼️ Image cache MISS for ${imageUrl.slice(0, 50)}...`);
            resolve(null);
            return;
          }

          // Check if cache is expired
          if (Date.now() - result.timestamp > this.CACHE_DURATION) {
            console.log(`🖼️ Image cache EXPIRED for ${imageUrl.slice(0, 50)}...`);
            // Delete expired item
            this.delete(imageUrl);
            resolve(null);
            return;
          }

          console.log(`🖼️ Image cache HIT for ${imageUrl.slice(0, 50)}...`);
          // Return blob URL
          const blobUrl = this.createBlobUrl(result.blob);
          resolve(blobUrl);
        };

        request.onerror = () => {
          console.warn('Failed to get cached image:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Image cache get error:', error);
      return null;
    }
  }

  // Cache an image
  async set(imageUrl, blob) {
    try {
      await this.initPromise;
      if (!this.db) return false;

      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const data = {
          url: imageUrl,
          blob: blob,
          timestamp: Date.now(),
          size: blob.size
        };

        const request = store.put(data);

        request.onsuccess = () => {
          console.log(`🖼️ Successfully cached image ${imageUrl.slice(0, 50)}... (${(blob.size / 1024).toFixed(1)} KB)`);
          resolve(true);
        };

        request.onerror = () => {
          console.warn('Failed to cache image:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('Image cache set error:', error);
      return false;
    }
  }

  // Download and cache an image
  async cacheImage(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      await this.set(imageUrl, blob);
      return this.createBlobUrl(blob);
    } catch (error) {
      console.warn('Failed to download and cache image:', error);
      return null;
    }
  }

  // Delete a cached image
  async delete(imageUrl) {
    try {
      await this.initPromise;
      if (!this.db) return;

      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(imageUrl);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.warn('Image cache delete error:', error);
      return false;
    }
  }

  // Clean up expired images
  async cleanupExpired() {
    try {
      await this.initPromise;
      if (!this.db) return;

      const now = Date.now();
      const cutoff = now - this.CACHE_DURATION;

      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            if (deletedCount > 0) {
              console.log(`🗑️ Cleaned up ${deletedCount} expired cached images`);
            }
            resolve(deletedCount);
          }
        };

        request.onerror = () => {
          console.warn('Failed to cleanup expired images');
          resolve(0);
        };
      });
    } catch (error) {
      console.warn('Image cache cleanup error:', error);
      return 0;
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      await this.initPromise;
      if (!this.db) return { count: 0, totalSize: 0 };

      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result;
          const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
          
          resolve({
            count: items.length,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
          });
        };

        request.onerror = () => {
          resolve({ count: 0, totalSize: 0, totalSizeMB: '0.00' });
        };
      });
    } catch (error) {
      return { count: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
  }

  // Clear all cached images
  async clear() {
    try {
      await this.initPromise;
      if (!this.db) return;

      const stats = await this.getStats();
      
      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`🗑️ Image cache cleared - freed ${stats.totalSizeMB} MB`);
          resolve(stats);
        };

        request.onerror = () => {
          console.warn('Failed to clear image cache');
          resolve(stats);
        };
      });
    } catch (error) {
      console.warn('Image cache clear error:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCacheService();
export default imageCache;
