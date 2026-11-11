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
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({ onOpenQueue }) => {
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
      <footer className="h-20 bg-spotify-black border-t border-spotify-border px-4 flex items-center justify-between select-none">
        <div className="text-sm text-spotify-subtext">No track selected. Pick a song to start listening!</div>
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
    <footer className="h-24 md:h-20 bg-[#181818] border-t border-[#282828] px-4 flex flex-col md:flex-row items-center justify-between select-none z-40 relative">
      {/* Left: Track Information */}
      <div className="flex items-center gap-3 w-full md:w-1/4 justify-between md:justify-start py-1 md:py-0">
        <div className="relative group cursor-pointer" onClick={toggleMiniPlayer}>
          <img
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            className="w-14 h-14 rounded object-cover shadow"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-white text-sm font-medium hover:underline cursor-pointer truncate">
            {currentTrack.title}
          </span>
          <span className="text-spotify-subtext text-xs hover:underline cursor-pointer truncate">
            {currentTrack.artist}
          </span>
        </div>

        <button
          onClick={() => toggleLikeTrack(currentTrack)}
          className="text-spotify-subtext hover:text-white transition-colors p-1"
          title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
        >
          <Heart className={cn('w-5 h-5', isLiked && 'fill-spotify-green text-spotify-green')} />
        </button>

        {/* YouTube Attribution badge */}
        <a
          href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on official YouTube"
          className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 pl-1"
        >
          <span className="hidden lg:inline bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-red-500/30">
            YouTube
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Center: Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center w-full md:w-2/4 max-w-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={cn(
              'transition-colors',
              shuffle ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
            )}
            title="Enable shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevTrack}
            className="text-spotify-subtext hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center text-black shadow"
            title={playbackState === 'playing' ? 'Pause' : 'Play'}
          >
            {playbackState === 'playing' ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-spotify-subtext hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={cn(
              'transition-colors relative',
              repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
            )}
            title={`Repeat mode: ${repeat}`}
          >
            <Repeat className="w-4 h-4" />
            {repeat === 'one' && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold">1</span>
            )}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="w-full flex items-center gap-2 mt-1">
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

      {/* Right: Volume & Extra Utilities */}
      <div className="hidden md:flex items-center justify-end w-1/4 gap-3">
        <button
          onClick={onOpenQueue}
          className="text-spotify-subtext hover:text-white transition-colors"
          title="Current Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        <button
          onClick={toggleMiniPlayer}
          className={cn(
            'transition-colors',
            isMiniPlayerOpen ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
          )}
          title="Toggle Video Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-spotify-subtext hover:text-white transition-colors"
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
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-white hover:accent-spotify-green"
            style={{
              background: `linear-gradient(to right, #1db954 ${isMuted ? 0 : volume}%, #4d4d4d ${isMuted ? 0 : volume}%)`,
            }}
          />
        </div>
      </div>
    </footer>
  );
};
