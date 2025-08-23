import React, { useState } from 'react';
import { useLibrary } from '../contexts/LibraryContext';
import { useJapanese } from '../contexts/JapaneseContext';

export default function Settings() {
  const { customSites, addCustomSite, removeCustomSite } = useLibrary();
  const { isJapaneseMode, toggleJapaneseMode } = useJapanese();
  
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    baseUrl: '',
    chaptersSelector: '',
    titleSelector: '',
    linkSelector: '',
    imagesSelector: ''
  });

  const handleAddSite = (e) => {
    e.preventDefault();
    if (!newSite.name || !newSite.baseUrl) return;
    
    addCustomSite(newSite);
    setNewSite({
      name: '',
      baseUrl: '',
      chaptersSelector: '',
      titleSelector: '',
      linkSelector: '',
      imagesSelector: ''
    });
    setShowAddSite(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* Japanese Mode */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Japanese Learning Mode</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 mb-1">Enable OCR and translation features</p>
            <p className="text-sm text-gray-400">
              Click on manga pages to extract and translate Japanese text
            </p>
          </div>
          <button
            onClick={toggleJapaneseMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isJapaneseMode ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isJapaneseMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Custom Sites */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Custom Manga Sites</h2>
          <button
            onClick={() => setShowAddSite(!showAddSite)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm transition-colors"
          >
            Add Site
          </button>
        </div>

        {/* Add Site Form */}
        {showAddSite && (
          <form onSubmit={handleAddSite} className="mb-6 p-4 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  placeholder="My Manga Site"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Base URL
                </label>
                <input
                  type="url"
                  value={newSite.baseUrl}
                  onChange={(e) => setNewSite(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Chapters Selector
                </label>
                <input
                  type="text"
                  value={newSite.chaptersSelector}
                  onChange={(e) => setNewSite(prev => ({ ...prev, chaptersSelector: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  placeholder=".chapter-list .chapter-item"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title Selector
                </label>
                <input
                  type="text"
                  value={newSite.titleSelector}
                  onChange={(e) => setNewSite(prev => ({ ...prev, titleSelector: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  placeholder=".chapter-title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Link Selector
                </label>
                <input
                  type="text"
                  value={newSite.linkSelector}
                  onChange={(e) => setNewSite(prev => ({ ...prev, linkSelector: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  placeholder="a"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Images Selector
                </label>
                <input
                  type="text"
                  value={newSite.imagesSelector}
                  onChange={(e) => setNewSite(prev => ({ ...prev, imagesSelector: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  placeholder=".page-image img"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm transition-colors"
              >
                Add Site
              </button>
              <button
                type="button"
                onClick={() => setShowAddSite(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Custom Sites List */}
        {customSites.length > 0 ? (
          <div className="space-y-3">
            {customSites.map((site) => (
              <div key={site.id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <div>
                  <h3 className="text-white font-medium">{site.name}</h3>
                  <p className="text-gray-400 text-sm">{site.baseUrl}</p>
                </div>
                <button
                  onClick={() => removeCustomSite(site.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No custom sites added yet</p>
        )}
      </div>
    </div>
  );
}
