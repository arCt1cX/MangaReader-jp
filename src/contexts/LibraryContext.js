import React, { createContext, useContext, useReducer, useEffect } from 'react';

const LibraryContext = createContext();

// Action types
const LIBRARY_ACTIONS = {
  LOAD_LIBRARY: 'LOAD_LIBRARY',
  ADD_MANGA: 'ADD_MANGA',
  REMOVE_MANGA: 'REMOVE_MANGA',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  UPDATE_LAST_READ: 'UPDATE_LAST_READ',
  MARK_CHAPTER_READ: 'MARK_CHAPTER_READ',
  CLEAR_LIBRARY: 'CLEAR_LIBRARY'
};

// Reducer
function libraryReducer(state, action) {
  switch (action.type) {
    case LIBRARY_ACTIONS.LOAD_LIBRARY:
      return action.payload;

    case LIBRARY_ACTIONS.ADD_MANGA:
      return {
        ...state,
        [action.payload.id]: {
          ...action.payload,
          addedAt: new Date().toISOString(),
          lastRead: null,
          currentChapter: null,
          chaptersRead: []
        }
      };

    case LIBRARY_ACTIONS.REMOVE_MANGA:
      const newState = { ...state };
      delete newState[action.payload];
      return newState;

    case LIBRARY_ACTIONS.UPDATE_PROGRESS:
      const { mangaId, chapterNumber, pageNumber, totalPages } = action.payload;
      return {
        ...state,
        [mangaId]: {
          ...state[mangaId],
          currentChapter: chapterNumber,
          currentPage: pageNumber,
          totalPages: totalPages,
          lastRead: new Date().toISOString(),
          chaptersRead: state[mangaId]?.chaptersRead?.includes(chapterNumber)
            ? state[mangaId].chaptersRead
            : [...(state[mangaId]?.chaptersRead || []), chapterNumber]
        }
      };

    case LIBRARY_ACTIONS.UPDATE_LAST_READ:
      return {
        ...state,
        [action.payload.mangaId]: {
          ...state[action.payload.mangaId],
          lastRead: new Date().toISOString()
        }
      };

    case LIBRARY_ACTIONS.MARK_CHAPTER_READ:
      const { mangaId: readMangaId, chapterNumber: readChapter } = action.payload;
      if (!state[readMangaId]) return state; // Not in library, don't track
      
      return {
        ...state,
        [readMangaId]: {
          ...state[readMangaId],
          currentChapter: readChapter,
          lastRead: new Date().toISOString(),
          chaptersRead: state[readMangaId]?.chaptersRead?.includes(readChapter)
            ? state[readMangaId].chaptersRead
            : [...(state[readMangaId]?.chaptersRead || []), readChapter].sort((a, b) => a - b)
        }
      };

    case LIBRARY_ACTIONS.CLEAR_LIBRARY:
      return {};

    default:
      return state;
  }
}

// Provider component
export function LibraryProvider({ children }) {
  const [library, dispatch] = useReducer(libraryReducer, {});

  // Load library from localStorage on mount
  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem('mangaLibrary');
      if (savedLibrary) {
        dispatch({
          type: LIBRARY_ACTIONS.LOAD_LIBRARY,
          payload: JSON.parse(savedLibrary)
        });
      }
    } catch (error) {
      console.error('Error loading library from localStorage:', error);
    }
  }, []);

  // Save library to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('mangaLibrary', JSON.stringify(library));
    } catch (error) {
      console.error('Error saving library to localStorage:', error);
    }
  }, [library]);

  // Action creators
  const addManga = (manga) => {
    dispatch({
      type: LIBRARY_ACTIONS.ADD_MANGA,
      payload: manga
    });
  };

  const removeManga = (mangaId) => {
    dispatch({
      type: LIBRARY_ACTIONS.REMOVE_MANGA,
      payload: mangaId
    });
  };

  const updateProgress = (mangaId, chapterNumber, pageNumber, totalPages) => {
    dispatch({
      type: LIBRARY_ACTIONS.UPDATE_PROGRESS,
      payload: { mangaId, chapterNumber, pageNumber, totalPages }
    });
  };

  const updateLastRead = (mangaId) => {
    dispatch({
      type: LIBRARY_ACTIONS.UPDATE_LAST_READ,
      payload: { mangaId }
    });
  };

  const markChapterRead = (mangaId, chapterNumber) => {
    dispatch({
      type: LIBRARY_ACTIONS.MARK_CHAPTER_READ,
      payload: { mangaId, chapterNumber }
    });
  };

  const clearLibrary = () => {
    dispatch({
      type: LIBRARY_ACTIONS.CLEAR_LIBRARY
    });
  };

  // Helper functions
  const isMangaInLibrary = (mangaId) => {
    return library.hasOwnProperty(mangaId);
  };

  const getMangaProgress = (mangaId) => {
    return library[mangaId] || null;
  };

  const getLibraryArray = () => {
    return Object.values(library).sort((a, b) => 
      new Date(b.lastRead || b.addedAt) - new Date(a.lastRead || a.addedAt)
    );
  };

  const getRecentlyRead = (limit = 5) => {
    return Object.values(library)
      .filter(manga => manga.lastRead)
      .sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))
      .slice(0, limit);
  };

  const isChapterRead = (mangaId, chapterNumber) => {
    const manga = library[mangaId];
    return manga?.chaptersRead?.includes(chapterNumber) || false;
  };

  const getNextUnreadChapter = (mangaId, chapters) => {
    const manga = library[mangaId];
    if (!manga || !chapters || chapters.length === 0) return null;
    
    // Sort chapters by number (ascending)
    const sortedChapters = [...chapters].sort((a, b) => {
      const aNum = parseFloat(a.number || a.id);
      const bNum = parseFloat(b.number || b.id);
      return aNum - bNum;
    });
    
    // Find first unread chapter
    for (const chapter of sortedChapters) {
      const chapterNum = parseFloat(chapter.number || chapter.id);
      if (!manga.chaptersRead?.includes(chapterNum)) {
        return chapter;
      }
    }
    
    // All chapters read, return last chapter
    return sortedChapters[sortedChapters.length - 1];
  };

  const value = {
    library,
    addManga,
    removeManga,
    updateProgress,
    updateLastRead,
    markChapterRead,
    clearLibrary,
    isMangaInLibrary,
    getMangaProgress,
    getLibraryArray,
    getRecentlyRead,
    isChapterRead,
    getNextUnreadChapter
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

// Hook to use library context
export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}

export default LibraryContext;
