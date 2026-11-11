import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface TopNavbarProps {
  children?: React.ReactNode;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-[#101010]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 border-b border-[#1f1f1f]">
      {/* Navigation History Buttons & Extra search inputs if provided */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Injected search or filters */}
        {children}
      </div>

      {/* Right User Profile */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 bg-black/50 py-1.5 px-3 rounded-full border border-neutral-800">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user.username}
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="text-sm font-semibold text-white max-w-[120px] truncate">
              {user.username}
            </span>
            <button
              onClick={logout}
              title="Logout"
              className="text-spotify-subtext hover:text-red-400 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:scale-105 transition-transform">
            Log In
          </button>
        )}
      </div>
    </header>
  );
};
