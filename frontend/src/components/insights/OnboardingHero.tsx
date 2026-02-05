import { Button, Paper, Progress, Stack, Text, Title } from "@mantine/core";
import { Library, Loader2, Music, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { useLibraryControllerSyncLibrary } from "@/data/api";
import { usePersistentSyncJob } from "@/hooks/usePersistentSyncJob";
import { useSyncProgress } from "@/hooks/useSyncProgress";

const ONBOARDING_SYNC_KEY = "onboarding-sync-triggered";

interface OnboardingHeroProps {
  onComplete: () => void;
}

export function OnboardingHero({ onComplete }: OnboardingHeroProps) {
  const syncMutation = useLibraryControllerSyncLibrary();
  const { currentJobId, isInitialized, startSyncJob } = usePersistentSyncJob();
  const { status } = useSyncProgress(currentJobId);

  // Auto-start sync once per onboarding (flag survives remounts)
  useEffect(() => {
    if (!isInitialized || currentJobId) return;
    if (localStorage.getItem(ONBOARDING_SYNC_KEY)) return;
    localStorage.setItem(ONBOARDING_SYNC_KEY, "true");
    syncMutation.mutate(
      {
        data: {
          syncAlbums: false,
          syncLikedTracks: true,
          syncPlaylists: false,
        },
      },
      {
        onSuccess: (result) => {
          startSyncJob(result.jobId, "full");
        },
      },
    );
  }, [isInitialized, currentJobId, syncMutation, startSyncJob]);

  const isCompleted = status?.state === "completed";
  const isFailed = status?.state === "failed";
  const isActive = status?.state === "active" || status?.state === "waiting";
  const isSyncStarting =
    !currentJobId && (syncMutation.isPending || !isInitialized);

  const handleRetry = () => {
    syncMutation.mutate(
      {
        data: {
          syncAlbums: false,
          syncLikedTracks: true,
          syncPlaylists: false,
        },
      },
      {
        onSuccess: (result) => {
          startSyncJob(result.jobId, "full");
        },
      },
    );
  };

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
      <Stack gap="md">
        <div className="flex items-center gap-3">
          <Library className="text-green-5" size={28} />
          <Title order={3}>Welcome to your library</Title>
        </div>

        {isActive && (
          <>
            <Text className="text-dark-1" size="sm">
              We're syncing your Spotify library. Your insights will appear
              below as tracks arrive.
            </Text>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Text className="text-dark-2" size="xs">
                  {status?.progress?.phase
                    ? `Syncing ${status.progress.phase}...`
                    : "Preparing sync..."}
                </Text>
                <Text className="text-dark-2" size="xs">
                  {status?.progress?.current?.toLocaleString() ?? 0} /{" "}
                  {status?.progress?.total?.toLocaleString() ?? "?"} tracks
                </Text>
              </div>
              <Progress
                animated
                color="green"
                size="md"
                value={status?.progress?.percentage ?? 0}
              />
            </div>
          </>
        )}

        {isCompleted && (
          <>
            <div className="flex items-center gap-2">
              <Music className="text-green-5" size={18} />
              <Text className="text-green-5 font-medium" size="sm">
                Your library is ready!
                {status?.result?.totalTracks
                  ? ` ${status.result.totalTracks.toLocaleString()} tracks synced.`
                  : ""}
              </Text>
            </div>
            <Text className="text-dark-1" size="sm">
              Explore your insights below, then continue to the full app when
              you're ready.
            </Text>
            <Button color="green" onClick={onComplete} size="md">
              Continue to app
            </Button>
          </>
        )}

        {isFailed && (
          <>
            <Text className="text-red-5" size="sm">
              Sync failed. {status?.error ?? "An unexpected error occurred."}
            </Text>
            <Button
              color="red"
              leftSection={<RefreshCw size={16} />}
              loading={syncMutation.isPending}
              onClick={handleRetry}
              size="md"
              variant="light"
            >
              Retry sync
            </Button>
          </>
        )}

        {isSyncStarting && (
          <div className="flex items-center gap-2">
            <Loader2 className="text-dark-2 animate-spin" size={16} />
            <Text className="text-dark-1" size="sm">
              Starting library sync...
            </Text>
          </div>
        )}
      </Stack>
    </Paper>
  );
}
