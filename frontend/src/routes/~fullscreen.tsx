import { Center, Loader, Stack, Text } from "@mantine/core";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

import { FullscreenHeader } from "@/components/fullscreen/FullscreenHeader";
import { FullscreenSpotifyTrackView } from "@/components/fullscreen/FullscreenSpotifyTrackView";
import { FullscreenTrackView } from "@/components/fullscreen/FullscreenTrackView";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useLibraryTrack } from "@/hooks/useLibraryTrack";
import { trackEvent } from "@/lib/posthog";

export const Route = createFileRoute("/fullscreen")({
  component: FullscreenPage,
});

function FullscreenPage() {
  const router = useRouter();
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    nextTrack,
    pause,
    previousTrack,
    resume,
  } = useSpotifyPlayer();

  const originalSpotifyId =
    currentTrack?.linked_from?.id || currentTrack?.id || "";

  const { isLoading, libraryTrack, refetchLibraryTrack } = useLibraryTrack({
    spotifyId: originalSpotifyId,
  });

  const handleClose = useCallback(() => {
    trackEvent("fullscreen_mode_exited");
    router.history.back();
  }, [router]);

  const handleNext = useCallback(async () => {
    await nextTrack();
  }, [nextTrack]);

  const handlePrevious = useCallback(async () => {
    await previousTrack();
  }, [previousTrack]);

  const handleLibraryTrackUpdate = async () => {
    await refetchLibraryTrack();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        if (isPlaying) pause();
        else resume();
      }

      if (e.key === "n" || e.key === "ArrowRight") handleNext();
      if (e.key === "p" || e.key === "ArrowLeft") handlePrevious();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, pause, resume, handlePrevious, handleNext, handleClose]);

  // Track fullscreen mode entry
  useEffect(() => {
    trackEvent("fullscreen_mode_entered");
  }, []);

  // No track playing - show message
  if (!currentTrack) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col py-4">
        <FullscreenHeader onClose={handleClose} />
        <Center className="flex-1">
          <Stack align="center" gap="md">
            <Text className="text-dark-2" size="xl">
              No track is currently playing
            </Text>
            <Text className="text-dark-3" size="sm">
              Start playing something to see it in fullscreen mode
            </Text>
          </Stack>
        </Center>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col py-4 overflow-y-auto">
      <FullscreenHeader onClose={handleClose} />

      <div className="flex-1 flex flex-col items-center px-4 md:px-8 pb-4 gap-2 min-h-0">
        <Text className="text-dark-3 text-center text-xs md:text-sm hidden md:block">
          <strong>Shortcuts:</strong> Space = Play/Pause · N = Next · P =
          Previous · Esc = Back
        </Text>

        {isLoading ? (
          <Loader color="orange" size="xl" />
        ) : libraryTrack ? (
          <FullscreenTrackView
            currentTrackIndex={currentTrackIndex}
            libraryTrack={libraryTrack}
            onLibraryTrackUpdate={handleLibraryTrackUpdate}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        ) : (
          <FullscreenSpotifyTrackView
            currentTrackIndex={currentTrackIndex}
            onNext={handleNext}
            onPrevious={handlePrevious}
            track={currentTrack}
          />
        )}
      </div>
    </div>
  );
}
