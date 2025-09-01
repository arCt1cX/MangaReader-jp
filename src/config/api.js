// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://manga-reader-server-avc1.onrender.com'  // Update this with your actual Render URL after deployment
  : 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Manga endpoints
  SEARCH_MANGA: `${API_BASE_URL}/api/manga/search`,
  MANGA_INFO: `${API_BASE_URL}/api/manga/info`,
  CHAPTER_IMAGES: `${API_BASE_URL}/api/manga/chapter`,
  MANGA_SITES: `${API_BASE_URL}/api/manga/sites`,
  
  // Translation endpoints
  TRANSLATE: `${API_BASE_URL}/api/translation/translate`,
  DICTIONARY: `${API_BASE_URL}/api/translation/dictionary`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/health`
};

// Default manga sites configuration
export const DEFAULT_MANGA_SITES = [
  {
    id: 'mangaworld',
    name: 'MangaWorld',
    url: 'https://mangaworld.cx',
    color: '#ff6740',
    description: 'Italian manga site with latest releases',
    logo: '/MangaReader-jp/mangaworld-favicon-32x32.png'
  },
  {
    id: 'manga-italia',
    name: 'Manga Italia',
    url: 'https://www.manga-italia.com',
    color: '#009639',
    description: 'Italian manga community site',
    logo: '/MangaReader-jp/manga-italia-favicon.png'
  },
  {
    id: 'nelomanga',
    name: 'NeloManga',
    url: 'https://www.nelomanga.net',
    color: '#ff6b35',
    description: 'Popular manga reading site',
    logo: '/MangaReader-jp/logo.svg' // Using default logo for now
  }
];

// Request configuration
export const REQUEST_CONFIG = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// DeepL API configuration
export const DEEPL_CONFIG = {
  sourceLanguage: 'JA',
  targetLanguage: 'EN',
  formality: 'default'
};

export default API_BASE_URL;
