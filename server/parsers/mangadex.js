const axios = require('axios');

const BASE_URL = 'https://api.mangadex.org';

async function getChapters(mangaId) {
  try {
    const response = await axios.get(`${BASE_URL}/manga/${mangaId}/feed`, {
      params: {
        translatedLanguage: ['en'],
        order: { chapter: 'asc' },
        limit: 100
      }
    });

    const chapters = response.data.data.map((chapter, index) => ({
      id: chapter.id,
      title: chapter.attributes.title || `Chapter ${chapter.attributes.chapter}`,
      number: parseFloat(chapter.attributes.chapter) || index + 1,
      volume: chapter.attributes.volume,
      pages: chapter.attributes.pages,
      date: chapter.attributes.publishAt
    }));

    return {
      mangaId,
      chapters
    };
  } catch (error) {
    console.error('Error fetching MangaDex chapters:', error);
    throw error;
  }
}

async function getChapterImages(chapterId) {
  try {
    const response = await axios.get(`${BASE_URL}/at-home/server/${chapterId}`);
    const { baseUrl, chapter } = response.data;
    
    const images = chapter.data.map((filename, index) => ({
      url: `${baseUrl}/data/${chapter.hash}/${filename}`,
      page: index + 1
    }));

    return {
      chapterId,
      images,
      totalPages: images.length
    };
  } catch (error) {
    console.error('Error fetching MangaDex chapter images:', error);
    throw error;
  }
}

async function searchManga(query) {
  try {
    const response = await axios.get(`${BASE_URL}/manga`, {
      params: {
        title: query,
        limit: 20,
        availableTranslatedLanguage: ['en']
      }
    });

    const results = response.data.data.map(manga => {
      const attributes = manga.attributes;
      const coverRelation = manga.relationships.find(rel => rel.type === 'cover_art');
      
      return {
        id: manga.id,
        title: attributes.title.en || Object.values(attributes.title)[0],
        description: attributes.description.en || '',
        cover: coverRelation ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRelation.attributes?.fileName}` : null,
        status: attributes.status,
        year: attributes.year
      };
    });

    return results;
  } catch (error) {
    console.error('Error searching MangaDex:', error);
    throw error;
  }
}

module.exports = {
  getChapters,
  getChapterImages,
  searchManga
};
