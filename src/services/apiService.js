import API_BASE_URL, { API_ENDPOINTS, REQUEST_CONFIG } from '../config/api';

class ApiService {
  async request(url, options = {}) {
    const config = {
      ...REQUEST_CONFIG,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.request(API_ENDPOINTS.HEALTH);
  }

  // Manga services
  async searchManga(site, query, page = 1) {
    const params = new URLSearchParams({
      site,
      query,
      page: page.toString()
    });
    
    console.log('Searching manga:', { site, query, page });
    const result = await this.request(`${API_ENDPOINTS.SEARCH_MANGA}?${params}`);
    console.log('Search result:', result);
    
    // Log cover image URLs for debugging and convert relative proxy URLs to absolute URLs
    if (result?.data?.manga) {
      result.data.manga.forEach((manga, index) => {
        // Convert relative proxy URLs to absolute URLs
        if (manga.coverImage && manga.coverImage.startsWith('/api/manga/image-proxy')) {
          manga.coverImage = `${API_BASE_URL}${manga.coverImage}`;
          console.log(`Converted relative proxy URL to absolute URL for ${manga.title}: ${manga.coverImage}`);
        }
        
        if (index < 3) { // Log first 3 for debugging
          console.log(`Manga ${index + 1}: ${manga.title} - Cover: ${manga.coverImage}`);
        }
      });
    }
    
    return result;
  }

  async getMangaInfo(site, id) {
    const params = new URLSearchParams({
      site,
      id
    });
    
    const result = await this.request(`${API_ENDPOINTS.MANGA_INFO}?${params}`);
    
    // Fix cover image URL if it's a relative proxy URL
    if (result?.success && result?.data?.coverImage && result.data.coverImage.startsWith('/api/manga/image-proxy')) {
      result.data.coverImage = `${API_BASE_URL}${result.data.coverImage}`;
      console.log(`Fixed manga info cover image URL: ${result.data.coverImage}`);
    }
    
    return result;
  }

  async getChapterImages(chapterId, site) {
    const params = new URLSearchParams({
      chapterId,
      site
    });
    
    return this.request(`${API_ENDPOINTS.CHAPTER_IMAGES}?${params}`);
  }

  async getAvailableSites() {
    return this.request(API_ENDPOINTS.MANGA_SITES);
  }

  // Translation services
  async translateText(text, sourceLanguage = 'JA', targetLanguage = 'EN') {
    return this.request(API_ENDPOINTS.TRANSLATE, {
      method: 'POST',
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage
      })
    });
  }

  async dictionaryLookup(word) {
    return this.request(API_ENDPOINTS.DICTIONARY, {
      method: 'POST',
      body: JSON.stringify({
        word
      })
    });
  }

  // Utility method to check if backend is available
  async isBackendAvailable() {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
