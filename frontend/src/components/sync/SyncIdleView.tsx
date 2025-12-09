import { Alert, Badge, Button, Group, Stack, Text } from "@mantine/core";
import { AlertCircle, Music, RefreshCw } from "lucide-react";

import { formatLastSync } from "@/utils/format";

import { SyncOptionsAccordion } from "./SyncOptionsAccordion";

interface SyncIdleViewProps {
  isFirstSync?: boolean;
  isInitialized: boolean;
  lastSyncedAt?: Date;
  onStartFullSync: () => void;
  onStartQuickSync: () => void;
  onSyncOptionsChange: (options: {
    forceRefreshPlaylists: boolean;
    syncAlbums: boolean;
    syncLikedTracks: boolean;
    syncPlaylists: boolean;
  }) => void;
  syncLibraryMutation: {
    error?: Error | null;
    isError: boolean;
    isPending: boolean;
  };
  syncOptions: {
    forceRefreshPlaylists: boolean;
    syncAlbums: boolean;
    syncLikedTracks: boolean;
    syncPlaylists: boolean;
  };
  syncRecentMutation: {
    error?: Error | null;
    isError: boolean;
    isPending: boolean;
  };
  totalAlbums: number;
  totalTracks: number;
}

export function SyncIdleView({
  isFirstSync = false,
  isInitialized,
  lastSyncedAt,
  onStartFullSync,
  onStartQuickSync,
  onSyncOptionsChange,
  syncLibraryMutation,
  syncOptions,
  syncRecentMutation,
  totalAlbums,
  totalTracks,
}: SyncIdleViewProps) {
  return (
    <Stack gap="md">
      <Group align="flex-start" justify="space-between">
        <div>
          <Text className="font-medium text-dark-0" size="lg">
            {isFirstSync ? "Sync Your Library" : "Library Sync"}
          </Text>
          <Text className="text-dark-1" size="sm">
            {isFirstSync
              ? "Import your Spotify library to explore, rate tracks, and get personalized insights"
              : "Keep your Spotify library in sync"}
          </Text>
        </div>
        {!isFirstSync && (
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
        )}
      </Group>

      {!isFirstSync && (
        <Group gap="xs">
          <Text color="dimmed" size="sm">
            Last synced:
          </Text>
          <Text className="font-medium" size="sm">
            {formatLastSync(lastSyncedAt?.toISOString() || null)}
          </Text>
        </Group>
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

      {!isFirstSync && (
        <Text color="dimmed" size="xs">
          <strong>Full Sync:</strong> Sync entire library (tracks, albums,
          playlists)
          {import.meta.env.DEV &&
            " • Quick Sync: Sync recently played tracks only (fast, shows progress)"}
        </Text>
      )}

      <SyncOptionsAccordion
        onChange={onSyncOptionsChange}
        options={syncOptions}
      />

      <Group grow>
        <Button
          color="orange"
          disabled={
            !isInitialized ||
            syncLibraryMutation.isPending ||
            syncRecentMutation.isPending
          }
          gradient={{ deg: 135, from: "orange.6", to: "orange.8" }}
          leftSection={<RefreshCw size={16} />}
          loading={syncLibraryMutation.isPending || !isInitialized}
          onClick={onStartFullSync}
          variant="gradient"
        >
          {syncLibraryMutation.isPending
            ? "Starting..."
            : isFirstSync
              ? "Start Sync"
              : "Full Sync"}
        </Button>
        {!isFirstSync && import.meta.env.DEV && (
          <Button
            color="orange"
            disabled={
              !isInitialized ||
              syncLibraryMutation.isPending ||
              syncRecentMutation.isPending
            }
            leftSection={<RefreshCw size={16} />}
            loading={syncRecentMutation.isPending}
            onClick={onStartQuickSync}
            variant="light"
          >
            {syncRecentMutation.isPending ? "Starting..." : "Quick Sync"}
          </Button>
        )}
      </Group>
    </Stack>
  );
}
