import React from 'react';
import { Play } from 'lucide-react';

interface MusicCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  aspectRound?: boolean;
  onPlay?: () => void;
  onClick?: () => void;
}

export const MusicCard: React.FC<MusicCardProps> = ({
  title,
  subtitle,
  imageUrl,
  aspectRound,
  onPlay,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col hover:shadow-xl"
    >
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-neutral-800 shadow-md">
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            aspectRound ? 'rounded-full' : 'rounded-lg'
          }`}
        />

        {/* Floating Green Play Button */}
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-spotify-green flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-spotify-green-light"
          >
            <Play className="w-5 h-5 fill-black translate-x-0.5" />
          </button>
        )}
      </div>

      <h3 className="font-semibold text-white text-sm truncate mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-spotify-subtext truncate">{subtitle}</p>}
    </div>
  );
};
