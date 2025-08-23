import React, { useState, useEffect } from 'react';
import { lookupWord, translateText } from '../utils/api';

export default function JapaneseTextPopup({ text, position, onClose }) {
  const [dictionaryData, setDictionaryData] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (text.loading) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [dictResult, transResult] = await Promise.all([
          lookupWord(text.text),
          translateText(text.text)
        ]);
        
        setDictionaryData(dictResult);
        setTranslation(transResult);
      } catch (error) {
        console.error('Failed to load text data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [text]);

  if (text.loading || loading) {
    return (
      <div
        className="jp-popup"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const firstEntry = dictionaryData?.data?.[0];

  return (
    <div
      className="jp-popup"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y, window.innerHeight - 200),
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-white">{text.text}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-xl"
        >
          ×
        </button>
      </div>

      {/* DeepL Translation */}
      {translation && (
        <div className="mb-4 p-3 bg-blue-900/30 rounded">
          <h4 className="text-sm font-medium text-blue-300 mb-1">Translation</h4>
          <p className="text-white">{translation.translatedText}</p>
        </div>
      )}

      {/* Dictionary Entry */}
      {firstEntry && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-green-300 mb-1">Reading</h4>
            <p className="text-white">
              {firstEntry.japanese[0]?.reading || 'N/A'}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-yellow-300 mb-1">Meanings</h4>
            <ul className="text-white text-sm space-y-1">
              {firstEntry.senses?.slice(0, 3).map((sense, index) => (
                <li key={index}>
                  • {sense.english_definitions.join(', ')}
                  {sense.parts_of_speech?.length > 0 && (
                    <span className="text-gray-400 ml-2">
                      ({sense.parts_of_speech.join(', ')})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
