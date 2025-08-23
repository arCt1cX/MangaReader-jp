import React, { createContext, useContext, useState, useEffect } from 'react';

const LibraryContext = createContext();

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}

export function LibraryProvider({ children }) {
  const [library, setLibrary] = useState([]);
  const [customSites, setCustomSites] = useState([]);

  useEffect(() => {
    // Load from localStorage
    const savedLibrary = localStorage.getItem('manga-library');
    const savedCustomSites = localStorage.getItem('custom-sites');
    
    if (savedLibrary) {
      setLibrary(JSON.parse(savedLibrary));
    }
    
    if (savedCustomSites) {
      setCustomSites(JSON.parse(savedCustomSites));
    }
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('manga-library', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem('custom-sites', JSON.stringify(customSites));
  }, [customSites]);

  const addToLibrary = (manga) => {
    setLibrary(prev => {
      const existing = prev.find(m => m.id === manga.id && m.site === manga.site);
      if (existing) return prev;
      
      return [...prev, {
        ...manga,
        addedAt: new Date().toISOString(),
        currentChapter: null,
        readChapters: []
      }];
    });
  };

  const removeFromLibrary = (mangaId, site) => {
    setLibrary(prev => prev.filter(m => !(m.id === mangaId && m.site === site)));
  };

  const updateProgress = (mangaId, site, chapterId) => {
    setLibrary(prev => prev.map(manga => {
      if (manga.id === mangaId && manga.site === site) {
        return {
          ...manga,
          currentChapter: chapterId,
          readChapters: [...new Set([...manga.readChapters, chapterId])],
          lastRead: new Date().toISOString()
        };
      }
      return manga;
    }));
  };

  const addCustomSite = (site) => {
    setCustomSites(prev => [...prev, { ...site, id: Date.now().toString() }]);
  };

  const removeCustomSite = (siteId) => {
    setCustomSites(prev => prev.filter(site => site.id !== siteId));
  };

  const isInLibrary = (mangaId, site) => {
    return library.some(m => m.id === mangaId && m.site === site);
  };

  return (
    <LibraryContext.Provider value={{
      library,
      customSites,
      addToLibrary,
      removeFromLibrary,
      updateProgress,
      addCustomSite,
      removeCustomSite,
      isInLibrary
    }}>
      {children}
    </LibraryContext.Provider>
  );
}
