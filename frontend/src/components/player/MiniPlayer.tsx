import React from 'react';
import { X, ExternalLink, Maximize2 } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { UniversalAudioBridge } from './UniversalAudioBridge';
import { cn } from '../../utils/formatters';

export const MiniPlayer: React.FC = () => {
  const { isMiniPlayerOpen, toggleMiniPlayer, currentTrack } = usePlayerStore();

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 z-40 rounded-xl bg-spotify-card border border-spotify-border shadow-2xl overflow-hidden transition-all duration-300",
        isMiniPlayerOpen
          ? "w-80 md:w-96 opacity-100 scale-100 pointer-events-auto"
          : "w-48 h-28 opacity-95 scale-90 pointer-events-auto md:w-56 md:h-32"
      )}
      style={{
        // Maintain minimum physical layout so mobile/desktop engines treat video as visible and active
        minWidth: isMiniPlayerOpen ? '320px' : '192px',
        minHeight: isMiniPlayerOpen ? '220px' : '112px',
      }}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-spotify-elevated border-b border-spotify-border">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
          <span className="text-[11px] font-semibold text-white truncate max-w-[140px]">
            {currentTrack?.title || 'YouTube Player'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {currentTrack && (
            <a
              href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on official YouTube"
              className="text-spotify-subtext hover:text-white p-1"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={toggleMiniPlayer}
            className="text-spotify-subtext hover:text-white p-1"
            title={isMiniPlayerOpen ? "Collapse Dock" : "Expand Video"}
          >
            {isMiniPlayerOpen ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Official YouTube IFrame Anchor with persistent visible dimensions */}
      <div className="w-full aspect-video bg-black relative flex items-center justify-center overflow-hidden">
        <UniversalAudioBridge />
      </div>

      {isMiniPlayerOpen && (
        <div className="p-2 bg-[#121212] flex items-center justify-between text-[11px] text-spotify-subtext border-t border-spotify-border">
          <span className="truncate max-w-[180px]">{currentTrack?.artist || 'YouTune Music'}</span>
          <span className="text-[9px] text-spotify-green font-mono">Official Player Active</span>
        </div>
      )}
    </div>
  );
};
