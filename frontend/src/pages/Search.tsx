import React, { useState, useEffect, useRef } from 'react';
import {
  Search as SearchIcon,
  X,
  Play,
  Mic,
  MicOff,
  History,
  Trash2,
  Sparkles,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { ClientMusicService } from '../services/clientMusicService';
import { SearchResult } from '../types/api';
import { Track } from '../types/music';
import { TrackRow } from '../components/common/TrackRow';
import { MusicCard } from '../components/common/MusicCard';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useNavigate } from 'react-router-dom';
import { MOCK_GENRES } from '../utils/mockData';

const RECENT_SEARCHES_KEY = 'youtune_recent_searches_v1';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack } = usePlayerStore();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tracks' | 'artists' | 'playlists'>('all');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Idea 1: Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Idea 2: Live Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Idea 5: Voice Search
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== term);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Idea 6: Detect Direct YouTube URL or Video ID
  const parseYouTubeUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Handle Search Execution
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSuggestions([]);
      return;
    }

    // Check if direct YouTube URL was pasted
    const youtubeId = parseYouTubeUrl(query.trim());
    if (youtubeId) {
      const directTrack: Track = {
        id: `yt_${youtubeId}`,
        youtubeId: youtubeId,
        title: 'Direct YouTube Stream',
        artist: 'YouTube Video',
        durationSec: 240,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      };
      setResults({
        tracks: [directTrack],
        artists: [],
        playlists: [],
      });
      setIsLoading(false);
      return;
    }

    // Idea 2: Fetch Autocomplete Suggestions (debounce 150ms)
    const suggestTimer = setTimeout(async () => {
      try {
        // Fallback simulated smart search suggestions based on common music searches
        const lower = query.toLowerCase().trim();
        const fallbackKeywords = [
          `${lower} official video`,
          `${lower} songs`,
          `${lower} lyrics`,
          `${lower} remix`,
          `${lower} live concert`,
          `${lower} full album`,
        ];
        setSuggestions(fallbackKeywords.slice(0, 4));
      } catch {}
    }, 150);

    // Primary Search (debounce 300ms)
    const searchTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await ClientMusicService.search(query, activeFilter);
        setResults(res);
        saveRecentSearch(query);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(suggestTimer);
      clearTimeout(searchTimer);
    };
  }, [query, activeFilter]);

  // Idea 5: Voice Search Setup
  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          setShowSuggestions(false);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const topTrack = results?.tracks && results.tracks.length > 0 ? results.tracks[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Search Input, Voice Button & Suggestions */}
      <div className="space-y-4">
        <div className="relative max-w-xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-spotify-subtext" />
          <input
            type="text"
            placeholder="Search songs, artists, lyrics, or paste YouTube link..."
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white pl-12 pr-20 py-3.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-spotify-green transition-all shadow-inner"
            autoFocus
          />

          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
                className="text-spotify-subtext hover:text-white p-1"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Voice Search Button */}
            <button
              onClick={toggleVoiceSearch}
              className={`p-1.5 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-spotify-subtext hover:text-spotify-green hover:bg-neutral-800'
              }`}
              title={isListening ? 'Listening...' : 'Voice Search'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Idea 2: Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && query && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#1c1c1c] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-30 animate-in fade-in">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => {
                    setQuery(sug);
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-[#2a2a2a] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <SearchIcon className="w-3.5 h-3.5 text-spotify-subtext" />
                    <span>{sug}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['all', 'tracks', 'artists', 'playlists'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-spotify-green text-black font-extrabold shadow'
                  : 'bg-[#242424] text-white hover:bg-[#303030]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Idea 1: Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-spotify-green" />
              <span>Recent Searches</span>
            </h2>
            <button
              onClick={clearRecentSearches}
              className="text-xs text-spotify-subtext hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, i) => (
              <div
                key={i}
                onClick={() => setQuery(term)}
                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#202020] hover:bg-[#2a2a2a] border border-neutral-800 text-xs text-white font-medium cursor-pointer transition-all hover:scale-105"
              >
                <span>{term}</span>
                <button
                  onClick={(e) => removeRecentSearch(term, e)}
                  className="text-neutral-500 hover:text-white p-0.5 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idea 4: Browse Categories Grid on Blank Search */}
      {!query && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Browse All Categories</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {MOCK_GENRES.map((genre) => (
              <div
                key={genre.id}
                onClick={() => navigate(`/genre/${encodeURIComponent(genre.id)}`)}
                className="group relative h-28 rounded-2xl p-4 overflow-hidden cursor-pointer shadow-lg transition-transform duration-300 hover:scale-105 select-none"
                style={{ backgroundColor: genre.color }}
              >
                <h3 className="text-lg font-bold text-white tracking-tight drop-shadow">
                  {genre.title}
                </h3>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-md group-hover:scale-125 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16 text-spotify-subtext flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Searching YouTube catalog...</span>
        </div>
      )}

      {/* Results Rendering */}
      {!isLoading && results && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Idea 3: Top Result Hero Card + Top Songs Grid */}
          {(activeFilter === 'all' || activeFilter === 'tracks') && topTrack && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Top Result Hero Card */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-xl font-bold text-white">Top Result</h2>
                <div
                  onClick={() => playTrack(topTrack, results.tracks)}
                  className="group relative p-6 bg-[#181818] hover:bg-[#222222] rounded-2xl border border-neutral-800 transition-all cursor-pointer shadow-xl flex flex-col justify-between h-[230px]"
                >
                  <img
                    src={topTrack.thumbnailUrl}
                    alt={topTrack.title}
                    className="w-24 h-24 rounded-xl object-cover shadow-lg"
                  />
                  <div>
                    <h3 className="text-2xl font-black text-white truncate group-hover:text-spotify-green transition-colors">
                      {topTrack.title}
                    </h3>
                    <p className="text-sm text-spotify-subtext font-medium mt-1">
                      {topTrack.artist} <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded-full ml-2 text-white">Song</span>
                    </p>
                  </div>
                  {/* Floating Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack(topTrack, results.tracks);
                    }}
                    className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                  >
                    <Play className="w-5 h-5 fill-black translate-x-0.5" />
                  </button>
                </div>
              </div>

              {/* Right: Songs List */}
              <div className="lg:col-span-3 space-y-3">
                <h2 className="text-xl font-bold text-white">Songs</h2>
                <div className="space-y-1 bg-[#181818]/40 p-2 rounded-2xl border border-neutral-800">
                  {results.tracks.slice(0, 4).map((track, i) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={i}
                      queueContext={results.tracks}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Remaining Songs if "Tracks" filter is selected or full list */}
          {(activeFilter === 'tracks' || (activeFilter === 'all' && results.tracks.length > 4)) && (
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">All Matching Songs</h2>
              <div className="space-y-1 bg-[#181818]/40 p-2 rounded-2xl border border-neutral-800">
                {results.tracks.slice(4).map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i + 4}
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
              No results found for "{query}". Try searching for another artist or song name.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
