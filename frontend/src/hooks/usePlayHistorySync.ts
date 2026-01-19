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
            onSuccess();
          } else if (
            data.status === "processing" ||
            data.status === "unknown"
          ) {
            notifications.show({
              color: "blue",
              message: data.message,
              title: "Sync in progress",
            });
          } else {
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
