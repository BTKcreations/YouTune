import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { HTML5AudioBridge } from './HTML5AudioBridge';
import { cn } from '../../utils/formatters';

export const MiniPlayer: React.FC = () => {
  const { isMiniPlayerOpen, toggleMiniPlayer, currentTrack } = usePlayerStore();

  return (
    <>
      {/* Background HTML5 Audio Engine & Media Session Provider */}
      <HTML5AudioBridge />

      <div
        className={cn(
          "fixed bottom-24 right-4 z-50 w-80 md:w-96 rounded-xl bg-spotify-card border border-spotify-border shadow-2xl overflow-hidden transition-all duration-300",
          !isMiniPlayerOpen && "opacity-0 pointer-events-none scale-0 h-0 w-0 !overflow-hidden fixed -bottom-96 -right-96"
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-spotify-elevated border-b border-spotify-border">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
            <span className="text-xs font-semibold text-white truncate">
              {currentTrack?.title || 'No Track'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentTrack && (
              <a
                href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in YouTube"
                className="text-spotify-subtext hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={toggleMiniPlayer}
              className="text-spotify-subtext hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full aspect-video bg-black relative flex items-center justify-center">
          {currentTrack ? (
            <img
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-xs text-gray-500">YouTune Music</div>
          )}
        </div>

        <div className="p-2.5 bg-[#121212] flex items-center justify-between text-xs text-spotify-subtext">
          <span className="truncate">{currentTrack?.artist || 'YouTune'}</span>
          <span className="text-[10px] text-spotify-green font-mono">Background Audio Active</span>
        </div>
      </div>
    </>
  );
};
