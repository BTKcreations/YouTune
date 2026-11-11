import React from 'react';
import { ExternalLink } from 'lucide-react';

interface YouTubeAttributionProps {
  youtubeId?: string;
  channelTitle?: string;
  channelId?: string;
  className?: string;
}

export const YouTubeAttribution: React.FC<YouTubeAttributionProps> = ({
  youtubeId,
  channelTitle,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 text-xs text-neutral-400 ${className}`}>
      <span className="flex items-center gap-1.5 font-medium">
        {/* YouTube logo red badge */}
        <span className="inline-flex items-center justify-center bg-red-600 text-white rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider">
          YouTube
        </span>
        {channelTitle && (
          <span className="truncate max-w-[150px] text-neutral-300">
            {channelTitle}
          </span>
        )}
      </span>

      {youtubeId && (
        <a
          href={`https://www.youtube.com/watch?v=${youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on YouTube"
          className="hover:text-white transition-colors flex items-center gap-0.5 ml-auto text-neutral-400 hover:underline"
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
