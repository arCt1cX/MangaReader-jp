import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { searchManga, getChapters } from '../utils/api';
import { useLibrary } from '../contexts/LibraryContext';
import LoadingSpinner from '../components/LoadingSpinner';

const MANGA_SOURCES = [
  { id: 'mangadx', name: 'MangaDx' },
  { id: 'manganato', name: 'MangaNato' }
];

export default function Search() {
  const { site } = useParams();
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  
  const [selectedSite, setSelectedSite] = useState(site || 'mangadx');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await searchManga(selectedSite, query.trim());
      setResults(data);
    } catch (err) {
      setError('Failed to search manga');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (manga) => {
    try {
      // Get first chapter to set up reading
      const chaptersData = await getChapters(selectedSite, manga.id);
      const firstChapter = chaptersData.chapters[0];
      
      addToLibrary({
        ...manga,
        site: selectedSite,
        currentChapter: firstChapter?.id || null
      });
    } catch (error) {
      console.error('Failed to add to library:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Search Manga</h1>

      {/* Site Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {MANGA_SOURCES.map((source) => (
            <button
              key={source.id}
              onClick={() => setSelectedSite(source.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedSite === source.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {source.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for manga..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg text-white transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {loading && <LoadingSpinner text="Searching..." />}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((manga) => (
            <div key={manga.id} className="bg-gray-800 rounded-lg overflow-hidden">
              {manga.cover && (
                <img
                  src={manga.cover}
                  alt={manga.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {manga.title}
                </h3>
                {manga.author && (
                  <p className="text-sm text-gray-400 mb-2">by {manga.author}</p>
                )}
                {manga.description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                    {manga.description}
                  </p>
                )}
                
                <div className="flex gap-2">
                  <Link
                    to={`/reader/${selectedSite}/${manga.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white text-sm text-center transition-colors"
                  >
                    Read
                  </Link>
                  
                  {isInLibrary(manga.id, selectedSite) ? (
                    <button
                      onClick={() => removeFromLibrary(manga.id, selectedSite)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToLibrary(manga)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-gray-400">No manga found for "{query}"</p>
        </div>
      )}
    </div>
  );
}