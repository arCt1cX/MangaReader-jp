import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';

export default function Library() {
  const { library, removeFromLibrary } = useLibrary();
  const [sortBy, setSortBy] = useState('lastRead');

  const sortedLibrary = [...library].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'addedAt':
        return new Date(b.addedAt) - new Date(a.addedAt);
      case 'lastRead':
        if (!a.lastRead && !b.lastRead) return 0;
        if (!a.lastRead) return 1;
        if (!b.lastRead) return -1;
        return new Date(b.lastRead) - new Date(a.lastRead);
      default:
        return 0;
    }
  });

  if (library.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Your Library</h1>
          <p className="text-gray-400 mb-6">You haven't saved any manga yet.</p>
          <Link
            to="/search"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white transition-colors"
          >
            Browse Manga
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Your Library</h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="lastRead">Last Read</option>
          <option value="title">Title</option>
          <option value="addedAt">Date Added</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {sortedLibrary.map((manga) => (
          <div key={`${manga.site}-${manga.id}`} className="bg-gray-800 rounded-lg overflow-hidden group">
            <Link to={`/reader/${manga.site}/${manga.id}/${manga.currentChapter || ''}`}>
              {manga.cover && (
                <img
                  src={manga.cover}
                  alt={manga.title}
                  className="w-full h-48 object-cover group-hover:opacity-75 transition-opacity"
                />
              )}
              <div className="p-3">
                <h3 className="text-sm font-medium text-white truncate mb-1">{manga.title}</h3>
                <p className="text-xs text-gray-400 mb-2">{manga.site}</p>
                {manga.readChapters.length > 0 && (
                  <p className="text-xs text-green-400">
                    {manga.readChapters.length} chapters read
                  </p>
                )}
              </div>
            </Link>
            <div className="px-3 pb-3">
              <button
                onClick={() => removeFromLibrary(manga.id, manga.site)}
                className="w-full text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove from Library
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
