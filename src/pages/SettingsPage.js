import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import imageCache from '../services/imageCacheService';

const SettingsPage = () => {
  const { 
    settings, 
    updateReadingMode, 
    updateJapaneseHelper, 
    updatePageTransition,
    updatePageSpacing,
    updateZoomSettings,
    updateTheme,
    resetSettings,
    getCacheStats,
    clearCache
  } = useSettings();

  const [cacheStats, setCacheStats] = useState({ count: 0, totalSizeMB: '0.00' });
  const [imageCacheStats, setImageCacheStats] = useState({ count: 0, totalSizeMB: '0.00' });

  // Update cache stats on component mount and periodically
  useEffect(() => {
    const updateStats = async () => {
      setCacheStats(getCacheStats());
      const imageStats = await imageCache.getStats();
      setImageCacheStats(imageStats);
    };

    updateStats(); // Initial load
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [getCacheStats]);

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

  const handleClearCache = () => {
    if (window.confirm(`Clear ${cacheStats.count} cached chapters (${cacheStats.totalSizeMB} MB)? This will free up memory but chapters will need to be reloaded.`)) {
      const clearedStats = clearCache();
      setCacheStats({ count: 0, totalSizeMB: '0.00' });
      alert(`Cache cleared! Freed ${clearedStats.totalSizeMB} MB of memory.`);
    }
  };

  const handleClearImageCache = async () => {
    if (window.confirm(`Clear ${imageCacheStats.count} cached images (${imageCacheStats.totalSizeMB} MB)? This will free up storage but images will need to be redownloaded.`)) {
      const clearedStats = await imageCache.clear();
      setImageCacheStats({ count: 0, totalSizeMB: '0.00' });
      alert(`Image cache cleared! Freed ${clearedStats.totalSizeMB} MB of storage.`);
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
                  <div>
                    <span className="text-manga-text">Use zoom control</span>
                    <p className="text-xs text-manga-text/70">When enabled, zoom slider controls image size. When disabled, images use natural size.</p>
                  </div>
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
                    Zoom level: {settings.zoom.defaultZoom}% 
                    {settings.zoom.defaultZoom < 100 && ' (Smaller)'}
                    {settings.zoom.defaultZoom === 100 && ' (Original)'}
                    {settings.zoom.defaultZoom > 100 && ' (Larger)'}
                  </label>
                  <input
                    type="range"
                    min={settings.zoom.minZoom}
                    max={settings.zoom.maxZoom}
                    value={settings.zoom.defaultZoom}
                    onChange={(e) => handleZoomChange('defaultZoom', parseInt(e.target.value))}
                    className="w-full h-2 bg-manga-light rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-manga-text/50 mt-1">
                    <span>{settings.zoom.minZoom}%</span>
                    <span>{settings.zoom.maxZoom}%</span>
                  </div>
                  {!settings.zoom.fitToWidth && (
                    <p className="text-xs text-orange-400 mt-2">
                      ⚠️ Enable "Use zoom control" above to see zoom changes
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Page Spacing Settings */}
            <div>
              <label className="block text-manga-text font-medium mb-2">
                Page Spacing
              </label>
              <div>
                <label className="block text-sm text-manga-text/70 mb-2">
                  Distance between pages: {settings.pageSpacing}
                  {settings.pageSpacing === 0 && ' (No gap)'}
                  {settings.pageSpacing > 0 && settings.pageSpacing <= 3 && ' (Close)'}
                  {settings.pageSpacing > 3 && settings.pageSpacing <= 7 && ' (Medium)'}
                  {settings.pageSpacing > 7 && ' (Far)'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={settings.pageSpacing}
                  onChange={(e) => updatePageSpacing(parseInt(e.target.value))}
                  className="w-full h-2 bg-manga-light rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-manga-text/50 mt-1">
                  <span>0 (Attached)</span>
                  <span>10 (Far apart)</span>
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

        {/* Cache Management */}
        <section className="bg-manga-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-manga-text mb-4">
            💾 Cache Management
          </h2>
          
          <div className="space-y-6">
            {/* Chapter Cache */}
            <div>
              <h3 className="text-lg font-medium text-manga-text mb-3">Chapter Cache</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-manga-light rounded-lg p-4">
                  <div className="text-2xl font-bold text-manga-accent">
                    {cacheStats.count}
                  </div>
                  <div className="text-sm text-manga-text/70">
                    Cached Chapters
                  </div>
                </div>
                
                <div className="bg-manga-light rounded-lg p-4">
                  <div className="text-2xl font-bold text-manga-accent">
                    {cacheStats.totalSizeMB} MB
                  </div>
                  <div className="text-sm text-manga-text/70">
                    Memory Used
                  </div>
                </div>
              </div>

              <div className="text-sm text-manga-text/70 mb-4">
                <p className="mb-1">
                  📦 <strong>Duration:</strong> 30 minutes per chapter
                </p>
                <p className="mb-1">
                  � <strong>Storage:</strong> Browser memory (localStorage)
                </p>
              </div>

              <button
                onClick={handleClearCache}
                disabled={cacheStats.count === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  cacheStats.count === 0
                    ? 'bg-manga-light text-manga-text/50 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                🗑️ Clear Chapter Cache ({cacheStats.count} chapters)
              </button>
              {cacheStats.count === 0 && (
                <p className="text-xs text-manga-text/50 mt-2">
                  No cached chapters to clear
                </p>
              )}
            </div>

            {/* Image Cache */}
            <div className="border-t border-manga-light pt-6">
              <h3 className="text-lg font-medium text-manga-text mb-3">Image Cache</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-manga-light rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {imageCacheStats.count}
                  </div>
                  <div className="text-sm text-manga-text/70">
                    Cached Images
                  </div>
                </div>
                
                <div className="bg-manga-light rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {imageCacheStats.totalSizeMB} MB
                  </div>
                  <div className="text-sm text-manga-text/70">
                    Storage Used
                  </div>
                </div>
              </div>

              <div className="text-sm text-manga-text/70 mb-4">
                <p className="mb-1">
                  📦 <strong>Duration:</strong> 7 days per image
                </p>
                <p className="mb-1">
                  💾 <strong>Storage:</strong> Browser database (IndexedDB)
                </p>
                <p className="mb-1">
                  🖼️ <strong>Content:</strong> Manga cover images
                </p>
              </div>

              <button
                onClick={handleClearImageCache}
                disabled={imageCacheStats.count === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageCacheStats.count === 0
                    ? 'bg-manga-light text-manga-text/50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                🗑️ Clear Image Cache ({imageCacheStats.count} images)
              </button>
              {imageCacheStats.count === 0 && (
                <p className="text-xs text-manga-text/50 mt-2">
                  No cached images to clear
                </p>
              )}
            </div>

            <div className="text-sm text-manga-text/70 bg-manga-light rounded-lg p-4">
              <p className="mb-2">
                🚀 <strong>Benefits:</strong> Faster loading, reduced bandwidth usage
              </p>
              <p>
                🔄 <strong>Auto-cleanup:</strong> Expired content is automatically removed
              </p>
            </div>
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
