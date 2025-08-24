import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import MangaCard from '../components/MangaCard';

const SearchPage = () => {
  const { site } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Auto-search popular manga when page loads
    if (!query) {
      performSearch('popular', 1, true);
    }
  }, [site]);

  const performSearch = async (searchQuery, searchPage = 1, replace = false) => {
    if (!searchQuery.trim() && searchQuery !== 'popular') return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.searchManga(site, searchQuery, searchPage);
      
      if (response.success) {
        if (replace) {
          setResults(response.data.manga || []);
        } else {
          setResults(prev => [...prev, ...(response.data.manga || [])]);
        }
        setHasMore(response.data.hasMore || false);
        setPage(searchPage);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setResults([]);
      setPage(1);
      performSearch(query, 1, true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      performSearch(query || 'popular', page + 1, false);
    }
  };

  const handleMangaClick = (manga) => {
    navigate(`/manga/${site}/${encodeURIComponent(manga.id)}`);
  };

  const getSiteName = () => {
    const siteNames = {
      'mangaworld': 'MangaWorld'
    };
    return siteNames[site] || site;
  };

  return (
    <div className="min-h-screen bg-manga-dark pb-20">
      {/* Header */}
      <header className="bg-manga-gray shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-manga-accent hover:text-manga-text transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-manga-text flex-1">
              Search {getSiteName()}
            </h1>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search manga titles..."
              className="flex-1 bg-manga-light text-manga-text px-4 py-2 rounded-lg border border-manga-light focus:border-manga-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-manga-accent hover:bg-blue-600 disabled:bg-manga-light text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? '🔄' : '🔍'}
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">❌ {error}</p>
            <button
              onClick={() => performSearch(query || 'popular', 1, true)}
              className="text-red-400 hover:text-red-300 text-sm mt-2 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-manga-text/70">
                {query ? `Search results for "${query}"` : 'Popular manga'} • {results.length} results
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {results.map((manga, index) => (
                <MangaCard
                  key={`${manga.id}-${index}`}
                  manga={manga}
                  onClick={() => handleMangaClick(manga)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-manga-gray hover:bg-manga-light disabled:opacity-50 text-manga-text px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Loading...
                    </div>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        ) : !loading && !error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-manga-text mb-2">
              {query ? 'No results found' : 'Start searching'}
            </h3>
            <p className="text-manga-text/70">
              {query 
                ? `No manga found for "${query}". Try a different search term.`
                : 'Enter a manga title to search or browse popular titles.'
              }
            </p>
          </div>
        ) : null}

        {/* Loading Indicator */}
        {loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-manga-text/70 mt-4">Searching manga...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
