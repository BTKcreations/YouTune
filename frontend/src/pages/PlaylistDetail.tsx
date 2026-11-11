import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Clock3, Trash2, Edit, Music, Share2 } from 'lucide-react';
import { useLibraryStore } from '../stores/useLibraryStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { TrackRow } from '../components/common/TrackRow';
import { formatTime } from '../utils/formatters';

export const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, deletePlaylist, removeTrackFromPlaylist } = useLibraryStore();
  const { playTrack } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === id);

  if (!playlist) {
    return (
      <div className="text-center py-24 text-spotify-subtext">
        <h2 className="text-2xl font-bold text-white mb-2">Playlist not found</h2>
        <button
          onClick={() => navigate('/library')}
          className="text-spotify-green hover:underline text-sm"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const tracks = playlist.tracks || [];

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      deletePlaylist(playlist.id);
      navigate('/library');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-end gap-6 bg-gradient-to-t from-[#181818] to-neutral-800/80 -mx-6 -mt-6 p-8 pb-6 border-b border-neutral-800">
        <img
          src={playlist.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
          alt={playlist.title}
          className="w-48 h-48 md:w-56 md:h-56 rounded-xl object-cover shadow-2xl flex-shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mt-1 mb-3 tracking-tight truncate">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="text-sm text-spotify-subtext mb-3 max-w-2xl line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-spotify-subtext">
            <span className="font-semibold text-white">YouTune User</span>
            <span>•</span>
            <span>{tracks.length} songs</span>
            <span>•</span>
            <span>{formatTime(playlist.totalDurationSec || 0)}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {tracks.length > 0 && (
            <button
              onClick={() => playTrack(tracks[0], tracks)}
              className="w-14 h-14 rounded-full bg-spotify-green hover:bg-spotify-green-light flex items-center justify-center text-black shadow-xl hover:scale-105 transition-all"
            >
              <Play className="w-6 h-6 fill-black translate-x-0.5" />
            </button>
          )}

          <button
            onClick={handleDelete}
            title="Delete Playlist"
            className="text-spotify-subtext hover:text-red-400 p-2 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tracks Table */}
      {tracks.length === 0 ? (
        <div className="text-center py-16 text-spotify-subtext border-t border-neutral-800">
          <Music className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
          <p className="font-semibold text-white">Let's find something for your playlist</p>
          <p className="text-xs text-spotify-subtext mt-1">Use the search bar to find and add tracks.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 text-xs font-bold text-spotify-subtext uppercase tracking-wider">
            <div className="flex items-center gap-4 w-8">#</div>
            <div className="flex-1">Title</div>
            <div className="hidden md:block w-1/4">Source</div>
            <div className="flex items-center justify-end gap-4 w-20">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>

          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              queueContext={tracks}
              onRemove={() => removeTrackFromPlaylist(playlist.id, track.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
