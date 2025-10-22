import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

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

    socket.on("status", (data: SyncJobStatus) => {
      setStatus(data);
    });

    socket.on("progress", (data: SyncJobStatus) => {
      setStatus(data);
    });

    socket.on("completed", (data: SyncJobStatus) => {
      setStatus(data);
      // Unsubscribe and disconnect after completion
      socket.emit("unsubscribe", { jobId });
      socket.disconnect();
    });

    socket.on("failed", (data: SyncJobStatus) => {
      setStatus(data);
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
