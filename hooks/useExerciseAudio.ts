import { useEffect, useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';

interface UseExerciseAudioReturn {
  audioReady: boolean;
  isAudioPlaying: boolean;
  playAudio: () => Promise<void>;
  resetAudio: () => Promise<void>;
  cleanupAudio: () => Promise<void>;
}

export function useExerciseAudio(
  audioUrl: string | null,
  enableAudio: boolean,
  onPlaybackComplete: () => void
): UseExerciseAudioReturn {
  const [audioReady, setAudioReady] = useState(!enableAudio || !audioUrl);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const onCompleteRef = useRef(onPlaybackComplete);
  onCompleteRef.current = onPlaybackComplete;

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await cleanup();
      setAudioReady(false);
      setIsAudioPlaying(false);

      if (!enableAudio || !audioUrl) {
        setAudioReady(true);
        return;
      }

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          (status: any) => {
            if (cancelled) return;
            if (status.isLoaded) {
              if (status.didJustFinish && !status.isLooping) {
                setIsAudioPlaying(false);
                onCompleteRef.current();
              }
            }
          }
        );

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        const status = await sound.getStatusAsync();
        if (status.isLoaded && !cancelled) {
          setAudioReady(true);
        }
      } catch (_) {
        if (!cancelled) setAudioReady(true);
      }
    };

    load();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [audioUrl, enableAudio]);

  const playAudio = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
      setIsAudioPlaying(true);
    } catch (_) {}
  }, []);

  const resetAudio = useCallback(async () => {
    setIsAudioPlaying(false);
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.setPositionAsync(0);
      } catch (_) {}
    }
  }, []);

  return {
    audioReady,
    isAudioPlaying,
    playAudio,
    resetAudio,
    cleanupAudio: cleanup,
  };
}
