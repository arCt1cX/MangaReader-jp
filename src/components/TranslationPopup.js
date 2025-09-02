import React, { useState, useEffect } from 'react';
import japaneseAnalyzer from '../services/japaneseAnalyzer';
import translationService from '../services/translationService';

const TranslationPopup = ({ 
  text, 
  isVisible, 
  onClose, 
  position = { x: 0, y: 0 }
}) => {
  const [translationData, setTranslationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('translation');
  const [tokenizedText, setTokenizedText] = useState([]);

  useEffect(() => {
    if (isVisible && text) {
      fetchTranslationData();
      analyzeJapaneseText();
    }
  }, [isVisible, text]);

  const fetchTranslationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await translationService.translateText(text);
      
      if (result.success) {
        setTranslationData(result.data);
      } else {
        setError(result.error || 'Translation failed');
        setTranslationData({
          originalText: text,
          translatedText: 'Translation service unavailable',
          sourceLanguage: 'JA',
          targetLanguage: 'EN'
        });
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Failed to get translation. Using offline analysis only.');
      
      setTranslationData({
        originalText: text,
        translatedText: 'Translation service unavailable',
        sourceLanguage: 'JA',
        targetLanguage: 'EN'
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeJapaneseText = async () => {
    try {
      const tokens = await japaneseAnalyzer.tokenize(text);
      setTokenizedText(tokens);
    } catch (error) {
      console.error('Japanese analysis failed:', error);
    }
  };

  const lookupWord = async (token) => {
    try {
      const result = await translationService.lookupWord(token.surface);
      
      if (result.success && result.data?.results?.length > 0) {
        return result.data;
      }
    } catch (error) {
      console.error('Dictionary lookup failed:', error);
    }
    return null;
  };

  const handleWordClick = async (token) => {
    const dictionaryData = await lookupWord(token);
    if (dictionaryData?.results?.length > 0) {
      const result = dictionaryData.results[0];
      alert(`${token.surface} (${token.reading})\n\n${result.meanings[0]?.definitions.join(', ') || 'No definition found'}`);
    }
  };

  const getCharacterType = (char) => {
    const code = char.charCodeAt(0);
    if (code >= 0x3040 && code <= 0x309F) return 'hiragana';
    if (code >= 0x30A0 && code <= 0x30FF) return 'katakana';
    if ((code >= 0x4E00 && code <= 0x9FAF) || 
        (code >= 0x3400 && code <= 0x4DBF)) return 'kanji';
    return 'other';
  };

  const getCharacterColor = (type) => {
    switch (type) {
      case 'kanji': return 'text-red-300';
      case 'hiragana': return 'text-blue-300';
      case 'katakana': return 'text-green-300';
      default: return 'text-gray-300';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-gray-900 text-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{
          position: 'absolute',
          left: Math.min(position.x, window.innerWidth - 600),
          top: Math.min(position.y, window.innerHeight - 400)
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">Japanese Text Analysis</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('translation')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'translation' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Translation
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'analysis' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Word Analysis
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'characters' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Characters
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-2">Analyzing text...</span>
            </div>
          )}

          {error && (
            <div className="bg-yellow-900/50 border border-yellow-700 rounded p-3 mb-4">
              <p className="text-yellow-200 text-sm">{error}</p>
            </div>
          )}

          {/* Translation Tab */}
          {activeTab === 'translation' && translationData && !loading && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Original Text</h4>
                <p className="text-lg bg-gray-800 p-3 rounded">{translationData.originalText}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Translation</h4>
                <p className="text-lg bg-gray-800 p-3 rounded text-green-300">{translationData.translatedText}</p>
              </div>
            </div>
          )}

          {/* Word Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Word Breakdown (Click words for definitions)</h4>
              <div className="space-y-2">
                {tokenizedText.map((token, index) => (
                  <div
                    key={index}
                    onClick={() => handleWordClick(token)}
                    className="bg-gray-800 p-3 rounded hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-medium">{token.surface}</span>
                        {token.reading !== token.surface && (
                          <span className="text-gray-400 ml-2">({token.reading})</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{token.partOfSpeech[0]}</span>
                    </div>
                    {token.baseForm !== token.surface && (
                      <div className="text-sm text-gray-400 mt-1">
                        Base form: {token.baseForm}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Characters Tab */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Character Analysis</h4>
              <div className="grid grid-cols-8 gap-2">
                {text.split('').map((char, index) => {
                  const type = getCharacterType(char);
                  const colorClass = getCharacterColor(type);
                  return (
                    <div
                      key={index}
                      className={`text-center p-2 bg-gray-800 rounded ${colorClass}`}
                      title={`${char} (${type})`}
                    >
                      <div className="text-lg font-bold">{char}</div>
                      <div className="text-xs">{type}</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-xs text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-red-300">■</span> Kanji</div>
                  <div><span className="text-blue-300">■</span> Hiragana</div>
                  <div><span className="text-green-300">■</span> Katakana</div>
                  <div><span className="text-gray-300">■</span> Other</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Click words in the analysis tab for dictionary lookups</span>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationPopup;
