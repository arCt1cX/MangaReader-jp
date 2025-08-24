import { API_ENDPOINTS, REQUEST_CONFIG } from '../config/api';

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
    
    return this.request(`${API_ENDPOINTS.SEARCH_MANGA}?${params}`);
  }

  async getMangaInfo(site, url) {
    const params = new URLSearchParams({
      site,
      url
    });
    
    return this.request(`${API_ENDPOINTS.MANGA_INFO}?${params}`);
  }

  async getChapterImages(url) {
    const params = new URLSearchParams({
      url
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
