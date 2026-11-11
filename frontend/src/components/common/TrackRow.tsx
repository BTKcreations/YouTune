import React from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock3 } from 'lucide-react';
import { Track } from '../../types/music';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { formatTime, cn } from '../../utils/formatters';

interface TrackRowProps {
  track: Track;
  index: number;
  queueContext?: Track[];
  onRemove?: () => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  queueContext,
  onRemove,
}) => {
  const { currentTrack, playbackState, playTrack, togglePlay } = usePlayerStore();
  const { isTrackLiked, toggleLikeTrack } = useLibraryStore();

  const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;
  const isPlaying = isCurrent && playbackState === 'playing';
  const isLiked = isTrackLiked(track.id);

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={cn(
        'group flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-[#2a2a2a]/60 transition-colors text-sm select-none cursor-pointer',
        isCurrent && 'bg-[#2a2a2a]/40 text-spotify-green'
      )}
    >
      {/* Index or Play icon */}
      <div className="flex items-center gap-4 w-8 flex-shrink-0 text-spotify-subtext">
        <span className={cn('w-4 text-center group-hover:hidden', isCurrent && 'text-spotify-green')}>
          {isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 h-3.5">
              <span className="w-0.5 bg-spotify-green animate-bounce h-3" />
              <span className="w-0.5 bg-spotify-green animate-bounce h-2 delay-100" />
              <span className="w-0.5 bg-spotify-green animate-bounce h-3.5 delay-200" />
            </div>
          ) : (
            index + 1
          )}
        </span>
        <button
          onClick={handlePlayClick}
          className="hidden group-hover:flex items-center justify-center text-white hover:text-spotify-green"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>
      </div>

      {/* Title & Artist Thumbnail */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        <img
          src={track.thumbnailUrl}
          alt={track.title}
          className="w-10 h-10 rounded object-cover flex-shrink-0 shadow"
        />
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              'font-medium truncate',
              isCurrent ? 'text-spotify-green' : 'text-white group-hover:text-white'
            )}
          >
            {track.title}
          </span>
          <span className="text-xs text-spotify-subtext truncate group-hover:text-gray-300">
            {track.artist}
          </span>
        </div>
      </div>

      {/* Album or Channel */}
      <div className="hidden md:block w-1/4 text-xs text-spotify-subtext truncate">
        {track.album?.title || track.channelTitle || 'YouTube Music'}
      </div>

      {/* Like and Duration */}
      <div className="flex items-center gap-4 justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLikeTrack(track);
          }}
          className={cn(
            'transition-colors p-1',
            isLiked ? 'text-spotify-green opacity-100' : 'text-spotify-subtext opacity-0 group-hover:opacity-100 hover:text-white'
          )}
        >
          <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
        </button>

        <span className="text-xs text-spotify-subtext w-10 text-right">
          {formatTime(track.durationSec)}
        </span>

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove from playlist"
            className="text-xs text-spotify-subtext hover:text-red-400 opacity-0 group-hover:opacity-100 px-1"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
