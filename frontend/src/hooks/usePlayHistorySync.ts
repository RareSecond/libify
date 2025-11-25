import { notifications } from "@mantine/notifications";

import { PlaySyncResultDto, useLibraryControllerSyncPlays } from "../data/api";

export function usePlayHistorySync(onSuccess: () => void) {
  const { isPending: isSyncing, mutate: syncPlays } =
    useLibraryControllerSyncPlays({
      mutation: {
        onError: (error) => {
          notifications.show({
            color: "red",
            message:
              (error as Error & { response?: { data?: { message?: string } } })
                .response?.data?.message || "Failed to sync play history",
            title: "Sync failed",
          });
        },
        onSuccess: (data: PlaySyncResultDto) => {
          // Only treat as completed and trigger refetch when status is "completed"
          if (data.status === "completed") {
            notifications.show({
              color:
                data.newPlaysCount && data.newPlaysCount > 0 ? "green" : "blue",
              message: data.message,
              title:
                data.newPlaysCount && data.newPlaysCount > 0
                  ? `${data.newPlaysCount} new plays imported`
                  : "Sync completed",
            });
            // Trigger refetch only on successful completion
            onSuccess();
          } else if (
            data.status === "processing" ||
            data.status === "unknown"
          ) {
            // Sync is still in progress or status unknown - inform user without refetching
            notifications.show({
              color: "blue",
              message: data.message,
              title: "Sync in progress",
            });
          } else {
            // Unexpected status - show informational notification
            notifications.show({
              color: "yellow",
              message: data.message,
              title: `Sync status: ${data.status}`,
            });
          }
        },
      },
    });

  return { isSyncing, syncPlays };
}
