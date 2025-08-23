import Tesseract from 'tesseract.js';
// import kuromoji from 'kuromoji'; // Temporarily disabled for build

export async function initializeKuromoji() {
  // Temporarily disabled - will be re-enabled later
  console.warn('Kuromoji functionality temporarily disabled');
  return null;
}

export async function extractTextFromImage(imageElement) {
  try {
    const { data: { text } } = await Tesseract.recognize(imageElement, 'jpn', {
      logger: m => console.log(m)
    });
    return text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

export function tokenizeJapanese(text, tokenizer) {
  if (!tokenizer) {
    console.warn('Tokenizer not available - kuromoji temporarily disabled');
    return [];
  }
  
  return tokenizer.tokenize(text);
}

export async function lookupWord(word) {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/translation/jisho/${encodeURIComponent(word)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    throw error;
  }
}

export async function translateText(text) {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/translation/deepl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, targetLang: 'EN' })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

export function isJapanese(text) {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/translation/deepl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, targetLang: 'EN' })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }

export function isJapanese(text) {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}
