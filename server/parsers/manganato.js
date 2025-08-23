const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://manganato.com';

async function getChapters(mangaId) {
  try {
    const url = `${BASE_URL}/${mangaId}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const chapters = [];

    $('.panel-story-chapter-list .row-content-chapter').each((i, element) => {
      const $element = $(element);
      const link = $element.find('a').attr('href');
      const title = $element.find('a').text().trim();
      const date = $element.find('.chapter-time').text().trim();

      if (link && title) {
        chapters.push({
          id: link.split('/').pop(),
          title,
          url: link,
          date,
          number: chapters.length + 1
        });
      }
    });

    return {
      mangaId,
      chapters: chapters.reverse() // Show oldest first
    };
  } catch (error) {
    console.error('Error parsing MangaNato chapters:', error);
    throw error;
  }
}

async function getChapterImages(chapterId) {
  try {
    const url = chapterId.startsWith('http') ? chapterId : `${BASE_URL}/${chapterId}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const images = [];

    $('.container-chapter-reader img').each((i, element) => {
      const src = $(element).attr('src');
      if (src) {
        images.push({
          url: src,
          page: i + 1
        });
      }
    });

    return {
      chapterId,
      images,
      totalPages: images.length
    };
  } catch (error) {
    console.error('Error parsing MangaNato chapter images:', error);
    throw error;
  }
}

async function searchManga(query) {
  try {
    const url = `${BASE_URL}/search/story/${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.search-story-item').each((i, element) => {
      const $element = $(element);
      const link = $element.find('a').first().attr('href');
      const title = $element.find('.item-title').text().trim();
      const cover = $element.find('img').attr('src');
      const author = $element.find('.item-author').text().trim();

      if (link && title) {
        results.push({
          id: link.split('/').pop(),
          title,
          author,
          cover,
          url: link
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error searching MangaNato:', error);
    throw error;
  }
}

module.exports = {
  getChapters,
  getChapterImages,
  searchManga
};
