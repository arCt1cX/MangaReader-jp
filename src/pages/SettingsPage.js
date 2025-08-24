import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const SettingsPage = () => {
  const { 
    settings, 
    updateReadingMode, 
    updateJapaneseHelper, 
    updatePageTransition,
    updateZoomSettings,
    updateTheme,
    resetSettings 
  } = useSettings();

  const handleJapaneseHelperChange = (key, value) => {
    updateJapaneseHelper({ [key]: value });
  };

  const handleZoomChange = (key, value) => {
    updateZoomSettings({ [key]: value });
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      resetSettings();
    }
  };

  return (
    <div className="min-h-screen bg-manga-dark pb-20">
      {/* Header */}
      <header className="bg-manga-gray shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-manga-text">
            ⚙️ Settings
          </h1>
          <p className="text-manga-text/70 mt-2">
            Customize your reading experience
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Reading Settings */}
        <section className="bg-manga-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            📖 Reading Settings
          </h2>
          
          <div className="space-y-6">
            {/* Reading Mode */}
            <div>
              <label className="block text-manga-text font-medium mb-2">
                Reading Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'single', label: 'Single Page' },
                  { value: 'double', label: 'Double Page' },
                  { value: 'scroll', label: 'Continuous Scroll' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updateReadingMode(mode.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      settings.readingMode === mode.value
                        ? 'bg-manga-accent border-manga-accent text-white'
                        : 'bg-manga-light border-manga-light text-manga-text hover:bg-manga-light/70'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Transition */}
            <div>
              <label className="block text-manga-text font-medium mb-2">
                Page Transition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'slide', label: 'Slide' },
                  { value: 'fade', label: 'Fade' },
                  { value: 'none', label: 'None' }
                ].map((transition) => (
                  <button
                    key={transition.value}
                    onClick={() => updatePageTransition(transition.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      settings.pageTransition === transition.value
                        ? 'bg-manga-accent border-manga-accent text-white'
                        : 'bg-manga-light border-manga-light text-manga-text hover:bg-manga-light/70'
                    }`}
                  >
                    {transition.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Settings */}
            <div>
              <label className="block text-manga-text font-medium mb-2">
                Zoom Settings
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-manga-text">Fit to width</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.zoom.fitToWidth}
                      onChange={(e) => handleZoomChange('fitToWidth', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-manga-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-manga-accent"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-manga-text/70 mb-2">
                    Default zoom: {settings.zoom.defaultZoom}%
                  </label>
                  <input
                    type="range"
                    min={settings.zoom.minZoom}
                    max={settings.zoom.maxZoom}
                    value={settings.zoom.defaultZoom}
                    onChange={(e) => handleZoomChange('defaultZoom', parseInt(e.target.value))}
                    className="w-full h-2 bg-manga-light rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Settings */}
        <section className="bg-manga-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            🎨 Theme
          </h2>
          
          <div>
            <label className="block text-manga-text font-medium mb-2">
              Color Scheme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'standard', label: '🌙 Standard', desc: 'Current dark gray theme' },
                { value: 'dark', label: '⚫ Dark Mode', desc: 'Pure black background' },
                { value: 'light', label: '☀️ Light Mode', desc: 'Clean white theme' },
                { value: 'amoled', label: '🌌 AMOLED', desc: 'Deep black with blue accents' }
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateTheme(theme.value)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    settings.theme === theme.value
                      ? 'bg-manga-accent border-manga-accent text-white'
                      : 'bg-manga-light border-manga-light text-manga-text hover:bg-manga-light/70'
                  }`}
                >
                  <div className="font-medium text-sm">{theme.label}</div>
                  <div className="text-xs opacity-70 mt-1">{theme.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Japanese Helper Settings */}
        <section className="bg-manga-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            🇯🇵 Japanese Helper
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-manga-text font-medium">Enable Japanese Helper</span>
                <p className="text-sm text-manga-text/70">OCR, dictionary, and translation features</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.japaneseHelper.enabled}
                  onChange={(e) => handleJapaneseHelperChange('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-manga-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-manga-accent"></div>
              </label>
            </div>

            {settings.japaneseHelper.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-manga-accent/30">
                <div className="flex items-center justify-between">
                  <span className="text-manga-text">Auto OCR on image load</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.japaneseHelper.autoOCR}
                      onChange={(e) => handleJapaneseHelperChange('autoOCR', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-manga-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-manga-accent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-manga-text">Show furigana</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.japaneseHelper.showFurigana}
                      onChange={(e) => handleJapaneseHelperChange('showFurigana', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-manga-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-manga-accent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-manga-text">Dictionary popup</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.japaneseHelper.dictionaryPopup}
                      onChange={(e) => handleJapaneseHelperChange('dictionaryPopup', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-manga-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-manga-accent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-manga-text">Auto translate</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.japaneseHelper.autoTranslate}
                      onChange={(e) => handleJapaneseHelperChange('autoTranslate', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-manga-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-manga-accent"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* About */}
        <section className="bg-manga-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            ℹ️ About
          </h2>
          <div className="space-y-4 text-sm text-manga-text/70">
            <p>
              <strong className="text-manga-text">Manga Reader PWA</strong> - A progressive web app for reading manga with Japanese learning features.
            </p>
            <p>
              Features OCR text extraction, dictionary lookup, and DeepL translation integration to help you learn Japanese while reading manga.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleResetSettings}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
