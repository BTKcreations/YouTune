import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
  ExternalLink,
  ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { formatTime, cn } from '../../utils/formatters';

interface BottomPlayerProps {
  onOpenQueue?: () => void;
  onOpenNowPlaying?: () => void;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({ onOpenQueue, onOpenNowPlaying }) => {
  const {
    currentTrack,
    playbackState,
    volume,
    isMuted,
    currentTime,
    duration,
    shuffle,
    repeat,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleMiniPlayer,
    isMiniPlayerOpen,
  } = usePlayerStore();

  const { isTrackLiked, toggleLikeTrack } = useLibraryStore();

  if (!currentTrack) {
    return (
      <footer className="h-16 md:h-20 bg-spotify-black border-t border-spotify-border px-4 flex items-center justify-between select-none pb-14 md:pb-0">
        <div className="text-xs md:text-sm text-spotify-subtext truncate">No track selected. Pick a song to start listening!</div>
      </footer>
    );
  }

  const isLiked = isTrackLiked(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
  };

  return (
    <footer className="fixed md:relative bottom-14 md:bottom-0 left-0 right-0 h-16 md:h-20 bg-[#181818] border-t border-[#282828] px-3 md:px-4 flex items-center justify-between select-none z-50 shadow-2xl">
      {/* Left: Track Information */}
      <div
        onClick={onOpenNowPlaying}
        className="flex items-center gap-2.5 md:gap-3 flex-1 md:w-1/4 min-w-0 pr-2 cursor-pointer group"
      >
        <div className="relative flex-shrink-0">
          <img
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            className="w-10 h-10 md:w-14 md:h-14 rounded object-cover shadow"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white text-xs md:text-sm font-medium hover:underline truncate">
            {currentTrack.title}
          </span>
          <span className="text-spotify-subtext text-[10px] md:text-xs hover:underline truncate">
            {currentTrack.artist}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLikeTrack(currentTrack);
          }}
          className="text-spotify-subtext hover:text-white transition-colors p-1 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded"
          title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
          aria-label={isLiked ? `Remove ${currentTrack.title} from Your Library` : `Save ${currentTrack.title} to Your Library`}
          aria-pressed={isLiked}
        >
          <Heart className={cn('w-4 h-4 md:w-5 md:h-5', isLiked && 'fill-spotify-green text-spotify-green')} />
        </button>
      </div>

      {/* Center: Playback Controls (Compact on Mobile, Full on Desktop) */}
      <div className="flex items-center md:flex-col justify-end md:justify-center md:w-2/4 md:max-w-xl gap-2 md:gap-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleShuffle}
            className={cn(
              'hidden md:inline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded p-1',
              shuffle ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
            )}
            title="Enable shuffle"
            aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
            aria-pressed={shuffle}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevTrack}
            className="text-spotify-subtext hover:text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded"
            title="Previous track"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-black shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            title={playbackState === 'playing' ? 'Pause' : 'Play'}
            aria-label={playbackState === 'playing' ? 'Pause track' : 'Play track'}
          >
            {playbackState === 'playing' ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 fill-black" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-spotify-subtext hover:text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded"
            title="Next track"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={cn(
              'hidden md:inline transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded p-1',
              repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
            )}
            title={`Repeat mode: ${repeat}`}
            aria-label={`Cycle repeat mode (currently ${repeat})`}
          >
            <Repeat className="w-4 h-4" />
            {repeat === 'one' && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold">1</span>
            )}
          </button>
        </div>

        {/* Timeline Slider (Desktop full, Mobile absolute bottom line) */}
        <div className="hidden md:flex w-full items-center gap-2 mt-1">
          <span className="text-[11px] text-spotify-subtext w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-white group-hover:accent-spotify-green"
              style={{
                background: `linear-gradient(to right, #1db954 ${progressPercent}%, #4d4d4d ${progressPercent}%)`,
              }}
            />
          </div>
          <span className="text-[11px] text-spotify-subtext w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Mobile Thin Top Progress Bar */}
      <div
        className="md:hidden absolute top-0 left-0 h-0.5 bg-spotify-green transition-all"
        style={{ width: `${progressPercent}%` }}
      />

      {/* Right: Volume & Extra Utilities */}
      <div className="hidden md:flex items-center justify-end w-1/4 gap-3">
        <button
          onClick={onOpenQueue}
          className="text-spotify-subtext hover:text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded"
          title="Current Queue"
          aria-label="Open current play queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        <button
          onClick={toggleMiniPlayer}
          className={cn(
            'transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded',
            isMiniPlayerOpen ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
          )}
          title="Toggle Video Player"
          aria-label={isMiniPlayerOpen ? 'Collapse video player' : 'Expand video player'}
          aria-expanded={isMiniPlayerOpen}
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-spotify-subtext hover:text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green rounded"
            title={isMuted || volume === 0 ? 'Unmute volume' : 'Mute volume'}
            aria-label={isMuted || volume === 0 ? 'Unmute volume' : 'Mute volume'}
            aria-pressed={isMuted || volume === 0}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            aria-label="Volume level"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-white hover:accent-spotify-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green"
            style={{
              background: `linear-gradient(to right, #1db954 ${isMuted ? 0 : volume}%, #4d4d4d ${isMuted ? 0 : volume}%)`,
            }}
          />
        </div>
      </div>
    </footer>
  );
};
