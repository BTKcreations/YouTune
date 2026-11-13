import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { BottomPlayer } from '../player/BottomPlayer';
import { MiniPlayer } from '../player/MiniPlayer';
import { MobileNav } from './MobileNav';
import { QueueDrawer } from '../player/QueueDrawer';
import { NowPlayingModal } from '../player/NowPlayingModal';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { PwaOverlay } from '../common/PwaOverlay';
import { useLibraryStore } from '../../stores/useLibraryStore';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { createPlaylist } = useLibraryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistTitle.trim()) return;
    createPlaylist(playlistTitle.trim(), playlistDesc.trim());
    setPlaylistTitle('');
    setPlaylistDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-black text-white font-sans overflow-hidden select-none">
      {/* PWA Install & Offline Status Overlay */}
      <PwaOverlay onGoToOffline={() => navigate('/library')} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Desktop Only) */}
        <Sidebar onNewPlaylistClick={() => setIsModalOpen(true)} />

        {/* Central View Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#121212] overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-36 md:pb-28">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating Mini Player (YouTube Video preview) */}
      <MiniPlayer />

      {/* Persistent Bottom Audio Player */}
      <BottomPlayer
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
      />

      {/* Full-Screen Spotify-like Now Playing Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      {/* Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* New User Welcome Onboarding Modal */}
      <OnboardingModal />

      {/* Create Playlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#282828] p-6 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-700 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-4">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-spotify-subtext mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="My Awesome Playlist"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  className="w-full bg-[#3e3e3e] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-spotify-green"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-spotify-subtext mb-1">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Add an optional description"
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  className="w-full bg-[#3e3e3e] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-spotify-green resize-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-spotify-subtext hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-spotify-green text-black font-bold text-sm rounded-full hover:scale-105 transition-transform"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
