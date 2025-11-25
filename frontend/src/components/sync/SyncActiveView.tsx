import { Stack, Text } from "@mantine/core";

import { SyncJobStatus } from "@/hooks/useSyncProgress";

import { SyncProgress } from "./SyncProgress";

interface SyncActiveViewProps {
  syncProgress: SyncJobStatus;
}

export function SyncActiveView({ syncProgress }: SyncActiveViewProps) {
  return (
    <Stack gap="md">
      <div>
        <Text className="font-medium text-dark-0" size="lg">
          Syncing Library
        </Text>
        <Text className="text-dark-1" size="sm">
          {syncProgress.state === "waiting"
            ? "Waiting in queue..."
            : "Sync in progress, please wait..."}
        </Text>
      </div>

      <SyncProgress syncProgress={syncProgress} />
    </Stack>
  );
}
