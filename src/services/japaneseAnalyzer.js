import kuromoji from 'kuromoji';

class JapaneseAnalyzer {
  constructor() {
    this.tokenizer = null;
    this.isLoaded = false;
  }

  async initialize() {
    if (this.isLoaded) return;

    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: '/dict/' }).build((err, tokenizer) => {
        if (err) {
          console.error('Failed to load kuromoji:', err);
          reject(err);
          return;
        }
        
        this.tokenizer = tokenizer;
        this.isLoaded = true;
        console.log('Japanese analyzer initialized');
        resolve();
      });
    });
  }

  async tokenize(text) {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      const tokens = this.tokenizer.tokenize(text);
      
      return tokens.map(token => ({
        surface: token.surface_form,
        reading: token.reading || token.surface_form,
        pronunciation: token.pronunciation || token.reading || token.surface_form,
        partOfSpeech: token.part_of_speech,
        baseForm: token.basic_form || token.surface_form,
        conjugationType: token.conjugated_type,
        conjugationForm: token.conjugated_form,
        features: token.part_of_speech_detail_1
      }));
    } catch (error) {
      console.error('Tokenization failed:', error);
      return [];
    }
  }

  // Identify different types of Japanese text components
  categorizeText(text) {
    const categories = {
      hiragana: [],
      katakana: [],
      kanji: [],
      numbers: [],
      punctuation: [],
      other: []
    };

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);

      if (this.isHiragana(code)) {
        categories.hiragana.push({ char, index: i });
      } else if (this.isKatakana(code)) {
        categories.katakana.push({ char, index: i });
      } else if (this.isKanji(code)) {
        categories.kanji.push({ char, index: i });
      } else if (this.isNumber(char)) {
        categories.numbers.push({ char, index: i });
      } else if (this.isPunctuation(char)) {
        categories.punctuation.push({ char, index: i });
      } else {
        categories.other.push({ char, index: i });
      }
    }

    return categories;
  }

  // Helper methods for character classification
  isHiragana(code) {
    return code >= 0x3040 && code <= 0x309F;
  }

  isKatakana(code) {
    return code >= 0x30A0 && code <= 0x30FF;
  }

  isKanji(code) {
    return (code >= 0x4E00 && code <= 0x9FAF) || // CJK Unified Ideographs
           (code >= 0x3400 && code <= 0x4DBF) || // CJK Extension A
           (code >= 0x20000 && code <= 0x2A6DF); // CJK Extension B
  }

  isNumber(char) {
    return /[0-9０-９一二三四五六七八九十百千万億兆]/.test(char);
  }

  isPunctuation(char) {
    return /[。、！？「」『』（）・ー]/.test(char);
  }

  // Extract words that might need dictionary lookup
  async extractLookupCandidates(text) {
    const tokens = await this.tokenize(text);
    
    return tokens.filter(token => {
      // Focus on nouns, verbs, adjectives, and unknown words
      const pos = token.partOfSpeech[0];
      return ['名詞', '動詞', '形容詞', '未知語'].includes(pos) ||
             token.surface.length > 1; // Multi-character words
    }).map(token => ({
      word: token.surface,
      reading: token.reading,
      baseForm: token.baseForm,
      partOfSpeech: token.partOfSpeech.join('-')
    }));
  }

  // Convert hiragana to romaji (simplified)
  hiraganaToRomaji(hiragana) {
    const map = {
      'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
      'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
      'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
      'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
      'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
      'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
      'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
      'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
      'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
      'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
      'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
      'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
      'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
      'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
      'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
      'ー': '-'
    };

    return hiragana.split('').map(char => map[char] || char).join('');
  }
}

// Create singleton instance
const japaneseAnalyzer = new JapaneseAnalyzer();

export default japaneseAnalyzer;
