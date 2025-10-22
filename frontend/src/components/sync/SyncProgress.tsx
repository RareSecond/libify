import { Badge, Group, Progress, Stack, Text } from "@mantine/core";
import { Album, Clock, List, Music } from "lucide-react";

interface SyncCategoryProgress {
  processed: number;
  total: number;
}

interface SyncProgressBreakdown {
  albums: SyncCategoryProgress;
  playlists: SyncCategoryProgress;
  tracks: SyncCategoryProgress;
}

interface SyncProgressData {
  breakdown?: SyncProgressBreakdown;
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
  const breakdown = syncProgress.progress?.breakdown;

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

      {breakdown && (
        <Group className="mt-2" gap="xs">
          <Badge
            color={
              breakdown.tracks.processed === breakdown.tracks.total
                ? "green"
                : "blue"
            }
            leftSection={<Music size={12} />}
            size="sm"
            variant="light"
          >
            Tracks: {breakdown.tracks.processed}/{breakdown.tracks.total}
          </Badge>
          <Badge
            color={
              breakdown.albums.processed === breakdown.albums.total
                ? "green"
                : "blue"
            }
            leftSection={<Album size={12} />}
            size="sm"
            variant="light"
          >
            Albums: {breakdown.albums.processed}/{breakdown.albums.total}
          </Badge>
          <Badge
            color={
              breakdown.playlists.processed === breakdown.playlists.total
                ? "green"
                : "blue"
            }
            leftSection={<List size={12} />}
            size="sm"
            variant="light"
          >
            Playlists: {breakdown.playlists.processed}/
            {breakdown.playlists.total}
          </Badge>
        </Group>
      )}
    </Stack>
  );
}
