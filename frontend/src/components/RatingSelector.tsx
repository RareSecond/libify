import { Group } from "@mantine/core";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";

import {
  getLibraryControllerGetTracksQueryKey,
  PaginatedTracksDto,
  TrackDto,
  useLibraryControllerUpdateTrackRating,
} from "../data/api";

interface MutationContext {
  previousTrackQueries: Array<[QueryKey, unknown]>;
  previousTracksQueries: Array<[QueryKey, unknown]>;
}

interface RatingSelectorProps {
  rating: null | number;
  trackId: string;
}

export function RatingSelector({ rating, trackId }: RatingSelectorProps) {
  const [hoveredRating, setHoveredRating] = useState<null | number>(null);
  const queryClient = useQueryClient();

  const updateRatingMutation = useLibraryControllerUpdateTrackRating({
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
        // We need to update all track-by-spotify-id queries and check the internal ID
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

  const handleRatingClick = async (e: React.MouseEvent, newRating: number) => {
    e.stopPropagation();
    if (updateRatingMutation.isPending) return;

    updateRatingMutation.mutate({ data: { rating: newRating }, trackId });
  };

  const displayRating = hoveredRating ?? rating ?? 0;

  return (
    <Group gap={0} onMouseLeave={() => setHoveredRating(null)} wrap="nowrap">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const leftHalfValue = starIndex - 0.5;
        const fullValue = starIndex;

        const fillType =
          displayRating >= fullValue
            ? "full"
            : displayRating >= leftHalfValue
              ? "half"
              : "empty";

        return (
          <div
            className={`relative h-4 w-4 ${updateRatingMutation.isPending ? "cursor-default" : "cursor-pointer"}`}
            key={starIndex}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ marginLeft: starIndex > 1 ? -4 : 0 }}
          >
            {/* Left half click area */}
            <div
              className="absolute left-0 top-0 z-[2] h-full w-1/2"
              onClick={(e) =>
                !updateRatingMutation.isPending &&
                handleRatingClick(e, leftHalfValue)
              }
              onMouseEnter={() =>
                !updateRatingMutation.isPending &&
                setHoveredRating(leftHalfValue)
              }
            />
            {/* Right half click area */}
            <div
              className="absolute right-0 top-0 z-[2] h-full w-1/2"
              onClick={(e) =>
                !updateRatingMutation.isPending &&
                handleRatingClick(e, fullValue)
              }
              onMouseEnter={() =>
                !updateRatingMutation.isPending && setHoveredRating(fullValue)
              }
            />
            {/* Star visual */}
            <div className="relative h-full w-full">
              {/* Background star (empty) */}
              <Star
                className="absolute left-0.5 top-0.5"
                color="gray"
                fill="transparent"
                size={12}
              />
              {/* Foreground star (filled) */}
              {fillType !== "empty" && (
                <div
                  className={`absolute left-0 top-0 h-full overflow-hidden ${fillType === "half" ? "w-1/2" : "w-full"}`}
                >
                  <Star
                    className="absolute left-0.5 top-0.5"
                    color="gold"
                    fill="gold"
                    size={12}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Group>
  );
}
