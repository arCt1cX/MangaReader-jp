const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Manga site parsers
const parsers = {
  mangadex: require('../parsers/mangadex'),
  manganato: require('../parsers/manganato'),
  custom: require('../parsers/custom')
};

// Get manga chapters
router.get('/chapters/:site/:mangaId', async (req, res) => {
  try {
    const { site, mangaId } = req.params;
    const parser = parsers[site];
    
    if (!parser) {
      return res.status(400).json({ error: 'Unsupported manga site' });
    }

    const chapters = await parser.getChapters(mangaId);
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Get chapter images
router.get('/chapter/:site/:chapterId', async (req, res) => {
  try {
    const { site, chapterId } = req.params;
    const parser = parsers[site];
    
    if (!parser) {
      return res.status(400).json({ error: 'Unsupported manga site' });
    }

    const images = await parser.getChapterImages(chapterId);
    res.json(images);
  } catch (error) {
    console.error('Error fetching chapter images:', error);
    res.status(500).json({ error: 'Failed to fetch chapter images' });
  }
});

// Search manga
router.get('/search/:site', async (req, res) => {
  try {
    const { site } = req.params;
    const { query } = req.query;
    const parser = parsers[site];
    
    if (!parser) {
      return res.status(400).json({ error: 'Unsupported manga site' });
    }

    const results = await parser.searchManga(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching manga:', error);
    res.status(500).json({ error: 'Failed to search manga' });
  }
});

// Proxy images to avoid CORS
router.get('/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(url).origin
      }
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Cache-Control': 'public, max-age=3600'
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

module.exports = router;
