import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

/** Partial sync progress for simplified progress displays (e.g., onboarding modal) */
export interface PartialSyncProgress {
  current?: number;
  message?: string;
  percentage?: number;
  phase?: string;
  total?: number;
}

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

// Backend response type (uses "queued" instead of "waiting")
interface BackendSyncJobStatus {
  error?: string;
  jobId: string;
  progress?: SyncProgress;
  result?: SyncResult;
  state: "active" | "completed" | "failed" | "queued";
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

    // Create WebSocket connection
    const socket: Socket = io(`${import.meta.env.VITE_API_URL}/sync`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      // Subscribe to this job's updates
      socket.emit("subscribe", { jobId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("status", (data: BackendSyncJobStatus) => {
      setStatus(normalizeStatus(data));
    });

    socket.on("progress", (data: BackendSyncJobStatus) => {
      setStatus(normalizeStatus(data));
    });

    socket.on("completed", (data: BackendSyncJobStatus) => {
      setStatus(normalizeStatus(data));
      // Unsubscribe and disconnect after completion
      socket.emit("unsubscribe", { jobId });
      socket.disconnect();
    });

    socket.on("failed", (data: BackendSyncJobStatus) => {
      setStatus(normalizeStatus(data));
      // Unsubscribe and disconnect after failure
      socket.emit("unsubscribe", { jobId });
      socket.disconnect();
    });

    socket.on("error", (error: { message: string }) => {
      setStatus({ error: error.message, jobId, state: "failed" });
    });

    socket.on("connect_error", () => {
      // WebSocket connection failed - silently handle
    });

    // Cleanup
    return () => {
      socket.emit("unsubscribe", { jobId });
      socket.disconnect();
      setIsConnected(false);
    };
  }, [jobId]);

  const reset = useCallback(() => {
    setStatus(null);
    setIsConnected(false);
  }, []);

  return { isConnected, reset, status };
}

/**
 * Normalize backend status values to frontend union
 * Backend sends "queued", frontend expects "waiting"
 */
function normalizeStatus(backendStatus: BackendSyncJobStatus): SyncJobStatus {
  return {
    ...backendStatus,
    state: backendStatus.state === "queued" ? "waiting" : backendStatus.state,
  };
}
