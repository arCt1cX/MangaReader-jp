import React, { createContext, useContext, useReducer, useEffect } from 'react';

const SettingsContext = createContext();

// Action types
const SETTINGS_ACTIONS = {
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  UPDATE_READING_MODE: 'UPDATE_READING_MODE',
  UPDATE_JAPANESE_HELPER: 'UPDATE_JAPANESE_HELPER',
  UPDATE_AUTO_TRANSLATE: 'UPDATE_AUTO_TRANSLATE',
  UPDATE_PAGE_TRANSITION: 'UPDATE_PAGE_TRANSITION',
  UPDATE_PAGE_SPACING: 'UPDATE_PAGE_SPACING',
  UPDATE_ZOOM_SETTINGS: 'UPDATE_ZOOM_SETTINGS',
  UPDATE_CUSTOM_SITES: 'UPDATE_CUSTOM_SITES',
  UPDATE_THEME: 'UPDATE_THEME',
  RESET_SETTINGS: 'RESET_SETTINGS'
};

// Default settings
const DEFAULT_SETTINGS = {
  readingMode: 'single', // 'single', 'double', 'scroll'
  pageTransition: 'slide', // 'slide', 'fade', 'none'
  pageSpacing: 5, // 0-10, distance between pages
  japaneseHelper: {
    enabled: true,
    showFurigana: true,
    autoOCR: false,
    dictionaryPopup: true,
    autoTranslate: false
  },
  zoom: {
    fitToWidth: true,
    defaultZoom: 100,
    maxZoom: 300,
    minZoom: 50
  },
  navigation: {
    swipeEnabled: true,
    tapToTurn: true,
    tapZones: {
      left: 30, // percentage
      right: 30,
      center: 40
    }
  },
  customSites: [],
  theme: 'standard', // 'standard', 'dark', 'light', 'amoled'
  language: 'en'
};

// Reducer
function settingsReducer(state, action) {
  switch (action.type) {
    case SETTINGS_ACTIONS.LOAD_SETTINGS:
      return { ...DEFAULT_SETTINGS, ...action.payload };

    case SETTINGS_ACTIONS.UPDATE_READING_MODE:
      return {
        ...state,
        readingMode: action.payload
      };

    case SETTINGS_ACTIONS.UPDATE_JAPANESE_HELPER:
      return {
        ...state,
        japaneseHelper: {
          ...state.japaneseHelper,
          ...action.payload
        }
      };

    case SETTINGS_ACTIONS.UPDATE_AUTO_TRANSLATE:
      return {
        ...state,
        japaneseHelper: {
          ...state.japaneseHelper,
          autoTranslate: action.payload
        }
      };

    case SETTINGS_ACTIONS.UPDATE_PAGE_TRANSITION:
      return {
        ...state,
        pageTransition: action.payload
      };

    case SETTINGS_ACTIONS.UPDATE_PAGE_SPACING:
      return {
        ...state,
        pageSpacing: action.payload
      };

    case SETTINGS_ACTIONS.UPDATE_ZOOM_SETTINGS:
      return {
        ...state,
        zoom: {
          ...state.zoom,
          ...action.payload
        }
      };

    case SETTINGS_ACTIONS.UPDATE_CUSTOM_SITES:
      return {
        ...state,
        customSites: action.payload
      };

    case SETTINGS_ACTIONS.UPDATE_THEME:
      return {
        ...state,
        theme: action.payload
      };

    case SETTINGS_ACTIONS.RESET_SETTINGS:
      return DEFAULT_SETTINGS;

    default:
      return state;
  }
}

// Provider component
export function SettingsProvider({ children }) {
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('mangaReaderSettings');
      if (savedSettings) {
        dispatch({
          type: SETTINGS_ACTIONS.LOAD_SETTINGS,
          payload: JSON.parse(savedSettings)
        });
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('mangaReaderSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [settings]);

  // Action creators
  const updateReadingMode = (mode) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_READING_MODE,
      payload: mode
    });
  };

  const updateJapaneseHelper = (helperSettings) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_JAPANESE_HELPER,
      payload: helperSettings
    });
  };

  const updateAutoTranslate = (enabled) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_AUTO_TRANSLATE,
      payload: enabled
    });
  };

  const updatePageTransition = (transition) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_PAGE_TRANSITION,
      payload: transition
    });
  };

  const updatePageSpacing = (spacing) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_PAGE_SPACING,
      payload: spacing
    });
  };

  const updateZoomSettings = (zoomSettings) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_ZOOM_SETTINGS,
      payload: zoomSettings
    });
  };

  const updateCustomSites = (sites) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_CUSTOM_SITES,
      payload: sites
    });
  };

  const updateTheme = (theme) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_THEME,
      payload: theme
    });
  };

  const resetSettings = () => {
    dispatch({
      type: SETTINGS_ACTIONS.RESET_SETTINGS
    });
  };

  const value = {
    settings,
    updateReadingMode,
    updateJapaneseHelper,
    updateAutoTranslate,
    updatePageTransition,
    updatePageSpacing,
    updateZoomSettings,
    updateCustomSites,
    updateTheme,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook to use settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
