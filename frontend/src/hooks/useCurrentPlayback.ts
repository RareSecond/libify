import { usePlaybackControllerGetCurrentPlayback } from "@/data/api";

/**
 * Hook to poll current playback state from Spotify API
 * This shows what's playing across all devices (phone, desktop, web player, etc.)
 *
 * Polling strategy:
 * - Always poll at 5 seconds
 * - Used only for cross-device playback (phone/desktop)
 * - Web player uses SDK events which are instant
 */
export function useCurrentPlayback() {
  const { data, error, isLoading, refetch } =
    usePlaybackControllerGetCurrentPlayback({
      query: {
        refetchInterval: 5000, // Poll every 5 seconds for cross-device playback
        refetchIntervalInBackground: false, // Don't poll when tab is not active
        retry: false, // Don't retry on error
      },
    });

  return { currentPlayback: data, error, isLoading, refetch };
}
