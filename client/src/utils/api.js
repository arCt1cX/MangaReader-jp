import axios from 'axios';

// Update this to your actual Render server URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://server-arct1cx.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error.message);
    if (error.code === 'ERR_NAME_NOT_RESOLVED') {
      console.error('Backend server is not accessible. Check if server is running.');
    }
    return Promise.reject(error);
  }
);

// Manga API functions
export async function searchManga(site, query) {
  const response = await api.get(`/api/manga/search/${site}`, {
    params: { query }
  });
  return response.data;
}

export async function getChapters(site, mangaId) {
  const response = await api.get(`/api/manga/chapters/${site}/${mangaId}`);
  return response.data;
}

export async function getChapterImages(site, chapterId) {
  const response = await api.get(`/api/manga/chapter/${site}/${chapterId}`);
  return response.data;
}

export function getProxiedImageUrl(originalUrl) {
  return `${API_BASE_URL}/api/manga/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

// Translation API functions
export async function translateText(text, targetLang = 'EN') {
  const response = await api.post('/api/translation/deepl', {
    text,
    targetLang
  });
  return response.data;
}

export async function lookupWord(word) {
  const response = await api.get(`/api/translation/jisho/${encodeURIComponent(word)}`);
  return response.data;
}

export default api;
