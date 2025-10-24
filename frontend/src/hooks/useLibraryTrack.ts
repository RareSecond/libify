import { useLibraryControllerGetTrackBySpotifyId } from "../data/api";

interface UseLibraryTrackOptions {
  spotifyId?: string;
}

/**
 * Fetches library track data by Spotify ID.
 * Uses linked_from field to handle track relinking.
 */
export function useLibraryTrack({ spotifyId }: UseLibraryTrackOptions) {
  const {
    data: libraryTrack,
    isLoading,
    refetch: refetchLibraryTrack,
  } = useLibraryControllerGetTrackBySpotifyId(spotifyId || "", {
    query: {
      enabled: !!spotifyId,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 404 - track not in library
        if (error && typeof error === "object" && "status" in error) {
          if ((error as { status?: number }).status === 404) return false;
        }
        return failureCount < 3;
      },
    },
  });

  return { isLoading, libraryTrack, refetchLibraryTrack };
}
