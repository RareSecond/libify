import { useEffect, useState } from "react";

import {
  useLibraryControllerSyncLibrary,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";
import { usePersistentSyncJob } from "@/hooks/usePersistentSyncJob";
import { useSyncProgress } from "@/hooks/useSyncProgress";

import { SyncErrorView } from "./sync/SyncErrorView";
import { SyncIdleBar } from "./sync/SyncIdleBar";
import { SyncProgressView } from "./sync/SyncProgressView";
import { SyncResultView } from "./sync/SyncResultView";

interface SyncStatusBarProps {
  lastSyncedAt?: Date;
  onSyncComplete?: () => void;
  totalAlbums?: number;
  totalTracks?: number;
}

export function SyncStatusBar({
  lastSyncedAt,
  onSyncComplete,
  totalAlbums = 0,
  totalTracks = 0,
}: SyncStatusBarProps) {
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
  const isStarting =
    syncLibraryMutation.isPending || syncRecentMutation.isPending;

  if (isSyncing && syncProgress) {
    return <SyncProgressView progress={syncProgress.progress} />;
  }

  if (isCompleted && syncProgress?.result) {
    return (
      <SyncResultView
        onDismiss={handleStartNewSync}
        result={syncProgress.result}
      />
    );
  }

  if (isFailed) {
    return (
      <SyncErrorView error={syncProgress?.error} onRetry={handleStartNewSync} />
    );
  }

  return (
    <SyncIdleBar
      isInitialized={isInitialized}
      isStarting={isStarting}
      lastSyncedAt={lastSyncedAt}
      onFullSync={() => syncLibraryMutation.mutate({ data: syncOptions })}
      onQuickSync={() => syncRecentMutation.mutate()}
      onSyncOptionsChange={setSyncOptions}
      syncOptions={syncOptions}
      totalAlbums={totalAlbums}
      totalTracks={totalTracks}
    />
  );
}
