import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeKuromoji } from '../utils/japanese';

const JapaneseContext = createContext();

export function useJapanese() {
  const context = useContext(JapaneseContext);
  if (!context) {
    throw new Error('useJapanese must be used within a JapaneseProvider');
  }
  return context;
}

export function JapaneseProvider({ children }) {
  const [isJapaneseMode, setIsJapaneseMode] = useState(false);
  const [tokenizer, setTokenizer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('japanese-mode');
    if (savedMode === 'true') {
      setIsJapaneseMode(true);
      initializeJapaneseMode();
    }
  }, []);

  const initializeJapaneseMode = async () => {
    setIsLoading(true);
    try {
      const kuromojiTokenizer = await initializeKuromoji();
      setTokenizer(kuromojiTokenizer);
    } catch (error) {
      console.error('Failed to initialize Japanese mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJapaneseMode = async () => {
    const newMode = !isJapaneseMode;
    setIsJapaneseMode(newMode);
    localStorage.setItem('japanese-mode', newMode.toString());

    if (newMode && !tokenizer) {
      await initializeJapaneseMode();
    }
  };

  return (
    <JapaneseContext.Provider value={{
      isJapaneseMode,
      tokenizer,
      isLoading,
      toggleJapaneseMode
    }}>
      {children}
    </JapaneseContext.Provider>
  );
}
