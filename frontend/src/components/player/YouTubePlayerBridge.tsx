import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';

export const YouTubePlayerBridge: React.FC = () => {
  const {
    currentTrack,
    playbackState,
    volume,
    isMuted,
    currentTime,
    setPlaybackState,
    setCurrentTime,
    setDuration,
    nextTrack,
    setSeekPlayerHandler,
  } = usePlayerStore();

  const { addToHistory } = useLibraryStore();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeUpdateInterval = useRef<any>(null);

  // Initialize YT Player API
  useEffect(() => {
    let isMounted = true;

    const createPlayer = () => {
      if (!isMounted) return;
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      const container = document.getElementById('yt-iframe-instance');
      if (!container) return;

      try {
        playerRef.current = new window.YT.Player('yt-iframe-instance', {
          height: '100%',
          width: '100%',
          videoId: currentTrack ? currentTrack.youtubeId : 'dQw4w9WgXcQ',
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
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
                addToHistory(currentTrack);
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              if (event.data === 1) {
                setPlaybackState('playing');
                if (playerRef.current && playerRef.current.getDuration) {
                  setDuration(playerRef.current.getDuration());
                }
              } else if (event.data === 2) {
                setPlaybackState('paused');
              } else if (event.data === 3) {
                setPlaybackState('loading');
              } else if (event.data === 0) {
                setPlaybackState('ended');
                nextTrack();
              }
            },
            onError: (event: any) => {
              console.error('YouTube Player Error:', event.data);
              setPlaybackState('error');
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YT.Player instance', err);
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
      }, 200);

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
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(timeSec, true);
      }
    });

    return () => {
      isMounted = false;
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, []);

  // Sync track change
  useEffect(() => {
    if (!currentTrack || !playerRef.current) return;
    try {
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(currentTrack.youtubeId);
        playerRef.current.playVideo();
        setPlaybackState('playing');
        addToHistory(currentTrack);
      }
    } catch (e) {
      console.warn('Error loading video in YT Player', e);
    }
  }, [currentTrack?.youtubeId]);

  // Sync play / pause
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.getPlayerState) return;
    try {
      if (playbackState === 'playing') {
        playerRef.current.playVideo();
      } else if (playbackState === 'paused') {
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.warn('Sync play/pause failed', e);
    }
  }, [playbackState]);

  // Sync volume / mute
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.setVolume) return;
    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      }
    } catch (e) {
      console.warn('Sync volume failed', e);
    }
  }, [volume, isMuted]);

  // Periodic polling for progress
  useEffect(() => {
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playbackState === 'playing') {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number') {
          setCurrentTime(time);
        }
      }
    }, 500);

    return () => {
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    };
  }, [playbackState]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden"
    >
      <div id="yt-iframe-instance" className="w-full h-full" />
    </div>
  );
};
