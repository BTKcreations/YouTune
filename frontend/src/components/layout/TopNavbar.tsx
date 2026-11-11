import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Settings, Sparkles } from 'lucide-react';
import { usePreferencesStore } from '../../stores/usePreferencesStore';

interface TopNavbarProps {
  children?: React.ReactNode;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ children }) => {
  const navigate = useNavigate();
  const { userName } = usePreferencesStore();

  return (
    <header className="h-16 bg-[#101010]/95 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 border-b border-[#1f1f1f]">
      {/* Navigation History Buttons */}
      <div className="flex items-center gap-3 flex-1">
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

      {/* Right User Profile Button -> Directly navigates to Settings/Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 bg-[#202020] hover:bg-[#2c2c2c] py-1.5 px-3 rounded-full border border-neutral-700/80 transition-all hover:scale-105 shadow-sm group"
          title="User Profile & Settings"
        >
          <div className="w-6 h-6 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center border border-spotify-green/40 group-hover:bg-spotify-green group-hover:text-black transition-colors">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white max-w-[100px] truncate">
            {userName || 'Profile'}
          </span>
          <Settings className="w-3.5 h-3.5 text-spotify-subtext group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
};
