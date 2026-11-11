import React from 'react';
import { X, Play, Trash2, ListMusic } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { formatTime } from '../../utils/formatters';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const { queue, currentIndex, currentTrack, playTrack, removeFromQueue, clearQueue } = usePlayerStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#181818] h-full flex flex-col border-l border-neutral-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-white">
            <ListMusic className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold">Play Queue</h2>
            <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded-full text-spotify-subtext font-mono">
              {queue.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-spotify-subtext hover:text-red-400 p-1 transition-colors"
                title="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-spotify-subtext hover:text-white p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Now Playing */}
        {currentTrack && (
          <div className="py-4 border-b border-neutral-800/80">
            <span className="text-[11px] font-bold text-spotify-subtext uppercase tracking-wider block mb-2">
              Now Playing
            </span>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-spotify-green/10 border border-spotify-green/20">
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-semibold truncate block">
                  {currentTrack.title}
                </span>
                <span className="text-spotify-green text-xs truncate block">
                  {currentTrack.artist}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Up */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          <span className="text-[11px] font-bold text-spotify-subtext uppercase tracking-wider block mb-2">
            Next In Queue
          </span>

          {queue.length === 0 ? (
            <div className="text-center py-12 text-spotify-subtext">
              <p className="text-sm">Queue is empty</p>
              <p className="text-xs text-gray-500 mt-1">Play any song or album to populate the queue</p>
            </div>
          ) : (
            queue.map((track, i) => {
              const isCurrent = i === currentIndex;
              return (
                <div
                  key={`${track.id}-${i}`}
                  onClick={() => playTrack(track, queue)}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isCurrent ? 'bg-spotify-green/15 text-spotify-green' : 'hover:bg-[#252525] text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium truncate block ${isCurrent ? 'text-spotify-green' : 'text-white'}`}>
                        {track.title}
                      </span>
                      <span className="text-[11px] text-spotify-subtext truncate block">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-spotify-subtext font-mono">
                      {formatTime(track.durationSec)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-spotify-subtext hover:text-red-400 p-1"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
