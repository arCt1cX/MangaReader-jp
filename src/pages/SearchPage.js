import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import MangaCard from '../components/MangaCard';
import Icon from '../components/Icon';

const SearchPage = () => {
  const { site } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial state from URL parameters
  const initialQuery = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page')) || 1;
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Clean up old cache entries on component mount
  useEffect(() => {
    const cleanupCache = () => {
      const keys = Object.keys(localStorage);
      const searchKeys = keys.filter(key => key.startsWith('search_'));
      const now = Date.now();
      
      searchKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          // Remove cache older than 30 minutes
          if (now - data.timestamp > 30 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Remove invalid cache entries
          localStorage.removeItem(key);
        }
      });
    };
    
    cleanupCache();
  }, []);

  const performSearch = useCallback(async (searchQuery, searchPage = 1, replace = false) => {
    if (!searchQuery.trim() && searchQuery !== 'popular') return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.searchManga(site, searchQuery, searchPage);
      
      if (response.success) {
        const newResults = response.data.manga || [];
        let updatedResults;
        
        if (replace) {
          updatedResults = newResults;
          setResults(newResults);
        } else {
          updatedResults = [...results, ...newResults];
          setResults(prev => [...prev, ...newResults]);
        }
        
        setHasMore(response.data.hasMore || false);
        setPage(searchPage);
        
        // Cache search results in localStorage for quick restoration
        const searchKey = `search_${site}_${searchQuery}_${searchPage}`;
        const cacheData = {
          results: updatedResults,
          query: searchQuery,
          page: searchPage,
          hasMore: response.data.hasMore || false,
          timestamp: Date.now()
        };
        localStorage.setItem(searchKey, JSON.stringify(cacheData));
        
        // Update URL parameters to persist search state
        const newSearchParams = new URLSearchParams();
        if (searchQuery && searchQuery !== 'popular') {
          newSearchParams.set('q', searchQuery);
        }
        if (searchPage > 1) {
          newSearchParams.set('page', searchPage.toString());
        }
        setSearchParams(newSearchParams, { replace: true });
        
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [site, setSearchParams, results]);

  useEffect(() => {
    // Initialize search state from URL parameters when component mounts
    if (!isInitialized) {
      if (initialQuery) {
        // Try to restore from localStorage first for faster loading
        const searchKey = `search_${site}_${initialQuery}_${initialPage}`;
        const cachedData = localStorage.getItem(searchKey);
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            // Check if cache is less than 5 minutes old
            const isRecentCache = Date.now() - parsed.timestamp < 5 * 60 * 1000;
            
            if (isRecentCache && parsed.results && parsed.results.length > 0) {
              console.log('📦 Restoring search from cache:', { query: initialQuery, page: initialPage });
              setResults(parsed.results);
              setPage(parsed.page);
              setHasMore(parsed.hasMore);
              setIsInitialized(true);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse cached search data:', e);
          }
        }
        
        // Cache miss or expired, fetch from API
        console.log('🔄 Restoring search state from API:', { query: initialQuery, page: initialPage });
        
        // If we're on page > 1, we need to load all previous pages to maintain infinite scroll
        if (initialPage > 1) {
          // Load all pages from 1 to initialPage
          const loadAllPages = async () => {
            setLoading(true);
            try {
              let allResults = [];
              for (let p = 1; p <= initialPage; p++) {
                const response = await apiService.searchManga(site, initialQuery, p);
                if (response.success) {
                  allResults = [...allResults, ...(response.data.manga || [])];
                  if (p === initialPage) {
                    setHasMore(response.data.hasMore || false);
                  }
                } else {
                  throw new Error(response.error || 'Search failed');
                }
              }
              setResults(allResults);
              setPage(initialPage);
              
              // Cache the complete results
              const cacheData = {
                results: allResults,
                query: initialQuery,
                page: initialPage,
                hasMore: response.data.hasMore || false,
                timestamp: Date.now()
              };
              localStorage.setItem(searchKey, JSON.stringify(cacheData));
              
            } catch (err) {
              setError('Failed to restore search results');
              console.error('Search restore error:', err);
            } finally {
              setLoading(false);
              setIsInitialized(true);
            }
          };
          loadAllPages();
        } else {
          // Just load the first page
          performSearch(initialQuery, 1, true);
        }
      } else {
        // No query in URL, load popular manga
        performSearch('popular', 1, true);
      }
    }
  }, [site, initialQuery, initialPage, performSearch, isInitialized]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setResults([]);
      setPage(1);
      setIsInitialized(false); // Reset initialization to allow new search
      performSearch(query, 1, true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      performSearch(query || 'popular', page + 1, false);
    }
  };

  const handleMangaClick = (manga) => {
    // Preserve current search state in navigation
    const currentSearchParams = new URLSearchParams();
    if (query && query !== 'popular') {
      currentSearchParams.set('q', query);
    }
    if (page > 1) {
      currentSearchParams.set('page', page.toString());
    }
    
    const searchUrl = `/search/${site}${currentSearchParams.toString() ? `?${currentSearchParams.toString()}` : ''}`;
    
    navigate(`/manga/${site}/${encodeURIComponent(manga.id)}`, {
      state: { 
        mangaData: manga,
        fromSearch: true,
        from: searchUrl // Pass current search URL with parameters
      }
    });
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
          {/* Back Button - Larger and Better Positioned */}
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-12 h-12 bg-manga-light text-manga-text hover:bg-manga-accent hover:text-white rounded-full transition-all duration-200 shadow-lg mr-4"
              aria-label="Go back to home"
            >
              <Icon name="arrowLeft" size={20} />
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
              className="bg-manga-accent hover:opacity-90 disabled:bg-manga-light disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              {loading ? <Icon name="loading" size={16} /> : <Icon name="search" size={16} />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="error" size={20} color="#fca5a5" />
              <p className="text-red-300">{error}</p>
            </div>
            <button
              onClick={() => performSearch(query || 'popular', 1, true)}
              className="text-red-400 hover:text-red-300 text-sm underline"
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
            <div className="flex justify-center mb-4">
              <Icon name="bookOpen" size={64} className="text-manga-text/30" />
            </div>
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
