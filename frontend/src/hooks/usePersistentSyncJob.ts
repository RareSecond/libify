import { useCallback, useEffect, useState } from "react";

import { SYNC_JOB_STORAGE_KEY } from "@/constants/sync";
import { libraryControllerGetSyncStatusByJobId } from "@/data/api";

interface StoredSyncJob {
  jobId: string;
  startedAt: number;
  type: "full" | "quick";
}

/**
 * Hook to persist sync job ID in localStorage and reconnect on page reload.
 * Clears the stored job when it completes or fails.
 */
export function usePersistentSyncJob() {
  const [currentJobId, setCurrentJobId] = useState<null | string>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // On mount, check localStorage for an active sync job
  useEffect(() => {
    const checkStoredJob = async () => {
      const stored = localStorage.getItem(SYNC_JOB_STORAGE_KEY);
      if (!stored) {
        setIsInitialized(true);
        return;
      }

      try {
        const storedJob: StoredSyncJob = JSON.parse(stored);

        // Check if the job is still active by fetching its status
        const status = await libraryControllerGetSyncStatusByJobId(
          storedJob.jobId,
        );

        // Job states from backend: 'queued' | 'active' | 'completed' | 'failed'
        if (status.status === "queued" || status.status === "active") {
          // Job is still running, reconnect
          setCurrentJobId(storedJob.jobId);
        } else {
          // Job completed or failed, clear storage
          localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
        }
      } catch {
        // Job not found or error - clear storage
        localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
      }

      setIsInitialized(true);
    };

    checkStoredJob();
  }, []);

  // Store job ID when starting a new sync
  const startSyncJob = useCallback(
    (jobId: string, type: "full" | "quick" = "full") => {
      const storedJob: StoredSyncJob = { jobId, startedAt: Date.now(), type };
      localStorage.setItem(SYNC_JOB_STORAGE_KEY, JSON.stringify(storedJob));
      setCurrentJobId(jobId);
    },
    [],
  );

  // Clear only localStorage (keeps job ID in state so results remain visible)
  const clearPersistedJob = useCallback(() => {
    localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
  }, []);

  // Fully reset - clears both localStorage and state
  const resetSyncJob = useCallback(() => {
    localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
    setCurrentJobId(null);
  }, []);

  return {
    clearPersistedJob,
    currentJobId,
    isInitialized,
    resetSyncJob,
    startSyncJob,
  };
}
