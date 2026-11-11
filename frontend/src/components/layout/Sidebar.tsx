import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  PlusSquare,
  Heart,
  Music,
  Compass,
  Radio,
  Settings,
  Disc,
} from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { cn } from '../../utils/formatters';

interface SidebarProps {
  onNewPlaylistClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewPlaylistClick }) => {
  const { playlists, likedTracks } = useLibraryStore();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/discover', label: 'Discover', icon: Radio },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/explore', label: 'Explore & Genres', icon: Compass },
    { to: '/library', label: 'Your Library', icon: Library },
  ];

  return (
    <aside className="w-64 bg-black flex-shrink-0 flex flex-col h-full border-r border-[#202020] select-none">
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-spotify-green flex items-center justify-center text-black shadow-lg">
          <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
            You<span className="text-spotify-green">Tune</span>
          </span>
          <span className="text-[10px] text-gray-400 font-medium">Powered by YouTube</span>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="px-3 space-y-1">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-spotify-card-hover text-white'
                    : 'text-spotify-subtext hover:text-white hover:bg-spotify-card/50'
                )
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="my-4 mx-4 border-t border-[#252525]" />

      {/* Actions (Create Playlist, Liked Songs) */}
      <div className="px-3 space-y-1">
        <button
          onClick={onNewPlaylistClick}
          className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold text-spotify-subtext hover:text-white hover:bg-spotify-card/50 transition-colors"
        >
          <PlusSquare className="w-5 h-5 text-gray-400" />
          Create Playlist
        </button>

        <NavLink
          to="/library/liked"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              isActive
                ? 'bg-spotify-card-hover text-white'
                : 'text-spotify-subtext hover:text-white hover:bg-spotify-card/50'
            )
          }
        >
          <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-600 to-emerald-400 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-current" />
          </div>
          Liked Songs
          <span className="ml-auto text-xs text-spotify-subtext">
            {likedTracks.length}
          </span>
        </NavLink>
      </div>

      <div className="my-3 mx-4 border-t border-[#252525]" />

      {/* Playlists Quick List */}
      <div className="px-3 flex-1 overflow-y-auto space-y-1 pb-4">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2 block">
          Playlists
        </span>
        {playlists.map((pl) => (
          <NavLink
            key={pl.id}
            to={`/playlist/${pl.id}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium truncate transition-colors',
                isActive
                  ? 'text-spotify-green bg-spotify-card/60'
                  : 'text-spotify-subtext hover:text-white'
              )
            }
          >
            <Music className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{pl.title}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom Settings Link */}
      <div className="p-3 border-t border-[#202020]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'text-spotify-green bg-spotify-card'
                : 'text-spotify-subtext hover:text-white'
            )
          }
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};
