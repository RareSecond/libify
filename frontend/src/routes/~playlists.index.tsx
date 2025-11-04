import { Button } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { PageTitle } from "../components/PageTitle";
import { SmartPlaylists } from "../components/SmartPlaylists";
import { useOnboarding } from "../hooks/useOnboarding";

export const Route = createFileRoute("/playlists/")({
  component: PlaylistsIndexPage,
});

function PlaylistsIndexPage() {
  const { completeOnboarding, currentTooltip, skipOnboarding } =
    useOnboarding();

  return (
    <div className="max-w-7xl mx-auto p-4 relative">
      <PageTitle title="Smart Playlists" />
      <SmartPlaylists />

      {currentTooltip === "playlist" && (
        <div className="absolute top-4 right-4 z-50 bg-dark-7 p-4 rounded-lg shadow-xl border border-dark-5 max-w-sm">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm text-gray-100">
              Create smart playlists
            </h3>
            <button
              aria-label="Close tooltip"
              className="text-gray-400 hover:text-gray-300 transition-colors"
              onClick={skipOnboarding}
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            This is where you can create smart playlists based on ratings,
            genres, and play counts! Click the button below to get started.
          </p>
          <div className="flex gap-2 justify-end">
            <Button onClick={skipOnboarding} size="xs" variant="subtle">
              Skip tutorial
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={completeOnboarding}
              size="xs"
            >
              Finish tutorial
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
