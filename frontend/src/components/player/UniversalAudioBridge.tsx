import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { ClientMusicService } from '../../services/clientMusicService';
import { PersonalDiscoveryEngine } from '../../services/discoveryEngine';

export const UniversalAudioBridge: React.FC = () => {
  const {
    currentTrack,
    playbackState,
    volume,
    isMuted,
    setPlaybackState,
    setCurrentTime,
    setDuration,
    nextTrack,
    prevTrack,
    setSeekPlayerHandler,
    sleepTimerRemaining,
    setSleepTimer,
    pauseTrack,
    queue,
    currentIndex,
    autoPlayRadio,
    addToQueue,
  } = usePlayerStore();

  const { addToHistory } = useLibraryStore();
  const playerRef = useRef<any>(null);
  const timeUpdateInterval = useRef<any>(null);

  // Initialize Media Session API for mobile lock-screen & notification controls
  const updateMediaSession = (track: typeof currentTrack) => {
    if (!('mediaSession' in navigator) || !track) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album?.title || 'YouTune Music',
        artwork: [
          { src: track.thumbnailUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: track.thumbnailUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: track.thumbnailUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: track.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      // Lock Screen Action Handlers
      navigator.mediaSession.setActionHandler('play', () => {
        playerRef.current?.playVideo?.();
        setPlaybackState('playing');
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        playerRef.current?.pauseVideo?.();
        setPlaybackState('paused');
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && playerRef.current?.seekTo) {
          playerRef.current.seekTo(details.seekTime, true);
          setCurrentTime(details.seekTime);
        }
      });
    } catch (e) {
      console.warn('MediaSession setup error', e);
    }
  };

  // Initialize Official YouTube Iframe Player
  useEffect(() => {
    let isMounted = true;

    const createPlayer = () => {
      if (!isMounted || !window.YT || !window.YT.Player || playerRef.current) return;
      const el = document.getElementById('yt-universal-player');
      if (!el) return;

      try {
        playerRef.current = new window.YT.Player('yt-universal-player', {
          height: '100%',
          width: '100%',
          videoId: currentTrack ? currentTrack.youtubeId : 'dQw4w9WgXcQ',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              event.target.setVolume(isMuted ? 0 : volume);
              if (currentTrack) {
                event.target.loadVideoById(currentTrack.youtubeId);
                event.target.playVideo();
                setPlaybackState('playing');
                updateMediaSession(currentTrack);
                addToHistory(currentTrack);
                PersonalDiscoveryEngine.logPlay(currentTrack);
              }
            },
            onStateChange: async (event: any) => {
              if (!isMounted) return;
              if (event.data === 1) { // Playing
                setPlaybackState('playing');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                if (playerRef.current?.getDuration) {
                  const d = playerRef.current.getDuration();
                  if (d > 0) setDuration(d);
                }
              } else if (event.data === 2) { // Paused
                setPlaybackState('paused');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
              } else if (event.data === 3) { // Buffering
                setPlaybackState('loading');
              } else if (event.data === 0) { // Ended
                setPlaybackState('ended');
                // Smart Autoplay Radio when queue ends
                if (currentIndex >= queue.length - 1 && autoPlayRadio && currentTrack) {
                  try {
                    const searchRes = await ClientMusicService.search(`${currentTrack.artist} song`);
                    const radioTracks = searchRes.tracks || [];
                    const next = radioTracks.find((t: any) => t.youtubeId !== currentTrack.youtubeId);
                    if (next) addToQueue(next);
                  } catch (e) {
                    console.warn('Autoplay error', e);
                  }
                }
                nextTrack();
              }
            },
            onError: (event: any) => {
              console.error('YouTube Player Error code:', event.data);
              setPlaybackState('error');
            },
          },
        });
      } catch (err) {
        console.error('Failed to instantiate YT Player', err);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          createPlayer();
        }
      }, 150);

      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        createPlayer();
      };

      return () => {
        isMounted = false;
        clearInterval(checkInterval);
      };
    }

    setSeekPlayerHandler((timeSec: number) => {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(timeSec, true);
      }
    });

    return () => {
      isMounted = false;
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    };
  }, []);

  // Track changes: load into YT Player
  useEffect(() => {
    if (!currentTrack || !playerRef.current) return;
    try {
      if (typeof playerRef.current.loadVideoById === 'function') {
        setPlaybackState('loading');
        updateMediaSession(currentTrack);
        addToHistory(currentTrack);
        PersonalDiscoveryEngine.logPlay(currentTrack);

        playerRef.current.loadVideoById(currentTrack.youtubeId);
        playerRef.current.playVideo();
      }
    } catch (e) {
      console.warn('Track switch error in YT Player', e);
    }
  }, [currentTrack?.youtubeId]);

  // Sync play / pause
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (playbackState === 'playing') {
        playerRef.current.playVideo?.();
      } else if (playbackState === 'paused') {
        playerRef.current.pauseVideo?.();
      }
    } catch (e) {
      console.warn('Sync play/pause failed', e);
    }
  }, [playbackState]);

  // Sync volume / mute
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.mute?.();
      } else {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(volume);
      }
    } catch (e) {
      console.warn('Sync volume failed', e);
    }
  }, [volume, isMuted]);

  // Time progress polling
  useEffect(() => {
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime && playbackState === 'playing') {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          setCurrentTime(time);
          if ('mediaSession' in navigator && playerRef.current.getDuration) {
            try {
              const d = playerRef.current.getDuration();
              if (d > 0) {
                navigator.mediaSession.setPositionState({
                  duration: d,
                  playbackRate: 1,
                  position: time,
                });
              }
            } catch {}
          }
        }
      }
    }, 400);

    return () => {
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    };
  }, [playbackState]);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerRemaining === null) return;
    if (sleepTimerRemaining <= 0) {
      pauseTrack();
      setSleepTimer(null);
      return;
    }

    const interval = setInterval(() => {
      usePlayerStore.setState((state) => {
        if (state.sleepTimerRemaining === null) return {};
        const remaining = state.sleepTimerRemaining - 1;
        if (remaining <= 0) {
          state.pauseTrack();
          return { sleepTimerRemaining: null };
        }
        return { sleepTimerRemaining: remaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  return (
    <div
      className="fixed -bottom-[9999px] -right-[9999px] w-1 h-1 pointer-events-none opacity-0 overflow-hidden"
      aria-hidden="true"
    >
      <div id="yt-universal-player" className="w-full h-full" />
    </div>
  );
};
