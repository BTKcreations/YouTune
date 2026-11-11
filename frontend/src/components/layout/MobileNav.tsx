import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Compass, Library, Radio } from 'lucide-react';
import { cn } from '../../utils/formatters';

export const MobileNav: React.FC = () => {
  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/discover', label: 'Discover', icon: Radio },
    { to: '/explore', label: 'Genres', icon: Compass },
    { to: '/library', label: 'Library', icon: Library },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-[#222222] flex items-center justify-around h-14 px-2 safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
              )
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
