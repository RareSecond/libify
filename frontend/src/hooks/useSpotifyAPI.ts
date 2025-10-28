import { useQueryClient } from "@tanstack/react-query";

import {
  getAuthControllerGetAccessTokenQueryOptions,
  getLibraryControllerGetAlbumTracksQueryOptions,
  getLibraryControllerGetArtistTracksQueryOptions,
  getLibraryControllerGetTracksQueryOptions,
  getPlaylistsControllerGetTracksQueryOptions,
} from "@/data/api";

interface PlayContext {
  clickedIndex?: number;
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist";
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  shuffle?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export function useSpotifyAPI() {
  const queryClient = useQueryClient();

  const getAccessToken = async (): Promise<string> => {
    const queryOptions = getAuthControllerGetAccessTokenQueryOptions({
      query: {
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      },
    });

    const data = await queryClient.fetchQuery(queryOptions);
    return data.accessToken;
  };

  const fetchAllTracksForContext = async (
    currentContext: null | PlayContext,
    currentTrackList: string[],
  ): Promise<string[]> => {
    if (!currentContext || !currentContext.contextType) {
      return currentTrackList;
    }

    try {
      let allTracks: string[] = [];

      switch (currentContext.contextType) {
        case "album": {
          if (currentContext.contextId) {
            const [artist, album] = currentContext.contextId.split("|");
            if (!artist || !album) {
              return currentTrackList;
            }

            const queryOptions = getLibraryControllerGetAlbumTracksQueryOptions(
              artist,
              album,
            );
            const data = await queryClient.fetchQuery(queryOptions);

            allTracks = Array.isArray(data)
              ? data
                  .filter((track) => track.spotifyId)
                  .map((track) => `spotify:track:${track.spotifyId}`)
              : [];
          }
          break;
        }

        case "artist": {
          if (currentContext.contextId) {
            const queryOptions =
              getLibraryControllerGetArtistTracksQueryOptions(
                currentContext.contextId,
              );
            const data = await queryClient.fetchQuery(queryOptions);

            allTracks = Array.isArray(data)
              ? data
                  .filter((track) => track.spotifyId)
                  .map((track) => `spotify:track:${track.spotifyId}`)
              : [];
          }
          break;
        }

        case "library": {
          const params = {
            page: 1,
            pageSize: 500,
            sortBy: "addedAt" as const,
            sortOrder: "desc" as const,
            ...(currentContext.search && { search: currentContext.search }),
          };

          const queryOptions =
            getLibraryControllerGetTracksQueryOptions(params);
          const data = await queryClient.fetchQuery(queryOptions);

          allTracks = data.tracks
            .filter((track) => track.spotifyId)
            .map((track) => `spotify:track:${track.spotifyId}`);
          break;
        }

        case "playlist": {
          if (currentContext.contextId) {
            const params = { page: 1, pageSize: 500 };

            const queryOptions = getPlaylistsControllerGetTracksQueryOptions(
              currentContext.contextId,
              params,
            );
            const data = await queryClient.fetchQuery(queryOptions);

            allTracks = data.tracks
              .filter((track) => track.spotifyId)
              .map((track) => `spotify:track:${track.spotifyId}`);
          }
          break;
        }
      }

      return allTracks.length > 0 ? allTracks : currentTrackList;
    } catch {
      return currentTrackList;
    }
  };

  return { fetchAllTracksForContext, getAccessToken };
}
