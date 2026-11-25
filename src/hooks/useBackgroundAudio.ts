"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseBackgroundAudioOptions {
  sourceUrl: string;
  defaultVolume?: number;
}

export interface BackgroundAudioController {
  isPlaying: boolean;
  isAutoPausedByVideo: boolean;
  hasStarted: boolean;
  startFromUserGesture: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pauseForVideo: () => void;
  resumeAfterVideo: () => Promise<void>;
}

export function useBackgroundAudio({
  sourceUrl,
  defaultVolume = 1,
}: UseBackgroundAudioOptions): BackgroundAudioController {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const manuallyPausedRef = useRef<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAutoPausedByVideo, setIsAutoPausedByVideo] = useState(false);

  const ensureAudioElement = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const audio = new Audio(sourceUrl);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = Math.min(1, Math.max(0, defaultVolume));
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [sourceUrl, defaultVolume]);

  const startFromUserGesture = useCallback(async () => {
    const audio = ensureAudioElement();
    if (!audio) return;
    try {
      manuallyPausedRef.current = false;
      setIsAutoPausedByVideo(false);
      await audio.play();
      setHasStarted(true);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [ensureAudioElement]);

  const togglePlayPause = useCallback(async () => {
    const audio = ensureAudioElement();
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      manuallyPausedRef.current = true;
      setIsAutoPausedByVideo(false);
      setIsPlaying(false);
      return;
    }
    try {
      manuallyPausedRef.current = false;
      setIsAutoPausedByVideo(false);
      await audio.play();
      setHasStarted(true);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [ensureAudioElement]);

  const pauseForVideo = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      setIsAutoPausedByVideo(true);
    }
  }, []);

  const resumeAfterVideo = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsAutoPausedByVideo(false);
    if (hasStarted && !manuallyPausedRef.current && audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [hasStarted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    isAutoPausedByVideo,
    hasStarted,
    startFromUserGesture,
    togglePlayPause,
    pauseForVideo,
    resumeAfterVideo,
  };
}
