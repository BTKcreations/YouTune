import React, { useState, useEffect } from 'react';
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
  Sliders,
  Moon,
  Download,
  Mic2,
  Check,
  Video,
  Music2,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { formatTime, cn, triggerHaptic } from '../../utils/formatters';
import { LyricsService, LyricLine } from '../../services/lyricsService';
import { OfflineStorageService } from '../../services/offlineStorageService';
import { ClientMusicService } from '../../services/clientMusicService';
import { EqualizerModal } from './EqualizerModal';
import { SleepTimerModal } from './SleepTimerModal';

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
    isVideoMode,
    toggleVideoMode,
  } = usePlayerStore();

  const { isTrackLiked, toggleLikeTrack } = useLibraryStore();

  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (!currentTrack) return;
    setIsDownloaded(OfflineStorageService.isTrackDownloaded(currentTrack.youtubeId));
    
    // Fetch lyrics for current track
    LyricsService.getLyrics(currentTrack.title, currentTrack.artist, currentTrack.durationSec).then((lines) => {
      setLyrics(lines);
    });
  }, [currentTrack?.id]);

  const handleDownload = async () => {
    if (!currentTrack || isDownloading || isDownloaded) return;
    setIsDownloading(true);
    try {
      const ok = await OfflineStorageService.downloadTrack(currentTrack);
      if (ok) setIsDownloaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !currentTrack) return null;

  const isLiked = isTrackLiked(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#242424] via-[#121212] to-black flex flex-col p-6 animate-in slide-in-from-bottom duration-300 select-none overflow-y-auto relative">
      {/* Ambient Radial Lighting Behind Album Artwork */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-25 transition-all duration-700"
        style={{
          background: 'radial-gradient(circle, #1db954 0%, transparent 70%)',
        }}
      />
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2 pb-6">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          {/* Song / Video Pill Switch */}
          <div className="inline-flex items-center bg-black/60 p-1 rounded-full border border-neutral-700/60 shadow-inner mb-1.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                if (isVideoMode) toggleVideoMode();
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all',
                !isVideoMode ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Song</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                if (!isVideoMode) toggleVideoMode();
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all',
                isVideoMode ? 'bg-spotify-green text-black font-extrabold shadow' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>
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

      {/* Big Center Artwork, Live Video, or Synchronized Lyrics */}
      <div className="flex-1 flex items-center justify-center py-4 my-auto relative">
        {isVideoMode ? (
          <div className="w-full max-w-xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-neutral-700 bg-black relative">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&start=${Math.floor(currentTime)}&playsinline=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
              title={currentTrack.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : !showLyrics ? (
          <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl border border-neutral-700/50 relative group">
            <img
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-full max-w-sm h-80 overflow-y-auto px-4 py-6 space-y-4 text-center rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-neutral-800 scroll-smooth">
            {lyrics.length > 0 ? (
              lyrics.map((line, idx) => {
                const isActive =
                  currentTime >= line.time &&
                  (idx === lyrics.length - 1 || currentTime < lyrics[idx + 1].time);

                return (
                  <p
                    key={idx}
                    onClick={() => seekTo(line.time)}
                    className={cn(
                      'text-lg font-bold transition-all duration-300 cursor-pointer',
                      isActive
                        ? 'text-spotify-green scale-105 drop-shadow-[0_0_12px_rgba(29,185,84,0.4)]'
                        : 'text-neutral-500 hover:text-neutral-300'
                    )}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <Mic2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No synchronized lyrics found for this track</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action shortcuts: Lyrics Toggle, Equalizer, Sleep Timer, Offline Download */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between px-2 py-2 text-neutral-400">
        <button
          onClick={() => setShowLyrics(!showLyrics)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
            showLyrics ? 'bg-spotify-green text-black' : 'bg-neutral-800/80 hover:text-white'
          )}
          title="Toggle Synchronized Lyrics"
        >
          <Mic2 className="w-3.5 h-3.5" />
          <span>Lyrics</span>
        </button>

        <button
          onClick={() => setIsEqOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 hover:text-white text-xs font-semibold transition-colors"
          title="Equalizer & Sound Profiles"
        >
          <Sliders className="w-3.5 h-3.5 text-spotify-green" />
          <span>EQ</span>
        </button>

        <button
          onClick={() => setIsSleepOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 hover:text-white text-xs font-semibold transition-colors"
          title="Sleep Timer"
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sleep</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={isDownloading || isDownloaded}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
            isDownloaded
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
              : 'bg-neutral-800/80 hover:text-white'
          )}
          title={isDownloaded ? 'Saved Offline' : 'Download for Offline'}
        >
          {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          <span>{isDownloaded ? 'Saved' : isDownloading ? 'Saving...' : 'Offline'}</span>
        </button>
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

      {/* Submodals for Equalizer and Sleep Timer */}
      <EqualizerModal isOpen={isEqOpen} onClose={() => setIsEqOpen(false)} />
      <SleepTimerModal isOpen={isSleepOpen} onClose={() => setIsSleepOpen(false)} />
    </div>
  );
};
