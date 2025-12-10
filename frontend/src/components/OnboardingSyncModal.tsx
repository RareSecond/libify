import { Button, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Library } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { SYNC_JOB_STORAGE_KEY } from "@/constants/sync";
import {
  useLibraryControllerGetTracks,
  useLibraryControllerSyncRecentlyPlayed,
} from "@/data/api";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { PartialSyncProgress } from "@/hooks/useSyncProgress";
import { trackEvent } from "@/lib/posthog";

import { OnboardingRatingPrompt } from "./OnboardingRatingPrompt";
import { SyncingView } from "./sync/SyncingView";

type ModalPhase = "initial" | "rating-prompt" | "syncing";

interface OnboardingSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingSyncModal({
  isOpen,
  onClose,
}: OnboardingSyncModalProps) {
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const { play } = useSpotifyPlayer();
  const [phase, setPhase] = useState<ModalPhase>("initial");
  const [progress, setProgress] = useState<PartialSyncProgress>({
    message: "Starting sync...",
    percentage: 0,
  });
  const [jobId, setJobId] = useState<null | string>(null);
  const [syncedTrackCount, setSyncedTrackCount] = useState(50);
  const completionTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(
    null,
  );

  const quickSyncMutation = useLibraryControllerSyncRecentlyPlayed();

  // Fetch unrated tracks for onboarding
  const { refetch: refetchUnratedTracks } = useLibraryControllerGetTracks(
    { pageSize: 3, unratedOnly: true },
    { query: { enabled: false } }, // Only fetch when needed
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase("initial");
      setProgress({ message: "Starting sync...", percentage: 0 });
      setJobId(null);
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

    newSocket.on(
      "completed",
      (data?: { result?: { totalTracks?: number } }) => {
        setProgress({ message: "Sync complete!", percentage: 100 });

        // Clear persisted job on completion
        localStorage.removeItem(SYNC_JOB_STORAGE_KEY);

        // Track the count if available
        if (data?.result?.totalTracks) {
          setSyncedTrackCount(data.result.totalTracks);
        }

        trackEvent("onboarding_sync_completed", {
          trackCount: data?.result?.totalTracks || 50,
        });

        // Clear any existing timeout before creating a new one
        if (completionTimeoutRef.current) {
          clearTimeout(completionTimeoutRef.current);
        }

        // Show rating prompt after a short delay
        completionTimeoutRef.current = setTimeout(() => {
          setJobId(null);
          setPhase("rating-prompt");
          trackEvent("onboarding_rating_prompt_shown");
        }, 1000);
      },
    );

    newSocket.on("failed", (data: { error: string }) => {
      setProgress({ message: `Sync failed: ${data.error}`, percentage: 0 });
      // Clear persisted job on failure
      localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
      setPhase("initial");
      setJobId(null);
    });

    newSocket.on("error", (error: Error) => {
      // Handle socket-level errors (connection failures, timeouts, etc.)
      const errorMessage =
        error?.message || "Connection error. Please try again.";
      setProgress({ message: `Sync error: ${errorMessage}`, percentage: 0 });
      // Clear persisted job on error
      localStorage.removeItem(SYNC_JOB_STORAGE_KEY);
      setPhase("initial");
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

  const storeSyncJob = (id: string) => {
    localStorage.setItem(
      SYNC_JOB_STORAGE_KEY,
      JSON.stringify({ jobId: id, startedAt: Date.now(), type: "quick" }),
    );
  };

  const handleStartSync = async () => {
    setPhase("syncing");
    trackEvent("onboarding_sync_started", { trackCount: 50 });

    try {
      const response = await quickSyncMutation.mutateAsync();
      storeSyncJob(response.jobId);
      setJobId(response.jobId);
    } catch {
      setProgress({
        message: "Failed to start sync. Please try again.",
        percentage: 0,
      });
      setPhase("initial");
    }
  };

  const handleStartRating = async () => {
    trackEvent("onboarding_rating_started");

    try {
      // Fetch unrated tracks
      const result = await refetchUnratedTracks();
      const tracks = result.data?.tracks?.slice(0, 3);

      if (!tracks || tracks.length === 0) {
        notifications.show({
          color: "red",
          message: "No unrated tracks found. Try syncing more tracks first.",
          title: "No tracks available",
        });
        return;
      }

      // Start onboarding with the tracks
      onboarding?.startOnboarding(tracks);

      // Play the first track
      if (tracks[0]?.spotifyId) {
        await play(`spotify:track:${tracks[0].spotifyId}`);
      }

      // Navigate to fullscreen
      onClose();
      navigate({ to: "/fullscreen" });
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to start rating. Please try again.",
        title: "Error",
      });
    }
  };

  const handleSkipRating = () => {
    trackEvent("onboarding_rating_skipped");
    onClose();
    navigate({
      search: { genres: [], showRatingReminder: true },
      to: "/tracks",
    });
  };

  const handleSkipAll = () => {
    onClose();
    navigate({ to: "/" });
  };

  const isSyncing = phase === "syncing";
  const isRatingPrompt = phase === "rating-prompt";

  const getTitle = () => {
    if (isRatingPrompt) return null; // OnboardingRatingPrompt has its own title
    return (
      <Text className="text-xl font-bold text-white">
        Let's get your library set up!
      </Text>
    );
  };

  return (
    <Modal
      centered
      closeOnClickOutside={!isSyncing}
      closeOnEscape={!isSyncing}
      onClose={isSyncing ? () => {} : onClose}
      opened={isOpen}
      size="lg"
      title={getTitle()}
      withCloseButton={!isSyncing && !isRatingPrompt}
    >
      {phase === "initial" && (
        <div className="space-y-4">
          <Text className="text-sm text-gray-400 mb-4">
            We'll sync 50 of your most recent saved tracks so you can start
            exploring. You can always do a full import later.
          </Text>

          {/* Sync card */}
          <div
            className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-500 rounded-lg p-4 bg-dark-6 shadow-sm"
            onClick={handleStartSync}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-900/30 rounded-lg">
                <Library className="text-orange-500" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Text className="text-lg font-semibold text-white">
                    Sync My Library
                  </Text>
                  <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                    Quick
                  </span>
                </div>
                <Text className="text-sm text-gray-400 mb-2">
                  Import your recent saved tracks to get started
                </Text>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock size={16} />
                  <span>~30 seconds</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button onClick={handleSkipAll} size="sm" variant="subtle">
              Skip for now
            </Button>
          </div>
        </div>
      )}

      {phase === "syncing" && <SyncingView progress={progress} />}

      {phase === "rating-prompt" && (
        <OnboardingRatingPrompt
          onSkip={handleSkipRating}
          onStartRating={handleStartRating}
          trackCount={syncedTrackCount}
        />
      )}
    </Modal>
  );
}
