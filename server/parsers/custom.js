const axios = require('axios');
const cheerio = require('cheerio');

async function getChapters(mangaId, parsingRules) {
  try {
    const { baseUrl, chaptersSelector, titleSelector, linkSelector } = parsingRules;
    const url = `${baseUrl}/${mangaId}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const chapters = [];

    $(chaptersSelector).each((i, element) => {
      const $element = $(element);
      const title = $element.find(titleSelector).text().trim();
      const link = $element.find(linkSelector).attr('href');

      if (link && title) {
        chapters.push({
          id: link.split('/').pop(),
          title,
          url: link.startsWith('http') ? link : `${baseUrl}${link}`,
          number: i + 1
        });
      }
    });

    return {
      mangaId,
      chapters: chapters.reverse()
    };
  } catch (error) {
    console.error('Error parsing custom site chapters:', error);
    throw error;
  }
}

async function getChapterImages(chapterId, parsingRules) {
  try {
    const { baseUrl, imagesSelector } = parsingRules;
    const url = chapterId.startsWith('http') ? chapterId : `${baseUrl}/${chapterId}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const images = [];

    $(imagesSelector).each((i, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src');
      if (src) {
        const imageUrl = src.startsWith('http') ? src : `${baseUrl}${src}`;
        images.push({
          url: imageUrl,
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
    console.error('Error parsing custom site chapter images:', error);
    throw error;
  }
}

module.exports = {
  getChapters,
  getChapterImages,
  searchManga: () => { throw new Error('Search not implemented for custom sites'); }
};
