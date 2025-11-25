import { Card } from "@mantine/core";
import { useEffect, useState } from "react";

import {
  useLibraryControllerSyncLibrary,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";

import { usePersistentSyncJob } from "../hooks/usePersistentSyncJob";
import { useSyncProgress } from "../hooks/useSyncProgress";
import { SyncActiveView } from "./sync/SyncActiveView";
import { SyncCompleteView } from "./sync/SyncCompleteView";
import { SyncFailedView } from "./sync/SyncFailedView";
import { SyncIdleView } from "./sync/SyncIdleView";

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
  const {
    clearPersistedJob,
    currentJobId,
    isInitialized,
    resetSyncJob,
    startSyncJob,
  } = usePersistentSyncJob();
  const { reset: resetProgress, status: syncProgress } =
    useSyncProgress(currentJobId);

  const [syncOptions, setSyncOptions] = useState({
    forceRefreshPlaylists: false,
    syncAlbums: true,
    syncLikedTracks: true,
    syncPlaylists: true,
  });

  const syncLibraryMutation = useLibraryControllerSyncLibrary({
    mutation: {
      onError: () => {
        resetSyncJob();
        resetProgress();
      },
      onSuccess: (data) => {
        startSyncJob(data.jobId, "full");
      },
    },
  });

  const syncRecentMutation = useLibraryControllerSyncRecentlyPlayed({
    mutation: {
      onError: () => {
        resetSyncJob();
        resetProgress();
      },
      onSuccess: (data) => {
        startSyncJob(data.jobId, "quick");
      },
    },
  });

  useEffect(() => {
    if (
      syncProgress?.state === "completed" ||
      syncProgress?.state === "failed"
    ) {
      clearPersistedJob();
      onSyncComplete?.();
    }
  }, [syncProgress?.state, onSyncComplete, clearPersistedJob]);

  const handleStartNewSync = () => {
    resetSyncJob();
    resetProgress();
  };

  const isSyncing =
    syncProgress?.state === "active" || syncProgress?.state === "waiting";
  const isCompleted = syncProgress?.state === "completed";
  const isFailed = syncProgress?.state === "failed";

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      {isCompleted && syncProgress.result ? (
        <SyncCompleteView
          onStartNewSync={handleStartNewSync}
          syncProgress={syncProgress}
        />
      ) : isFailed ? (
        <SyncFailedView
          error={syncProgress?.error}
          onStartNewSync={handleStartNewSync}
        />
      ) : isSyncing ? (
        <SyncActiveView syncProgress={syncProgress} />
      ) : (
        <SyncIdleView
          isInitialized={isInitialized}
          lastSyncedAt={lastSyncedAt}
          onStartFullSync={() =>
            syncLibraryMutation.mutate({ data: syncOptions })
          }
          onStartQuickSync={() => syncRecentMutation.mutate()}
          onSyncOptionsChange={setSyncOptions}
          syncLibraryMutation={syncLibraryMutation}
          syncOptions={syncOptions}
          syncRecentMutation={syncRecentMutation}
          totalAlbums={totalAlbums}
          totalTracks={totalTracks}
        />
      )}
    </Card>
  );
}
