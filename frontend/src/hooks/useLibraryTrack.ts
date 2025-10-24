import {
  useLibraryControllerGetTrack,
  useLibraryControllerGetTrackBySpotifyId,
} from "../data/api";

interface UseLibraryTrackOptions {
  currentTrackId?: string;
  internalTrackId?: string;
}

export function useLibraryTrack({
  currentTrackId,
  internalTrackId,
}: UseLibraryTrackOptions) {
  const shouldFetchByInternalId = !!internalTrackId;
  const shouldFetchBySpotifyId = !internalTrackId && !!currentTrackId;

  // Fetch by internal track ID (preferred - handles Spotify's track redirects)
  const {
    data: trackByInternalId,
    isLoading: isLoadingInternal,
    refetch: refetchByInternalId,
  } = useLibraryControllerGetTrack(internalTrackId || "", {
    query: {
      enabled: shouldFetchByInternalId,
      retry: (failureCount, error: unknown) => {
        if (error && typeof error === "object" && "status" in error) {
          if ((error as { status?: number }).status === 404) return false;
        }
        return failureCount < 3;
      },
    },
  });

  // Fallback: fetch by Spotify ID when internal ID not available
  const {
    data: trackBySpotifyId,
    isLoading: isLoadingSpotify,
    refetch: refetchBySpotifyId,
  } = useLibraryControllerGetTrackBySpotifyId(currentTrackId || "", {
    query: {
      enabled: shouldFetchBySpotifyId,
      retry: (failureCount, error: unknown) => {
        if (error && typeof error === "object" && "status" in error) {
          if ((error as { status?: number }).status === 404) return false;
        }
        return failureCount < 3;
      },
    },
  });

  // Use whichever query returned data
  const libraryTrack = trackByInternalId || trackBySpotifyId;
  const isLoading = isLoadingInternal || isLoadingSpotify;

  // Only refetch the active query
  const refetchLibraryTrack = async () => {
    if (shouldFetchByInternalId) {
      await refetchByInternalId();
    } else if (shouldFetchBySpotifyId) {
      await refetchBySpotifyId();
    }
  };

  return { isLoading, libraryTrack, refetchLibraryTrack };
}
