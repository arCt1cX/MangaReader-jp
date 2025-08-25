import React from 'react';
import { useLibrary } from '../contexts/LibraryContext';
import { useNavigate } from 'react-router-dom';
import MangaCard from '../components/MangaCard';
import Icon from '../components/Icon';

const LibraryPage = () => {
  const { getLibraryArray, clearLibrary } = useLibrary();
  const navigate = useNavigate();
  const library = getLibraryArray();

  const handleMangaClick = (manga) => {
    navigate(`/manga/${manga.site}/${encodeURIComponent(manga.id)}`, {
      state: { 
        mangaData: manga,
        fromLibrary: true,
        from: '/library' // Pass current page for back navigation
      }
    });
  };

  const handleClearLibrary = () => {
    if (window.confirm('Are you sure you want to clear your entire library? This cannot be undone.')) {
      clearLibrary();
    }
  };

  return (
    <div className="min-h-screen bg-manga-dark pb-20">
      {/* Header */}
      <header className="bg-manga-gray shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-manga-text">
              📚 My Library
            </h1>
            {library.length > 0 && (
              <button
                onClick={handleClearLibrary}
                className="text-red-400 hover:text-red-300 text-sm underline"
              >
                Clear All
              </button>
            )}
          </div>
          <p className="text-manga-text/70 mt-2">
            {library.length} manga in your library
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {library.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {library.map((manga) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                onClick={() => handleMangaClick(manga)}
                showProgress={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Icon name="library" size={64} className="text-manga-text/30" />
            </div>
            <h3 className="text-xl font-semibold text-manga-text mb-2">
              Your library is empty
            </h3>
            <p className="text-manga-text/70 mb-6">
              Start adding manga to your library to track your reading progress.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-manga-accent hover:opacity-90 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Icon name="search" size={16} />
              Browse Manga
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
