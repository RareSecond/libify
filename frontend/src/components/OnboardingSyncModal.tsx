import { Button, Modal, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { SYNC_JOB_STORAGE_KEY } from "@/constants/sync";
import {
  useLibraryControllerSyncLibrary,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";
import { PartialSyncProgress } from "@/hooks/useSyncProgress";

import { SyncingView } from "./sync/SyncingView";
import { FullSyncCard, QuickSyncCard } from "./sync/SyncOptionCard";

interface OnboardingSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingSyncModal({
  isOpen,
  onClose,
}: OnboardingSyncModalProps) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<"full" | "quick" | null>(
    null,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<PartialSyncProgress>({
    message: "Starting sync...",
    percentage: 0,
  });
  const [jobId, setJobId] = useState<null | string>(null);
  const completionTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(
    null,
  );

  const quickSyncMutation = useLibraryControllerSyncRecentlyPlayed();
  const fullSyncMutation = useLibraryControllerSyncLibrary();

  // Initialize onboarding state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset onboarding state to ensure fresh start
      // This modal only shows for users who haven't completed onboarding
      localStorage.removeItem("spotlib-onboarding-completed");
      localStorage.setItem("spotlib-current-tooltip", "sort");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!jobId) return;

    // Connect to WebSocket
    const newSocket = io(`${import.meta.env.VITE_API_URL}/sync`, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      newSocket.emit("subscribe", { jobId });
    });

    newSocket.on("progress", (data: { progress: PartialSyncProgress }) => {
      setProgress(data.progress);
    });

    newSocket.on("completed", () => {
      setProgress({
        message: "Sync complete! Redirecting...",
        percentage: 100,
      });

      // Clear persisted job on completion
      localStorage.removeItem(SYNC_JOB_STORAGE_KEY);

      // Clear any existing timeout before creating a new one
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      completionTimeoutRef.current = setTimeout(() => {
        setIsSyncing(false);
        setSelectedOption(null);
        setJobId(null);
        onClose();
        navigate({ search: { genres: [] }, to: "/tracks" });
      }, 1500);
    });

    newSocket.on("failed", (data: { error: string }) => {
      setProgress({ message: `Sync failed: ${data.error}`, percentage: 0 });
      // Clear persisted job on failure
      localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
      setIsSyncing(false);
      setSelectedOption(null);
      setJobId(null);
    });

    newSocket.on("error", (error: Error) => {
      // Handle socket-level errors (connection failures, timeouts, etc.)
      const errorMessage =
        error?.message || "Connection error. Please try again.";
      setProgress({ message: `Sync error: ${errorMessage}`, percentage: 0 });
      // Clear persisted job on error
      localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
      setIsSyncing(false);
      setSelectedOption(null);
      setJobId(null);
    });

    return () => {
      // Clean up timeout if component unmounts or jobId changes
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      newSocket.emit("unsubscribe", { jobId });
      newSocket.disconnect();
    };
  }, [jobId, onClose, navigate]);

  const storeSyncJob = (id: string, type: "full" | "quick") => {
    localStorage.setItem(
      SYNC_JOB_STORAGE_KEY,
      JSON.stringify({ jobId: id, startedAt: Date.now(), type }),
    );
  };

  const handleQuickSync = async () => {
    setSelectedOption("quick");
    setIsSyncing(true);

    try {
      const response = await quickSyncMutation.mutateAsync();
      storeSyncJob(response.jobId, "quick");
      setJobId(response.jobId);
    } catch {
      setProgress({
        message: "Failed to start sync. Please try again.",
        percentage: 0,
      });
      setIsSyncing(false);
      setSelectedOption(null);
    }
  };

  const handleFullSync = async () => {
    setSelectedOption("full");
    setIsSyncing(true);

    try {
      const response = await fullSyncMutation.mutateAsync({ data: {} });
      storeSyncJob(response.jobId, "full");
      setJobId(response.jobId);
    } catch {
      setProgress({
        message: "Failed to start sync. Please try again.",
        percentage: 0,
      });
      setIsSyncing(false);
      setSelectedOption(null);
    }
  };

  const handleSkip = () => {
    onClose();
    navigate({ search: { genres: [] }, to: "/tracks" });
  };

  return (
    <Modal
      centered
      closeOnClickOutside={!isSyncing}
      closeOnEscape={!isSyncing}
      onClose={isSyncing ? () => {} : onClose}
      opened={isOpen}
      size="lg"
      title={
        <Text className="text-xl font-bold">
          Let's get your library set up!
        </Text>
      }
      withCloseButton={!isSyncing}
    >
      {!isSyncing && !selectedOption ? (
        <div className="space-y-4">
          <Text className="text-sm text-gray-600 mb-4">
            Choose how you'd like to sync your Spotify library:
          </Text>
          <QuickSyncCard onClick={handleQuickSync} />
          <FullSyncCard onClick={handleFullSync} />
          <div className="flex justify-center pt-2">
            <Button onClick={handleSkip} size="sm" variant="subtle">
              Skip for now
            </Button>
          </div>
        </div>
      ) : (
        <SyncingView progress={progress} />
      )}
    </Modal>
  );
}
