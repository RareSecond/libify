import { Card } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

import {
  useLibraryControllerSyncLibrary,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";
import {
  trackSyncCompleted,
  trackSyncFailed,
  trackSyncStarted,
} from "@/lib/posthog";

import { usePersistentSyncJob } from "../hooks/usePersistentSyncJob";
import { useSyncProgress } from "../hooks/useSyncProgress";
import { SyncActiveView } from "./sync/SyncActiveView";
import { SyncCompleteView } from "./sync/SyncCompleteView";
import { SyncFailedView } from "./sync/SyncFailedView";
import { SyncIdleView } from "./sync/SyncIdleView";

interface LibrarySyncProps {
  isFirstSync?: boolean;
  lastSyncedAt?: Date;
  onSyncComplete?: () => void;
  totalAlbums?: number;
  totalTracks?: number;
}

export function LibrarySync({
  isFirstSync = false,
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

  const syncStartTimeRef = useRef<null | number>(null);
  const hasTrackedCompletionRef = useRef<null | string>(null);

  const syncLibraryMutation = useLibraryControllerSyncLibrary({
    mutation: {
      onError: () => {
        resetSyncJob();
        resetProgress();
      },
      onSuccess: (data) => {
        trackSyncStarted({ albums: totalAlbums, tracks: totalTracks });
        syncStartTimeRef.current = Date.now();
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
        trackSyncStarted();
        syncStartTimeRef.current = Date.now();
        startSyncJob(data.jobId, "quick");
      },
    },
  });

  useEffect(() => {
    if (syncProgress?.state === "completed" && syncProgress.result) {
      // Track completion only once per job
      if (hasTrackedCompletionRef.current !== currentJobId) {
        const duration = syncStartTimeRef.current
          ? Math.round((Date.now() - syncStartTimeRef.current) / 1000)
          : 0;
        trackSyncCompleted(duration, {
          albums: syncProgress.result.totalAlbums || 0,
          artists: 0, // Not tracked in sync result
          tracks: syncProgress.result.totalTracks || 0,
        });
        hasTrackedCompletionRef.current = currentJobId;
      }
      clearPersistedJob();
      onSyncComplete?.();
    } else if (syncProgress?.state === "failed") {
      if (hasTrackedCompletionRef.current !== currentJobId) {
        trackSyncFailed(syncProgress.error || "Unknown error");
        hasTrackedCompletionRef.current = currentJobId;
      }
      clearPersistedJob();
      onSyncComplete?.();
    }
  }, [
    syncProgress?.state,
    syncProgress?.result,
    syncProgress?.error,
    currentJobId,
    onSyncComplete,
    clearPersistedJob,
  ]);

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
      className={
        isFirstSync
          ? "bg-gradient-to-br from-dark-6 to-dark-8 border-orange-7"
          : "bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      }
      padding="lg"
      radius="md"
      shadow={isFirstSync ? "lg" : "md"}
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
          isFirstSync={isFirstSync}
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
