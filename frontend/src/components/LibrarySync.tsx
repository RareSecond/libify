/* eslint-disable max-lines */
import { Alert, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Music, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { useSyncProgress } from "../hooks/useSyncProgress";
import { formatLastSync } from "../utils/format";
import { SyncProgress } from "./sync/SyncProgress";

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
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("Failed to fetch sync status");
      return response.json();
    },
    queryKey: ["library-sync-status"],
  });

  // Mutation for starting full sync
  const syncLibraryMutation = useMutation<SyncJobResponse>({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/library/sync`,
        { credentials: "include", method: "POST" },
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

  // Mutation for quick sync (recently played tracks only)
  const syncRecentMutation = useMutation<SyncJobResponse>({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/library/sync/recent`,
        { credentials: "include", method: "POST" },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start quick sync");
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

  return (
    <Card padding="lg" radius="md" shadow="sm" withBorder>
      <Stack gap="md">
        <Group align="center" justify="space-between">
          <div>
            <Text className="font-medium" size="lg">
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
            <Text className="font-medium" size="sm">
              {formatLastSync(syncStatus.lastSync)}
            </Text>
          </Group>
        )}

        {syncProgress && <SyncProgress syncProgress={syncProgress} />}

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

        {syncRecentMutation.isError && (
          <Alert
            color="red"
            icon={<AlertCircle size={16} />}
            title="Quick Sync Failed"
            variant="light"
          >
            {syncRecentMutation.error?.message ||
              "An error occurred while syncing recently played tracks"}
          </Alert>
        )}

        <Text color="dimmed" size="xs">
          <strong>Full Sync:</strong> Sync entire library (tracks, albums,
          playlists) • <strong>Quick Sync:</strong> Sync recently played tracks
          only (fast, shows progress)
        </Text>

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

        <Group grow>
          <Button
            disabled={
              syncProgress?.state === "active" ||
              syncProgress?.state === "waiting" ||
              syncLibraryMutation.isPending ||
              syncRecentMutation.isPending
            }
            leftSection={<RefreshCw size={16} />}
            loading={syncLibraryMutation.isPending}
            onClick={() => syncLibraryMutation.mutate()}
          >
            {syncLibraryMutation.isPending ? "Starting..." : "Full Sync"}
          </Button>
          <Button
            color="cyan"
            disabled={
              syncProgress?.state === "active" ||
              syncProgress?.state === "waiting" ||
              syncLibraryMutation.isPending ||
              syncRecentMutation.isPending
            }
            leftSection={<RefreshCw size={16} />}
            loading={syncRecentMutation.isPending}
            onClick={() => syncRecentMutation.mutate()}
            variant="light"
          >
            {syncRecentMutation.isPending ? "Starting..." : "Quick Sync"}
          </Button>
        </Group>

        {(syncProgress?.state === "active" ||
          syncProgress?.state === "waiting") && (
          <Text className="text-center" color="dimmed" size="xs">
            {syncProgress.state === "waiting"
              ? "Sync queued..."
              : "Syncing in progress..."}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
