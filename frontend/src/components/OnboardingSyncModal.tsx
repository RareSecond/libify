import { Button, Card, Modal, Progress, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Library, Music, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import {
  useLibraryControllerSyncLibrary,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";

interface OnboardingSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SyncProgress {
  current?: number;
  message?: string;
  percentage?: number;
  phase?: string;
  total?: number;
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
  const [progress, setProgress] = useState<SyncProgress>({
    message: "Starting sync...",
    percentage: 0,
  });
  const [jobId, setJobId] = useState<null | string>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    newSocket.on("progress", (data: { progress: SyncProgress }) => {
      setProgress(data.progress);
    });

    newSocket.on("completed", () => {
      setProgress({
        message: "Sync complete! Redirecting...",
        percentage: 100,
      });

      // Clear any existing timeout before creating a new one
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      completionTimeoutRef.current = setTimeout(() => {
        setIsSyncing(false);
        onClose();
        navigate({ search: { genres: [] }, to: "/tracks" });
      }, 1500);
    });

    newSocket.on("failed", (data: { error: string }) => {
      setProgress({ message: `Sync failed: ${data.error}`, percentage: 0 });
      setIsSyncing(false);
    });

    newSocket.on("error", () => {
      // Error handled by failed event
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

  const handleQuickSync = async () => {
    setSelectedOption("quick");
    setIsSyncing(true);

    try {
      const response = await quickSyncMutation.mutateAsync();
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

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-500"
            onClick={handleQuickSync}
            padding="lg"
            radius="md"
            shadow="sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="text-orange-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Text className="text-lg font-semibold">Quick Sync</Text>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
                <Text className="text-sm text-gray-600 mb-2">
                  Sync 50 tracks and 10 albums to try features instantly
                </Text>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>~30 seconds</span>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-500"
            onClick={handleFullSync}
            padding="lg"
            radius="md"
            shadow="sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Library className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <Text className="text-lg font-semibold mb-2">Full Sync</Text>
                <Text className="text-sm text-gray-600 mb-2">
                  Sync your entire Spotify library (all tracks, albums, and
                  playlists)
                </Text>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>~2-5 minutes</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-center pt-2">
            <Button onClick={handleSkip} size="sm" variant="subtle">
              Skip for now
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-orange-100 rounded-full">
              <Music className="text-orange-600 animate-pulse" size={48} />
            </div>
          </div>

          <div className="space-y-2">
            <Text className="text-sm font-medium text-center">
              {progress.message || "Syncing your library..."}
            </Text>
            {progress.current != null &&
              progress.total != null &&
              progress.total > 0 && (
                <Text className="text-xs text-gray-600 text-center">
                  {progress.current} / {progress.total} items
                </Text>
              )}
          </div>

          <Progress
            animated
            className="w-full"
            color="orange"
            radius="xl"
            size="lg"
            striped
            value={progress.percentage || 0}
          />

          {progress.phase && progress.phase !== "0" && (
            <Text className="text-xs text-gray-600 text-center">
              Phase: {progress.phase}
            </Text>
          )}
        </div>
      )}
    </Modal>
  );
}
