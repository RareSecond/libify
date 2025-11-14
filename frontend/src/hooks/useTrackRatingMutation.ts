import { QueryKey, useQueryClient } from "@tanstack/react-query";

import {
  getLibraryControllerGetTracksQueryKey,
  PaginatedTracksDto,
  TrackDto,
  useLibraryControllerUpdateTrackRating,
} from "@/data/api";

interface MutationContext {
  previousTrackQueries: Array<[QueryKey, unknown]>;
  previousTracksQueries: Array<[QueryKey, unknown]>;
}

export function useTrackRatingMutation() {
  const queryClient = useQueryClient();

  return useLibraryControllerUpdateTrackRating({
    mutation: {
      onError: (_err, _variables, context: MutationContext | undefined) => {
        // Rollback to previous values on error
        if (context?.previousTracksQueries) {
          context.previousTracksQueries.forEach(
            ([queryKey, data]: [QueryKey, unknown]) => {
              queryClient.setQueryData(queryKey, data);
            },
          );
        }
        if (context?.previousTrackQueries) {
          context.previousTrackQueries.forEach(
            ([queryKey, data]: [QueryKey, unknown]) => {
              queryClient.setQueryData(queryKey, data);
            },
          );
        }
      },
      onMutate: async ({
        data: { rating: newRating },
        trackId,
      }): Promise<MutationContext> => {
        // Cancel any outgoing refetches to prevent race conditions
        await queryClient.cancelQueries({
          queryKey: getLibraryControllerGetTracksQueryKey(),
        });
        await queryClient.cancelQueries({
          queryKey: ["/library/tracks/spotify"],
        });

        // Snapshot the previous values for both query types
        const previousTracksQueries = queryClient.getQueriesData({
          queryKey: getLibraryControllerGetTracksQueryKey(),
        });

        const previousTrackQueries = queryClient.getQueriesData({
          queryKey: ["/library/tracks/spotify"],
        });

        // Optimistically update all track list queries
        queryClient.setQueriesData<PaginatedTracksDto>(
          { queryKey: getLibraryControllerGetTracksQueryKey() },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              tracks: old.tracks.map((track) =>
                track.id === trackId ? { ...track, rating: newRating } : track,
              ),
            };
          },
        );

        // Optimistically update the single track queries (for now playing bar)
        queryClient.setQueriesData<TrackDto>(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              typeof query.queryKey[0] === "string" &&
              query.queryKey[0].startsWith("/library/tracks/spotify/"),
          },
          (old) => {
            if (!old || old.id !== trackId) return old;
            return { ...old, rating: newRating };
          },
        );

        return { previousTrackQueries, previousTracksQueries };
      },
      onSettled: () => {
        // Refetch to ensure we're in sync with server
        queryClient.invalidateQueries({
          queryKey: getLibraryControllerGetTracksQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: ["/library/tracks/spotify"],
        });
      },
    },
  });
}
