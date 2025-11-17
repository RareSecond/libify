import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { usePlaybackControllerGetCurrentPlayback } from "@/data/api";

/**
 * Hook to poll current playback state from Spotify API
 * This shows what's playing across all devices (phone, desktop, web player, etc.)
 *
 * Smart polling strategy:
 * - When web player SDK is active with track data: Don't poll (use SDK events)
 * - Otherwise: Poll every 5 seconds for cross-device playback
 */
export function useCurrentPlayback() {
  const { currentTrack, deviceId, isReady } = useSpotifyPlayer();

  // Only poll when we DON'T have web player data
  // When web player has track data, we get everything from SDK events
  const hasWebPlayerData = isReady && deviceId && currentTrack;
  const shouldPoll = !hasWebPlayerData;

  const { data, error, isLoading, refetch } =
    usePlaybackControllerGetCurrentPlayback({
      query: {
        enabled: shouldPoll, // Disable query entirely when we have web player data
        refetchInterval: shouldPoll ? 5000 : false, // Poll every 5s for cross-device, disabled for web player
        refetchIntervalInBackground: false, // Don't poll when tab is not active
        retry: false, // Don't retry on error
      },
    });

  return { currentPlayback: data, error, isLoading, refetch };
}
