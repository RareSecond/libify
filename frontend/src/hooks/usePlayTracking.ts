import { useEffect, useRef, useState } from "react";

import { useLibraryControllerRecordPlay } from "../data/api";

export function usePlayTracking() {
  const [playTrackingTimer, setPlayTrackingTimer] = useState<null | number>(
    null,
  );
  const [currentTrackId, setCurrentTrackId] = useState<null | string>(null);
  const [playStartTime, setPlayStartTime] = useState<null | number>(null);
  const onPlayRecordedCallbackRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const recordPlayMutation = useLibraryControllerRecordPlay();

  // Cleanup effect to prevent setState after unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Clear any pending timer on unmount
      if (playTrackingTimer) {
        window.clearTimeout(playTrackingTimer);
      }
    };
  }, [playTrackingTimer]);

  const clearPlayTrackingTimer = () => {
    if (playTrackingTimer) {
      window.clearTimeout(playTrackingTimer);
      setPlayTrackingTimer(null);
    }
    setCurrentTrackId(null);
    setPlayStartTime(null);
    onPlayRecordedCallbackRef.current = null;
  };

  const startPlayTracking = (trackId: string, onPlayRecorded?: () => void) => {
    clearPlayTrackingTimer();
    setCurrentTrackId(trackId);
    setPlayStartTime(Date.now());
    onPlayRecordedCallbackRef.current = onPlayRecorded || null;

    const timerId = window.setTimeout(async () => {
      try {
        if (recordPlayMutation?.mutateAsync) {
          await recordPlayMutation.mutateAsync({ trackId });
          if (onPlayRecorded) {
            onPlayRecorded();
          }
        }
      } catch {
        // Silently fail
      } finally {
        // Only update state if still mounted
        if (isMountedRef.current) {
          setPlayTrackingTimer(null);
          setCurrentTrackId(null);
          setPlayStartTime(null);
          onPlayRecordedCallbackRef.current = null;
        }
      }
    }, 30000);

    setPlayTrackingTimer(timerId);
  };

  const resumePlayTracking = () => {
    if (!currentTrackId) return;

    const elapsed = playStartTime ? Date.now() - playStartTime : 0;
    const remainingTime = Math.max(0, 30000 - elapsed);

    if (remainingTime > 0 && !playTrackingTimer) {
      const timerId = window.setTimeout(async () => {
        try {
          if (recordPlayMutation?.mutateAsync) {
            await recordPlayMutation.mutateAsync({ trackId: currentTrackId });
            if (onPlayRecordedCallbackRef.current) {
              onPlayRecordedCallbackRef.current();
            }
          }
        } catch {
          // Silently fail
        } finally {
          // Only update state if still mounted
          if (isMountedRef.current) {
            setPlayTrackingTimer(null);
            setCurrentTrackId(null);
            setPlayStartTime(null);
            onPlayRecordedCallbackRef.current = null;
          }
        }
      }, remainingTime);
      setPlayTrackingTimer(timerId);
    }
  };

  const pausePlayTracking = () => {
    if (playTrackingTimer) {
      window.clearTimeout(playTrackingTimer);
      setPlayTrackingTimer(null);
    }
  };

  return {
    clearPlayTrackingTimer,
    currentTrackId,
    onPlayRecordedCallbackRef,
    pausePlayTracking,
    resumePlayTracking,
    startPlayTracking,
  };
}
