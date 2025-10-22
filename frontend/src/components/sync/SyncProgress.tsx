import { Badge, Group, Progress, Stack, Text } from "@mantine/core";
import { Clock } from "lucide-react";

interface SyncProgressData {
  current?: number;
  estimatedTimeRemaining?: number;
  itemsPerSecond?: number;
  message?: string;
  percentage?: number;
  phase?: string;
  total?: number;
}

interface SyncProgressProps {
  syncProgress: SyncProgressStatus;
}

interface SyncProgressStatus {
  error?: string;
  progress?: SyncProgressData;
  result?: { totalAlbums: number; totalTracks: number };
  state: "active" | "completed" | "failed" | "waiting";
}

export function SyncProgress({ syncProgress }: SyncProgressProps) {
  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text className="font-medium" size="sm">
          {syncProgress.progress?.message || `Sync ${syncProgress.state}`}
        </Text>
        {syncProgress.progress?.itemsPerSecond && (
          <Badge color="blue" size="sm" variant="light">
            {syncProgress.progress.itemsPerSecond} items/sec
          </Badge>
        )}
      </Group>

      <Progress
        animated={syncProgress.state === "active"}
        color={
          syncProgress.state === "completed"
            ? "green"
            : syncProgress.state === "failed"
              ? "red"
              : "blue"
        }
        striped={syncProgress.state === "active"}
        value={syncProgress.progress?.percentage || 0}
      />

      {syncProgress.progress && (
        <Group justify="space-between">
          <Text color="dimmed" size="xs">
            {syncProgress.progress.phase}: {syncProgress.progress.current}/
            {syncProgress.progress.total}
          </Text>
          {syncProgress.progress.estimatedTimeRemaining && (
            <Text color="dimmed" size="xs">
              <Clock className="inline mr-1" size={12} />
              {Math.ceil(syncProgress.progress.estimatedTimeRemaining / 60)} min
              remaining
            </Text>
          )}
        </Group>
      )}
    </Stack>
  );
}
