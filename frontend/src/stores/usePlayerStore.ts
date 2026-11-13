import { create } from 'zustand';
import { Track, PlaybackState, RepeatMode } from '../types/music';

interface PlayerState {
  currentTrack: Track | null;
  playbackState: PlaybackState;
  queue: Track[];
  currentIndex: number;
  volume: number; // 0 to 100
  isMuted: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  shuffle: boolean;
  repeat: RepeatMode;
  isMiniPlayerOpen: boolean;
  isVideoMode: boolean;
  sleepTimerRemaining: number | null;
  autoPlayRadio: boolean;
  
  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (timeSec: number) => void;
  seekPlayer: ((timeSec: number) => void) | null;
  setSeekPlayerHandler: (handler: (timeSec: number) => void) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setSleepTimer: (minutes: number | null) => void;
  toggleAutoPlayRadio: () => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setPlaybackState: (state: PlaybackState) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleMiniPlayer: () => void;
  toggleVideoMode: () => void;
  setVideoMode: (enabled: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playbackState: 'idle',
  queue: [],
  currentIndex: -1,
  volume: 75,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off',
  isMiniPlayerOpen: false,
  isVideoMode: false,
  sleepTimerRemaining: null,
  autoPlayRadio: true,

  playTrack: (track, newQueue) => {
    let queue = newQueue || get().queue;
    if (!queue.length || (newQueue && !newQueue.some(t => t.id === track.id))) {
      queue = [track, ...queue.filter(t => t.id !== track.id)];
    }
    const index = queue.findIndex(t => t.id === track.id);

    set({
      currentTrack: track,
      queue,
      currentIndex: index >= 0 ? index : 0,
      playbackState: 'loading',
      currentTime: 0,
      duration: track.durationSec || 0,
    });
  },

  pauseTrack: () => {
    set({ playbackState: 'paused' });
  },

  resumeTrack: () => {
    if (get().currentTrack) {
      set({ playbackState: 'playing' });
    }
  },

  togglePlay: () => {
    const { playbackState, currentTrack } = get();
    if (!currentTrack) return;
    if (playbackState === 'playing') {
      set({ playbackState: 'paused' });
    } else {
      set({ playbackState: 'playing' });
    }
  },

  nextTrack: () => {
    const { queue, currentIndex, shuffle, repeat } = get();
    if (!queue.length) return;

    if (repeat === 'one') {
      set({ currentTime: 0, playbackState: 'playing' });
      return;
    }

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      const nextT = queue[randomIndex];
      set({
        currentIndex: randomIndex,
        currentTrack: nextT,
        playbackState: 'loading',
        currentTime: 0,
        duration: nextT.durationSec || 0,
      });
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      const nextT = queue[nextIndex];
      set({
        currentIndex: nextIndex,
        currentTrack: nextT,
        playbackState: 'playing',
        currentTime: 0,
        duration: nextT.durationSec || 0,
      });
    } else if (repeat === 'all') {
      const nextT = queue[0];
      set({
        currentIndex: 0,
        currentTrack: nextT,
        playbackState: 'playing',
        currentTime: 0,
        duration: nextT.durationSec || 0,
      });
    } else {
      set({ playbackState: 'ended' });
    }
  },

  prevTrack: () => {
    const { queue, currentIndex, currentTime } = get();
    if (!queue.length) return;

    // If more than 3 seconds in, reset current track to 0
    if (currentTime > 3) {
      set({ currentTime: 0 });
      const handler = get().seekPlayer;
      if (handler) handler(0);
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prevT = queue[prevIndex];
      set({
        currentIndex: prevIndex,
        currentTrack: prevT,
        playbackState: 'playing',
        currentTime: 0,
        duration: prevT.durationSec || 0,
      });
    } else {
      set({ currentTime: 0 });
      const handler = get().seekPlayer;
      if (handler) handler(0);
    }
  },

  seekTo: (timeSec) => {
    set({ currentTime: timeSec });
    const handler = get().seekPlayer;
    if (handler) {
      handler(timeSec);
    }
  },
  seekPlayer: null,
  setSeekPlayerHandler: (handler) => set({ seekPlayer: handler }),

  setVolume: (vol) => {
    set({ volume: Math.max(0, Math.min(100, vol)), isMuted: vol === 0 });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },

  cycleRepeat: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = get().repeat;
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    set({ repeat: next });
  },

  setSleepTimer: (minutes: number | null) => {
    set({ sleepTimerRemaining: minutes ? minutes * 60 : null });
  },

  toggleAutoPlayRadio: () => {
    set((state) => ({ autoPlayRadio: !state.autoPlayRadio }));
  },

  setQueue: (tracks) => {
    set({ queue: tracks });
  },

  addToQueue: (track) => {
    set((state) => ({ queue: [...state.queue, track] }));
  },

  removeFromQueue: (index) => {
    set((state) => {
      const newQueue = [...state.queue];
      newQueue.splice(index, 1);
      let newCurrentIndex = state.currentIndex;
      if (index < state.currentIndex) {
        newCurrentIndex -= 1;
      }
      return {
        queue: newQueue,
        currentIndex: Math.min(newCurrentIndex, newQueue.length - 1),
      };
    });
  },

  clearQueue: () => {
    set({ queue: [], currentIndex: -1 });
  },

  setPlaybackState: (playbackState) => set({ playbackState }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  toggleMiniPlayer: () => set((state) => ({ isMiniPlayerOpen: !state.isMiniPlayerOpen })),
  toggleVideoMode: () => set((state) => ({ isVideoMode: !state.isVideoMode })),
  setVideoMode: (isVideoMode) => set({ isVideoMode }),
}));
