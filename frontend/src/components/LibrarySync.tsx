import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
} from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Music,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useSyncProgress } from "../hooks/useSyncProgress";

interface SyncJobResponse {
  jobId: string;
  message: string;
  status: string;
}

interface SyncStatus {
  lastSync: null | string;
  totalAlbums: number;
  totalTracks: number;
}

export function LibrarySync() {
  const [currentJobId, setCurrentJobId] = useState<null | string>(null);
  const { reset: resetProgress, status: syncProgress } =
    useSyncProgress(currentJobId);

  // Query for sync status
  const { data: syncStatus, refetch: refetchStatus } = useQuery<SyncStatus>({
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/library/sync/status`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to fetch sync status");
      return response.json();
    },
    queryKey: ["library-sync-status"],
  });

  // Mutation for starting sync
  const syncLibraryMutation = useMutation<SyncJobResponse>({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/library/sync`,
        {
          credentials: "include",
          method: "POST",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start sync");
      }
      return response.json();
    },
    onError: () => {
      setCurrentJobId(null);
      resetProgress();
    },
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
    },
  });

  // Reset state when sync completes
  useEffect(() => {
    let refetchTimeout: NodeJS.Timeout;
    let resetTimeout: NodeJS.Timeout;

    if (
      syncProgress?.state === "completed" ||
      syncProgress?.state === "failed"
    ) {
      refetchTimeout = setTimeout(() => {
        refetchStatus();
        if (syncProgress.state === "completed") {
          resetTimeout = setTimeout(() => {
            setCurrentJobId(null);
            resetProgress();
          }, 3000);
        }
      }, 1000);
    }

    return () => {
      clearTimeout(refetchTimeout);
      clearTimeout(resetTimeout);
    };
  }, [syncProgress?.state, refetchStatus, resetProgress]);

  const formatLastSync = (lastSync: null | string) => {
    if (!lastSync) return "Never";
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <Card padding="lg" radius="md" shadow="sm" withBorder>
      <Stack gap="md">
        <Group align="center" justify="space-between">
          <div>
            <Text fw={500} size="lg">
              Library Sync
            </Text>
            <Text color="dimmed" size="sm">
              Keep your Spotify library in sync
            </Text>
          </div>
          <div className="flex gap-2">
            <Badge
              color="blue"
              leftSection={<Music size={14} />}
              size="lg"
              variant="light"
            >
              {syncStatus?.totalTracks || 0} tracks
            </Badge>
            <Badge
              color="teal"
              leftSection={<Music size={14} />}
              size="lg"
              variant="light"
            >
              {syncStatus?.totalAlbums || 0} albums
            </Badge>
          </div>
        </Group>

        {syncStatus && (
          <Group gap="xs">
            <Text color="dimmed" size="sm">
              Last synced:
            </Text>
            <Text fw={500} size="sm">
              {formatLastSync(syncStatus.lastSync)}
            </Text>
          </Group>
        )}

        {syncProgress && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={500} size="sm">
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
                  {syncProgress.progress.phase}: {syncProgress.progress.current}
                  /{syncProgress.progress.total}
                </Text>
                {syncProgress.progress.estimatedTimeRemaining && (
                  <Text color="dimmed" size="xs">
                    <Clock
                      size={12}
                      style={{ display: "inline", marginRight: 4 }}
                    />
                    {Math.ceil(
                      syncProgress.progress.estimatedTimeRemaining / 60,
                    )}{" "}
                    min remaining
                  </Text>
                )}
              </Group>
            )}
          </Stack>
        )}

        {syncLibraryMutation.isError && (
          <Alert
            color="red"
            icon={<AlertCircle size={16} />}
            title="Sync Failed"
            variant="light"
          >
            {syncLibraryMutation.error?.message ||
              "An error occurred while syncing"}
          </Alert>
        )}

        {syncProgress?.state === "failed" && syncProgress.error && (
          <Alert
            color="red"
            icon={<AlertCircle size={16} />}
            title="Sync Failed"
            variant="light"
          >
            {syncProgress.error}
          </Alert>
        )}

        {syncProgress?.state === "completed" && syncProgress.result && (
          <Alert
            color="green"
            icon={<CheckCircle size={16} />}
            title="Sync Complete"
            variant="light"
          >
            <Stack gap="xs">
              <Text size="sm">
                Synced {syncProgress.result.totalTracks} tracks and{" "}
                {syncProgress.result.totalAlbums} albums
              </Text>
              {syncProgress.result.newTracks > 0 && (
                <Text size="sm">
                  • {syncProgress.result.newTracks} new tracks added
                </Text>
              )}
              {syncProgress.result.updatedTracks > 0 && (
                <Text size="sm">
                  • {syncProgress.result.updatedTracks} tracks updated
                </Text>
              )}
              {syncProgress.result.newAlbums > 0 && (
                <Text size="sm">
                  • {syncProgress.result.newAlbums} new albums added
                </Text>
              )}
              {syncProgress.result.updatedAlbums > 0 && (
                <Text size="sm">
                  • {syncProgress.result.updatedAlbums} albums updated
                </Text>
              )}
              {syncProgress.result.errors?.length > 0 && (
                <Text color="red" size="sm">
                  • {syncProgress.result.errors.length} errors occurred
                </Text>
              )}
            </Stack>
          </Alert>
        )}

        <Button
          disabled={
            syncProgress?.state === "active" ||
            syncProgress?.state === "waiting"
          }
          fullWidth
          leftSection={<RefreshCw size={16} />}
          loading={
            syncLibraryMutation.isPending || syncProgress?.state === "waiting"
          }
          onClick={() => syncLibraryMutation.mutate()}
        >
          {syncLibraryMutation.isPending
            ? "Starting sync..."
            : syncProgress?.state === "active"
              ? "Syncing..."
              : syncProgress?.state === "waiting"
                ? "Queued..."
                : "Sync Now"}
        </Button>
      </Stack>
    </Card>
  );
}
