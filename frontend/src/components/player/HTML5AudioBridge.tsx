import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { ClientMusicService } from '../../services/clientMusicService';
import { PersonalDiscoveryEngine } from '../../services/discoveryEngine';

export const HTML5AudioBridge: React.FC = () => {
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
  } = usePlayerStore();

  const { addToHistory } = useLibraryStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        audioRef.current?.play();
        setPlaybackState('playing');
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setPlaybackState('paused');
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    } catch (e) {
      console.warn('MediaSession setup error', e);
    }
  };

  // Create and configure Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = isMuted ? 0 : volume / 100;
    audioRef.current = audio;

    audio.addEventListener('play', () => {
      setPlaybackState('playing');
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });

    audio.addEventListener('pause', () => {
      setPlaybackState('paused');
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      if ('mediaSession' in navigator && audio.duration && !isNaN(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {
          // Ignore state sync errors during rapid seeks
        }
      }
    });

    audio.addEventListener('durationchange', () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('ended', () => {
      setPlaybackState('ended');
      nextTrack();
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error', e);
      setPlaybackState('error');
    });

    // Provide seek capability to store
    setSeekPlayerHandler((timeSec: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = timeSec;
      }
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Track change handler: fetch direct stream and start playback
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    let isCancelled = false;

    const loadAndPlay = async () => {
      try {
        setPlaybackState('loading');
        updateMediaSession(currentTrack);
        addToHistory(currentTrack);
        PersonalDiscoveryEngine.logPlay(currentTrack);

        // Fetch high quality audio stream
        const streamUrl = await ClientMusicService.getAudioStreamUrl(currentTrack.youtubeId);
        if (isCancelled || !audioRef.current) return;

        audioRef.current.src = streamUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setPlaybackState('playing');
      } catch (err) {
        console.warn('Stream play error, falling back', err);
        // Fallback direct url
        if (audioRef.current && !isCancelled) {
          audioRef.current.src = `https://yt.chocolatemoo53.com/latest_version?id=${currentTrack.youtubeId}&itag=140`;
          audioRef.current.play().catch(e => console.error('Audio play failed', e));
        }
      }
    };

    loadAndPlay();

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.youtubeId]);

  // Sync play / pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (playbackState === 'playing' && audioRef.current.paused) {
      audioRef.current.play().catch(e => console.warn('Play interrupted', e));
    } else if (playbackState === 'paused' && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [playbackState]);

  // Sync volume / mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  return null;
};
