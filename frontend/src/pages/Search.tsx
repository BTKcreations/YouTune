import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Music, User, ListMusic } from 'lucide-react';
import { ClientMusicService } from '../services/clientMusicService';
import { SearchResult } from '../types/api';
import { TrackRow } from '../components/common/TrackRow';
import { MusicCard } from '../components/common/MusicCard';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useNavigate } from 'react-router-dom';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tracks' | 'artists' | 'playlists'>('all');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await ClientMusicService.search(query, activeFilter);
        setResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Search Input and Filter Pills */}
      <div className="space-y-4">
        <div className="relative max-w-lg">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-spotify-subtext" />
          <input
            type="text"
            placeholder="What do you want to play? (Songs, artists, podcasts...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white pl-12 pr-10 py-3 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-inner"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-spotify-subtext hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['all', 'tracks', 'artists', 'playlists'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-white text-black'
                  : 'bg-[#282828] text-white hover:bg-[#333333]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-spotify-subtext">Searching YouTube catalog...</div>
      )}

      {/* Results Rendering */}
      {!isLoading && results && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Result / Tracks */}
          {(activeFilter === 'all' || activeFilter === 'tracks') && results.tracks.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Songs</h2>
              <div className="space-y-1 bg-[#181818]/40 p-3 rounded-xl border border-neutral-800">
                {results.tracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    queueContext={results.tracks}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Artists */}
          {(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {results.artists.map((artist) => (
                  <MusicCard
                    key={artist.id}
                    title={artist.name}
                    subtitle="Artist"
                    imageUrl={artist.avatarUrl}
                    aspectRound
                    onClick={() => navigate(`/artist/${artist.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Playlists */}
          {(activeFilter === 'all' || activeFilter === 'playlists') && results.playlists.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {results.playlists.map((pl) => (
                  <MusicCard
                    key={pl.id}
                    title={pl.title}
                    subtitle={pl.channelTitle || 'YouTube Playlist'}
                    imageUrl={pl.thumbnailUrl}
                    onClick={() => navigate(`/playlist/${pl.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {results.tracks.length === 0 && results.artists.length === 0 && (
            <div className="text-center py-16 text-spotify-subtext">
              No results found for "{query}". Try a different search term.
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="py-12 text-center text-spotify-subtext">
          <p className="text-base font-medium">Search for artists, songs, or playlists</p>
          <p className="text-xs text-gray-500 mt-1">Directly querying YouTube Data API v3 catalog</p>
        </div>
      )}
    </div>
  );
};
