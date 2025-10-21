import { useCallback, useEffect, useState } from "react";

export interface SyncJobStatus {
  error?: string;
  jobId: string;
  progress?: SyncProgress;
  result?: SyncResult;
  state: "active" | "completed" | "failed" | "waiting";
}

export interface SyncProgress {
  current: number;
  errors: string[];
  estimatedTimeRemaining?: number;
  itemsPerSecond?: number;
  message: string;
  percentage: number;
  phase: "albums" | "playlists" | "tracks";
  total: number;
}

export interface SyncResult {
  errors: string[];
  newAlbums: number;
  newTracks: number;
  playlistTracks?: number;
  totalAlbums: number;
  totalPlaylists?: number;
  totalTracks: number;
  updatedAlbums: number;
  updatedTracks: number;
}

export function useSyncProgress(jobId: null | string) {
  const [status, setStatus] = useState<null | SyncJobStatus>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setIsConnected(false);
      return;
    }

    // Create EventSource for SSE
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/library/sync/${jobId}/progress`,
      { withCredentials: true },
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setStatus({ error: data.error, jobId, state: "failed" });
          eventSource.close();
          return;
        }

        setStatus({
          error: data.error,
          jobId: data.jobId,
          progress: data.progress,
          result: data.result,
          state: data.state,
        });

        // Close connection when job is done
        if (data.state === "completed" || data.state === "failed") {
          eventSource.close();
        }
      } catch {
        // Failed to parse SSE data
      }
    };

    eventSource.onerror = () => {
      // SSE connection error
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [jobId]);

  const reset = useCallback(() => {
    setStatus(null);
    setIsConnected(false);
  }, []);

  return { isConnected, reset, status };
}
