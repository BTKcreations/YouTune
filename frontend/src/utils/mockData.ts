import { Track, Playlist, GenreCategory, Artist } from '../types/music';

export const MOCK_GENRES: GenreCategory[] = [
  { id: 'pop', title: 'Pop', color: '#8D67AB', searchQuery: 'pop music top hits' },
  { id: 'hiphop', title: 'Hip-Hop', color: '#BA5D07', searchQuery: 'hip hop rap trending' },
  { id: 'rock', title: 'Rock & Alt', color: '#E91429', searchQuery: 'rock classics alternative' },
  { id: 'electronic', title: 'Electronic & Dance', color: '#1E3264', searchQuery: 'edm electronic dance' },
  { id: 'indie', title: 'Indie & Chill', color: '#608108', searchQuery: 'indie acoustic lo-fi chill' },
  { id: 'rnb', title: 'R&B & Soul', color: '#DC148C', searchQuery: 'rnb soul rhythm' },
  { id: 'gaming', title: 'Gaming Beats', color: '#E8115B', searchQuery: 'synthwave gaming soundtrack' },
  { id: 'focus', title: 'Focus & Study', color: '#503750', searchQuery: 'lofi study focus beats' },
];

export const MOCK_TRACKS: Track[] = [
  {
    id: 'track-1',
    youtubeId: 'kJQP7kiw5Fk', // Despacito
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    durationSec: 228,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    views: 8200000000,
    isLiked: true,
  },
  {
    id: 'track-2',
    youtubeId: 'JGwWNGJdvx8', // Ed Sheeran - Shape of You
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    durationSec: 233,
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    views: 6100000000,
    isLiked: false,
  },
  {
    id: 'track-3',
    youtubeId: 'OPf0YbXqDm0', // Mark Ronson - Uptown Funk ft. Bruno Mars
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    durationSec: 270,
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    views: 4900000000,
    isLiked: true,
  },
  {
    id: 'track-4',
    youtubeId: '09R8_2nJtjg', // Maroon 5 - Sugar
    title: 'Sugar',
    artist: 'Maroon 5',
    durationSec: 301,
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=60',
    views: 3900000000,
    isLiked: false,
  },
  {
    id: 'track-5',
    youtubeId: 'fJ9rUzIMcZQ', // Queen – Bohemian Rhapsody
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    durationSec: 359,
    thumbnailUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=60',
    views: 1600000000,
    isLiked: true,
  },
  {
    id: 'track-6',
    youtubeId: 'hT_nvWreIhg', // OneRepublic - Counting Stars
    title: 'Counting Stars',
    artist: 'OneRepublic',
    durationSec: 257,
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60',
    views: 3800000000,
    isLiked: false,
  }
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-1',
    userId: 'user-demo',
    title: 'Global Top Hits 2026',
    description: 'The hottest tracks trending across the world right now on YouTune.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    isPublic: true,
    trackCount: 6,
    totalDurationSec: 1648,
    tracks: MOCK_TRACKS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'playlist-2',
    userId: 'user-demo',
    title: 'Chill Vibes & Late Night Coding',
    description: 'Keep your focus flowing with deep bass, lo-fi groove, and ambient rhythm.',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60',
    isPublic: true,
    trackCount: 4,
    totalDurationSec: 1032,
    tracks: MOCK_TRACKS.slice(0, 4),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const MOCK_ARTISTS: Artist[] = [
  {
    id: 'artist-ed-sheeran',
    name: 'Ed Sheeran',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=60',
    bio: 'English singer-songwriter who has sold more than 150 million records worldwide, making him one of the world\'s best-selling music artists.',
    subscribersCount: 54000000,
    monthlyListeners: 84000000,
    topTracks: [MOCK_TRACKS[1], MOCK_TRACKS[0]],
  },
  {
    id: 'artist-queen',
    name: 'Queen',
    avatarUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=60',
    bio: 'British rock band formed in London in 1970. Their classic lineup was Freddie Mercury, Brian May, Roger Taylor and John Deacon.',
    subscribersCount: 17500000,
    monthlyListeners: 49000000,
    topTracks: [MOCK_TRACKS[4]],
  }
];
