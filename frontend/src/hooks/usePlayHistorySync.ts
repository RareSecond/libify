import { notifications } from "@mantine/notifications";

import { useLibraryControllerSyncPlays } from "../data/api";

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
        onSuccess: (data) => {
          const newPlaysCount = (data as unknown as { newPlaysCount?: number })
            ?.newPlaysCount;
          const message =
            (data as unknown as { message?: string })?.message ||
            "Play history has been refreshed from Spotify";

          notifications.show({
            color: newPlaysCount && newPlaysCount > 0 ? "green" : "blue",
            message,
            title:
              newPlaysCount && newPlaysCount > 0
                ? `${newPlaysCount} new plays imported`
                : "Sync completed",
          });
          onSuccess();
        },
      },
    });

  return { isSyncing, syncPlays };
}
