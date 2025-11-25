import { Alert, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { AlertCircle, Music, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useLibraryControllerSyncLibrary,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";

import { usePersistentSyncJob } from "../hooks/usePersistentSyncJob";
import { useSyncProgress } from "../hooks/useSyncProgress";
import { formatLastSync } from "../utils/format";
import { SyncOptionsAccordion } from "./sync/SyncOptionsAccordion";
import { SyncProgress } from "./sync/SyncProgress";
import { SyncResultAlert } from "./sync/SyncResultAlert";

interface LibrarySyncProps {
  lastSyncedAt?: Date;
  onSyncComplete?: () => void;
  totalAlbums?: number;
  totalTracks?: number;
}

export function LibrarySync({
  lastSyncedAt,
  onSyncComplete,
  totalAlbums = 0,
  totalTracks = 0,
}: LibrarySyncProps) {
  const { clearSyncJob, currentJobId, isInitialized, startSyncJob } =
    usePersistentSyncJob();
  const { reset: resetProgress, status: syncProgress } =
    useSyncProgress(currentJobId);

  // Sync options state
  const [syncOptions, setSyncOptions] = useState({
    forceRefreshPlaylists: false,
    syncAlbums: true,
    syncLikedTracks: true,
    syncPlaylists: true,
  });

  // Mutation for starting full sync
  const syncLibraryMutation = useLibraryControllerSyncLibrary({
    mutation: {
      onError: () => {
        clearSyncJob();
        resetProgress();
      },
      onSuccess: (data) => {
        startSyncJob(data.jobId, "full");
      },
    },
  });

  // Mutation for quick sync (recently played tracks only)
  const syncRecentMutation = useLibraryControllerSyncRecentlyPlayed({
    mutation: {
      onError: () => {
        clearSyncJob();
        resetProgress();
      },
      onSuccess: (data) => {
        startSyncJob(data.jobId, "quick");
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
      // Clear the persisted job immediately when completed/failed
      clearSyncJob();

      refetchTimeout = setTimeout(() => {
        onSyncComplete?.();
        if (syncProgress.state === "completed") {
          resetTimeout = setTimeout(() => {
            resetProgress();
          }, 3000);
        }
      }, 1000);
    }

    return () => {
      clearTimeout(refetchTimeout);
      clearTimeout(resetTimeout);
    };
  }, [syncProgress?.state, onSyncComplete, resetProgress, clearSyncJob]);

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group align="flex-start" justify="space-between">
          <div>
            <Text className="font-medium text-dark-0" size="lg">
              Library Sync
            </Text>
            <Text className="text-dark-1" size="sm">
              Keep your Spotify library in sync
            </Text>
          </div>
          <Group gap="xs" wrap="nowrap">
            <Badge
              color="orange"
              leftSection={<Music size={14} />}
              size="lg"
              variant="light"
            >
              {totalTracks.toLocaleString()} tracks
            </Badge>
            <Badge
              color="orange"
              leftSection={<Music size={14} />}
              size="lg"
              variant="light"
            >
              {totalAlbums.toLocaleString()} albums
            </Badge>
          </Group>
        </Group>

        <Group gap="xs">
          <Text color="dimmed" size="sm">
            Last synced:
          </Text>
          <Text className="font-medium" size="sm">
            {formatLastSync(lastSyncedAt?.toISOString() || null)}
          </Text>
        </Group>

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
          <SyncResultAlert result={syncProgress.result} />
        )}

        <Group grow>
          <Button
            color="orange"
            disabled={
              !isInitialized ||
              syncProgress?.state === "active" ||
              syncProgress?.state === "waiting" ||
              syncLibraryMutation.isPending ||
              syncRecentMutation.isPending
            }
            gradient={{ deg: 135, from: "orange.6", to: "orange.8" }}
            leftSection={<RefreshCw size={16} />}
            loading={syncLibraryMutation.isPending || !isInitialized}
            onClick={() => syncLibraryMutation.mutate({ data: syncOptions })}
            variant="gradient"
          >
            {syncLibraryMutation.isPending ? "Starting..." : "Full Sync"}
          </Button>
          {import.meta.env.DEV && (
            <Button
              color="orange"
              disabled={
                !isInitialized ||
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
