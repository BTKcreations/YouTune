import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Music, Mic2, History, Trash2, Plus } from 'lucide-react';
import { useLibraryStore } from '../stores/useLibraryStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { TrackRow } from '../components/common/TrackRow';
import { MusicCard } from '../components/common/MusicCard';
import { cn } from '../utils/formatters';

export const Library: React.FC = () => {
  const { likedTracks, playlists, followedArtists, history, clearHistory } = useLibraryStore();
  const { playTrack } = usePlayerStore();
  const [tab, setTab] = useState<'playlists' | 'liked' | 'artists' | 'history'>('playlists');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setTab('playlists')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-bold transition-colors',
            tab === 'playlists' ? 'bg-white text-black' : 'bg-[#242424] text-white hover:bg-[#303030]'
          )}
        >
          Playlists ({playlists.length})
        </button>

        <button
          onClick={() => setTab('liked')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-bold transition-colors',
            tab === 'liked' ? 'bg-white text-black' : 'bg-[#242424] text-white hover:bg-[#303030]'
          )}
        >
          Liked Songs ({likedTracks.length})
        </button>

        <button
          onClick={() => setTab('artists')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-bold transition-colors',
            tab === 'artists' ? 'bg-white text-black' : 'bg-[#242424] text-white hover:bg-[#303030]'
          )}
        >
          Artists ({followedArtists.length})
        </button>

        <button
          onClick={() => setTab('history')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-bold transition-colors',
            tab === 'history' ? 'bg-white text-black' : 'bg-[#242424] text-white hover:bg-[#303030]'
          )}
        >
          History ({history.length})
        </button>
      </div>

      {/* Tab 1: Playlists */}
      {tab === 'playlists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((pl) => (
            <NavLink key={pl.id} to={`/playlist/${pl.id}`}>
              <MusicCard
                title={pl.title}
                subtitle={`${pl.trackCount} tracks`}
                imageUrl={pl.coverUrl}
                onPlay={() => {
                  if (pl.tracks && pl.tracks.length > 0) {
                    playTrack(pl.tracks[0], pl.tracks);
                  }
                }}
              />
            </NavLink>
          ))}
        </div>
      )}

      {/* Tab 2: Liked Songs */}
      {tab === 'liked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Liked Tracks</h2>
            {likedTracks.length > 0 && (
              <button
                onClick={() => playTrack(likedTracks[0], likedTracks)}
                className="px-5 py-2 bg-spotify-green text-black font-bold text-xs rounded-full hover:scale-105 transition-transform"
              >
                Play All
              </button>
            )}
          </div>
          {likedTracks.length === 0 ? (
            <div className="text-center py-16 text-spotify-subtext">
              <Heart className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p>Songs you like will appear here</p>
            </div>
          ) : (
            <div className="bg-[#181818]/60 rounded-xl p-2 border border-neutral-800 space-y-1">
              {likedTracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  queueContext={likedTracks}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Followed Artists */}
      {tab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {followedArtists.map((artist) => (
            <NavLink key={artist.id} to={`/artist/${artist.id}`}>
              <MusicCard
                title={artist.name}
                subtitle="Artist"
                imageUrl={artist.avatarUrl}
                aspectRound
              />
            </NavLink>
          ))}
        </div>
      )}

      {/* Tab 4: History */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Listening History</h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 text-xs text-spotify-subtext hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear History
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="text-center py-16 text-spotify-subtext">
              <History className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p>No listening history yet</p>
            </div>
          ) : (
            <div className="bg-[#181818]/60 rounded-xl p-2 border border-neutral-800 space-y-1">
              {history.map((item, i) => (
                <TrackRow
                  key={`${item.track.id}-${i}`}
                  track={item.track}
                  index={i}
                  queueContext={history.map((h) => h.track)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
