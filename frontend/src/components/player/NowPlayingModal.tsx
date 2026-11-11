import React from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ExternalLink,
  ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { formatTime, cn } from '../../utils/formatters';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  onOpenQueue,
}) => {
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
  } = usePlayerStore();

  const { isTrackLiked, toggleLikeTrack } = useLibraryStore();

  if (!isOpen || !currentTrack) return null;

  const isLiked = isTrackLiked(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#242424] via-[#121212] to-black flex flex-col p-6 animate-in slide-in-from-bottom duration-300 select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2 pb-6">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-spotify-subtext">
            Playing From Your Catalog
          </span>
          <span className="text-xs font-semibold text-white truncate max-w-[200px]">
            {currentTrack.album?.title || 'YouTune Stream'}
          </span>
        </div>

        <button
          onClick={onOpenQueue}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          title="Open Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      {/* Big Center Artwork */}
      <div className="flex-1 flex items-center justify-center py-4 my-auto">
        <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl border border-neutral-700/50 relative group">
          <img
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Song Info & Like */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between py-4">
        <div className="flex flex-col min-w-0 pr-4">
          <h2 className="text-xl md:text-2xl font-black text-white truncate">
            {currentTrack.title}
          </h2>
          <p className="text-sm md:text-base text-spotify-subtext truncate mt-0.5">
            {currentTrack.artist}
          </p>
        </div>
        <button
          onClick={() => toggleLikeTrack(currentTrack)}
          className="p-2 text-spotify-subtext hover:text-white transition-colors"
        >
          <Heart className={cn('w-7 h-7', isLiked && 'fill-spotify-green text-spotify-green')} />
        </button>
      </div>

      {/* Scrubber / Progress Slider */}
      <div className="w-full max-w-sm mx-auto space-y-2 py-2">
        <div className="relative flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-spotify-green"
            style={{
              background: `linear-gradient(to right, #1db954 ${progressPercent}%, #4d4d4d ${progressPercent}%)`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-spotify-subtext font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Media Controls */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between py-6">
        <button
          onClick={toggleShuffle}
          className={cn(
            'p-2 transition-colors',
            shuffle ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
          )}
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </button>

        <button
          onClick={prevTrack}
          className="p-2 text-white hover:text-spotify-green transition-colors"
          title="Previous Track"
        >
          <SkipBack className="w-8 h-8 fill-current" />
        </button>

        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-spotify-green hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-black shadow-xl"
          title={playbackState === 'playing' ? 'Pause' : 'Play'}
        >
          {playbackState === 'playing' ? (
            <Pause className="w-8 h-8 fill-black" />
          ) : (
            <Play className="w-8 h-8 fill-black translate-x-0.5" />
          )}
        </button>

        <button
          onClick={nextTrack}
          className="p-2 text-white hover:text-spotify-green transition-colors"
          title="Next Track"
        >
          <SkipForward className="w-8 h-8 fill-current" />
        </button>

        <button
          onClick={cycleRepeat}
          className={cn(
            'p-2 transition-colors relative',
            repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
          )}
          title={`Repeat mode: ${repeat}`}
        >
          <Repeat className="w-5 h-5" />
          {repeat === 'one' && (
            <span className="absolute top-0 right-0 text-[10px] font-bold">1</span>
          )}
        </button>
      </div>

      {/* Bottom Attributes & Direct Link */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between pt-2 pb-4 text-xs text-spotify-subtext">
        <span className="text-emerald-400 font-medium">● Background Audio Active</span>
        <a
          href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <span>Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
