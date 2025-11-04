import { Alert, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { AlertCircle, CheckCircle, Music, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useLibraryControllerGetSyncLibraryStatus,
  useLibraryControllerSyncLibrary,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";

import { useSyncProgress } from "../hooks/useSyncProgress";
import { formatLastSync } from "../utils/format";
import { SyncOptionsAccordion } from "./sync/SyncOptionsAccordion";
import { SyncProgress } from "./sync/SyncProgress";

export function LibrarySync() {
  const [currentJobId, setCurrentJobId] = useState<null | string>(null);
  const { reset: resetProgress, status: syncProgress } =
    useSyncProgress(currentJobId);

  // Sync options state
  const [syncOptions, setSyncOptions] = useState({
    forceRefreshPlaylists: false,
    syncAlbums: true,
    syncLikedTracks: true,
    syncPlaylists: true,
  });

  // Query for sync status
  const { data: syncStatus, refetch: refetchStatus } =
    useLibraryControllerGetSyncLibraryStatus();

  // Mutation for starting full sync
  const syncLibraryMutation = useLibraryControllerSyncLibrary({
    mutation: {
      onError: () => {
        setCurrentJobId(null);
        resetProgress();
      },
      onSuccess: (data) => {
        setCurrentJobId(data.jobId);
      },
    },
  });

  // Mutation for quick sync (recently played tracks only)
  const syncRecentMutation = useLibraryControllerSyncRecentlyPlayed({
    mutation: {
      onError: () => {
        setCurrentJobId(null);
        resetProgress();
      },
      onSuccess: (data) => {
        setCurrentJobId(data.jobId);
      },
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
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group align="center" justify="space-between">
          <div>
            <Text className="font-medium text-dark-0" size="lg">
              Library Sync
            </Text>
            <Text className="text-dark-1" size="sm">
              Keep your Spotify library in sync
            </Text>
          </div>
          <div className="flex gap-2">
            <Badge
              color="orange"
              leftSection={<Music size={14} />}
              size="lg"
              variant="light"
            >
              {syncStatus?.totalTracks || 0} tracks
            </Badge>
            <Badge
              color="orange"
              leftSection={<Music size={14} />}
              size="lg"
              variant="dot"
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
          playlists)
          {import.meta.env.DEV &&
            " • Quick Sync: Sync recently played tracks only (fast, shows progress)"}
        </Text>

        <SyncOptionsAccordion onChange={setSyncOptions} options={syncOptions} />

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
            color="orange"
            disabled={
              syncProgress?.state === "active" ||
              syncProgress?.state === "waiting" ||
              syncLibraryMutation.isPending ||
              syncRecentMutation.isPending
            }
            gradient={{ deg: 135, from: "orange.6", to: "orange.8" }}
            leftSection={<RefreshCw size={16} />}
            loading={syncLibraryMutation.isPending}
            onClick={() => syncLibraryMutation.mutate({ data: syncOptions })}
            variant="gradient"
          >
            {syncLibraryMutation.isPending ? "Starting..." : "Full Sync"}
          </Button>
          {import.meta.env.DEV && (
            <Button
              color="orange"
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
          )}
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
