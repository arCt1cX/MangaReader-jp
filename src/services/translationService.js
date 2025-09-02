class TranslationService {
  constructor(serverUrl = 'http://localhost:5000') {
    this.serverUrl = serverUrl;
  }

  async translateText(text, sourceLanguage = 'JA', targetLanguage = 'EN') {
    try {
      const response = await fetch(`${this.serverUrl}/api/translation/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`Translation request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Translation service error:', error);
      return {
        success: false,
        error: error.message,
        data: {
          originalText: text,
          translatedText: 'Translation service unavailable',
          sourceLanguage,
          targetLanguage
        }
      };
    }
  }

  async lookupWord(word) {
    try {
      const response = await fetch(`${this.serverUrl}/api/translation/dictionary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word })
      });

      if (!response.ok) {
        throw new Error(`Dictionary lookup failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Dictionary lookup error:', error);
      return {
        success: false,
        error: error.message,
        data: {
          searchTerm: word,
          results: [],
          totalResults: 0
        }
      };
    }
  }

  async checkApiUsage() {
    try {
      const response = await fetch(`${this.serverUrl}/api/translation/usage`);
      
      if (!response.ok) {
        throw new Error(`Usage check failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API usage check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Batch translate multiple text segments
  async batchTranslate(textSegments, sourceLanguage = 'JA', targetLanguage = 'EN') {
    const results = [];
    
    for (const segment of textSegments) {
      const result = await this.translateText(segment, sourceLanguage, targetLanguage);
      results.push(result);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  // Get reading assistance for Japanese text
  async getReadingAssistance(text) {
    try {
      // First get translation
      const translationResult = await this.translateText(text);
      
      // Then get word breakdown from dictionary
      const words = text.split(/\s+/);
      const dictionaryResults = [];
      
      for (const word of words) {
        if (word.trim()) {
          const lookupResult = await this.lookupWord(word.trim());
          if (lookupResult.success && lookupResult.data.results.length > 0) {
            dictionaryResults.push({
              word: word.trim(),
              definitions: lookupResult.data.results[0]
            });
          }
        }
      }
      
      return {
        success: true,
        data: {
          translation: translationResult.data,
          dictionary: dictionaryResults,
          originalText: text
        }
      };
    } catch (error) {
      console.error('Reading assistance error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;
