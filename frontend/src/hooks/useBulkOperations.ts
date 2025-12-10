import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";

import {
  getLibraryControllerGetAlbumsQueryKey,
  getLibraryControllerGetArtistsQueryKey,
  getLibraryControllerGetTracksQueryKey,
  useLibraryControllerBulkRateTracks,
  useLibraryControllerBulkTagTracks,
} from "@/data/api";

export function useBulkOperations() {
  const queryClient = useQueryClient();

  const invalidateTrackQueries = () => {
    queryClient.invalidateQueries({
      queryKey: getLibraryControllerGetTracksQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getLibraryControllerGetAlbumsQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getLibraryControllerGetArtistsQueryKey(),
    });
    queryClient.invalidateQueries({ queryKey: ["/library/tracks/spotify"] });
  };

  const bulkRateMutation = useLibraryControllerBulkRateTracks({
    mutation: {
      onError: (error) => {
        notifications.show({
          color: "red",
          message:
            error instanceof Error ? error.message : "Failed to rate tracks",
          title: "Error",
        });
      },
      onSuccess: (data) => {
        notifications.show({
          color: "green",
          message: data.message,
          title: "Bulk rating complete",
        });
        invalidateTrackQueries();
      },
    },
  });

  const bulkTagMutation = useLibraryControllerBulkTagTracks({
    mutation: {
      onError: (error) => {
        notifications.show({
          color: "red",
          message:
            error instanceof Error ? error.message : "Failed to update tags",
          title: "Error",
        });
      },
      onSuccess: (data) => {
        notifications.show({
          color: "green",
          message: data.message,
          title: "Bulk tag operation complete",
        });
        invalidateTrackQueries();
      },
    },
  });

  return { bulkRateMutation, bulkTagMutation };
}
