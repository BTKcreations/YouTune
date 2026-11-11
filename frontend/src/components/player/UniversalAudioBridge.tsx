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
  const watchdogTimer = useRef<any>(null);

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
            controls: 1, // Standard controls for compliance and user interaction
            disablekb: 0,
            fs: 1,
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
              // 1: Playing, 2: Paused, 3: Buffering, 0: Ended
              if (event.data === 1) {
                // Clear watchdog since playback successfully started
                if (watchdogTimer.current) {
                  clearTimeout(watchdogTimer.current);
                  watchdogTimer.current = null;
                }
                setPlaybackState('playing');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                if (playerRef.current?.getDuration) {
                  const d = playerRef.current.getDuration();
                  if (d > 0) setDuration(d);
                }
              } else if (event.data === 2) {
                setPlaybackState('paused');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
              } else if (event.data === 3) {
                setPlaybackState('loading');
              } else if (event.data === 0) {
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
              // On unplayable video, auto-advance after short pause
              setTimeout(() => {
                if (isMounted) nextTrack();
              }, 1500);
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
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        createPlayer();
      };

      // Load YouTube IFrame API script if not loaded
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }

    setSeekPlayerHandler((timeSec: number) => {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(timeSec, true);
      }
    });

    return () => {
      isMounted = false;
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    };
  }, []);

  // Track changes: load into YT Player with 2.5s watchdog timer
  useEffect(() => {
    if (!currentTrack || !playerRef.current) return;
    try {
      updateMediaSession(currentTrack);
      addToHistory(currentTrack);
      PersonalDiscoveryEngine.logPlay(currentTrack);

      setPlaybackState('loading');

      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(currentTrack.youtubeId);
        playerRef.current.playVideo?.();
      } else if (typeof playerRef.current.cueVideoById === 'function') {
        playerRef.current.cueVideoById(currentTrack.youtubeId);
        playerRef.current.playVideo?.();
      }

      // Watchdog timer (2.5s) to guarantee playback starts or attempts fallback
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
      watchdogTimer.current = setTimeout(() => {
        if (playerRef.current?.getPlayerState) {
          const state = playerRef.current.getPlayerState();
          // If not playing (1) or buffering (3), force a play command
          if (state !== 1 && state !== 3) {
            playerRef.current.playVideo?.();
          }
        }
      }, 2500);
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
      if (playerRef.current?.getCurrentTime) {
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
  }, []);

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

  // Render iframe inside the container with valid dimensions and visibility
  return (
    <div id="yt-universal-player" className="w-full h-full" />
  );
};
