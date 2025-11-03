import { usePlaybackControllerGetCurrentPlayback } from "@/data/api";

/**
 * Hook to poll current playback state from Spotify API
 * This shows what's playing across all devices (phone, desktop, web player, etc.)
 */
export function useCurrentPlayback() {
  const { data, isLoading, error, refetch } =
    usePlaybackControllerGetCurrentPlayback({
      query: {
        refetchInterval: 5000, // Poll every 5 seconds
        refetchIntervalInBackground: false, // Don't poll when tab is not active
        retry: false, // Don't retry on error
      },
    });

  return {
    currentPlayback: data,
    error,
    isLoading,
    refetch,
  };
}
