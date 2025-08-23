const express = require('express');
const axios = require('axios');
const router = express.Router();

// DeepL translation
router.post('/deepl', async (req, res) => {
  try {
    const { text, targetLang = 'EN' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.DEEPL_API_KEY) {
      return res.status(500).json({ error: 'DeepL API key not configured' });
    }

    const response = await axios.post('https://api-free.deepl.com/v2/translate', {
      text: [text],
      target_lang: targetLang,
      source_lang: 'JA'
    }, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      originalText: text,
      translatedText: response.data.translations[0].text,
      detectedSourceLang: response.data.translations[0].detected_source_language
    });
  } catch (error) {
    console.error('DeepL translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Jisho dictionary lookup
router.get('/jisho/:word', async (req, res) => {
  try {
    const { word } = req.params;
    
    const response = await axios.get(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Jisho lookup error:', error);
    res.status(500).json({ error: 'Dictionary lookup failed' });
  }
});

module.exports = router;
