import React from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';

const MANGA_SOURCES = [
  {
    id: 'mangadex',
    name: 'MangaDex',
    description: 'High-quality manga with multiple languages',
    color: 'bg-orange-600 hover:bg-orange-700'
  },
  {
    id: 'manganato',
    name: 'MangaNato',
    description: 'Large collection of manga series',
    color: 'bg-purple-600 hover:bg-purple-700'
  }
];

export default function Home() {
  const { library, customSites } = useLibrary();

  const recentlyRead = library
    .filter(manga => manga.lastRead)
    .sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))
    .slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Manga Reader JP</h1>
        <p className="text-gray-400">Read manga with Japanese learning features</p>
      </div>

      {/* Recently Read */}
      {recentlyRead.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Continue Reading</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentlyRead.map((manga) => (
              <Link
                key={`${manga.site}-${manga.id}`}
                to={`/reader/${manga.site}/${manga.id}/${manga.currentChapter || ''}`}
                className="group"
              >
                <div className="bg-gray-800 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                  {manga.cover && (
                    <img
                      src={manga.cover}
                      alt={manga.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white truncate">{manga.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{manga.site}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {library.length === 0 && (
        <div className="text-center py-12 mb-8">
          <h1 className="text-2xl font-bold text-white mb-4">Your Library</h1>
          <p className="text-gray-400 mb-6">You haven't saved any manga yet.</p>
          <Link
            to="/search"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white transition-colors"
          >
            Browse Manga
          </Link>
        </div>
      )}

      {/* Manga Sources */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Manga Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MANGA_SOURCES.map((source) => (
            <Link
              key={source.id}
              to={`/search/${source.id}`}
              className={`p-6 rounded-lg transition-colors ${source.color}`}
            >
              <h3 className="text-lg font-semibold text-white mb-2">{source.name}</h3>
              <p className="text-white/80 text-sm">{source.description}</p>
            </Link>
          ))}

          {/* Custom Sites */}
          {customSites.map((site) => (
            <Link
              key={site.id}
              to={`/search/custom?siteId=${site.id}`}
              className="p-6 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{site.name}</h3>
              <p className="text-white/80 text-sm">Custom manga source</p>
            </Link>
          ))}

          {/* Add Custom Site */}
          <Link
            to="/settings"
            className="p-6 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors flex flex-col items-center justify-center"
          >
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-white text-lg">+</span>
            </div>
            <span className="text-gray-400 text-sm">Add Custom Site</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Library</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{library.length}</div>
            <div className="text-sm text-gray-400">Manga Saved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {library.reduce((total, manga) => total + (manga.readChapters?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Chapters Read</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{customSites.length}</div>
            <div className="text-sm text-gray-400">Custom Sites</div>
          </div>
        </div>
      </div>
    </div>
  );
}
