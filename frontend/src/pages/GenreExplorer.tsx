import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { GenreCategory } from '../types/music';
import { Compass } from 'lucide-react';

export const GenreExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<GenreCategory[]>([]);

  useEffect(() => {
    async function loadGenres() {
      const data = await api.getGenres();
      setGenres(data);
    }
    loadGenres();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Compass className="w-6 h-6 text-spotify-green" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Explore Categories & Genres
        </h1>
      </div>
      <p className="text-sm text-spotify-subtext max-w-xl">
        Dive into different moods, musical traditions, and viral genres powered by real-time YouTube music playlists.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-4">
        {genres.map((genre) => (
          <div
            key={genre.id}
            onClick={() => navigate(`/search?q=${encodeURIComponent(genre.searchQuery)}`)}
            className="group relative h-40 rounded-2xl p-4 overflow-hidden cursor-pointer shadow-lg transition-transform duration-300 hover:scale-105 select-none"
            style={{ backgroundColor: genre.color }}
          >
            <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
              {genre.title}
            </h3>

            <div className="absolute -bottom-2 -right-3 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          </div>
        ))}
      </div>
    </div>
  );
};
