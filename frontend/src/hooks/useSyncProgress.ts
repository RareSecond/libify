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
      console.log("WebSocket connected");
      setIsConnected(true);
      // Subscribe to this job's updates
      socket.emit("subscribe", { jobId });
      console.log("Subscribed to job:", jobId);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("status", (data: SyncJobStatus) => {
      console.log("Received status:", data);
      setStatus(data);
    });

    socket.on("progress", (data: SyncJobStatus) => {
      console.log("Received progress:", data);
      setStatus(data);
    });

    socket.on("completed", (data: SyncJobStatus) => {
      console.log("Received completed:", data);
      setStatus(data);
      // Unsubscribe and disconnect after completion
      socket.emit("unsubscribe", { jobId });
      socket.disconnect();
    });

    socket.on("failed", (data: SyncJobStatus) => {
      console.log("Received failed:", data);
      setStatus(data);
      // Unsubscribe and disconnect after failure
      socket.emit("unsubscribe", { jobId });
      socket.disconnect();
    });

    socket.on("error", (error: { message: string }) => {
      console.error("WebSocket error:", error);
      setStatus({
        error: error.message,
        jobId,
        state: "failed",
      });
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
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
