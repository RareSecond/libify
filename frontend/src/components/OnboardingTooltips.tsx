import { Button } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

import { OnboardingStep } from "@/hooks/useOnboarding";

interface OnboardingTooltipsProps {
  currentTooltip: null | OnboardingStep;
  hasTracks: boolean;
  skipOnboarding: () => void;
}

export function OnboardingTooltips({
  currentTooltip,
  hasTracks,
  skipOnboarding,
}: OnboardingTooltipsProps) {
  const navigate = useNavigate();

  if (currentTooltip === "sort") {
    return (
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-dark-7 p-4 rounded-lg shadow-xl border border-dark-5 max-w-sm">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-gray-100">
            Sort your tracks
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
          Click any column header to sort your tracks by that field. Try
          clicking &quot;Artist&quot; or &quot;Title&quot;!
        </p>
        <div className="flex gap-2 justify-end">
          <Button onClick={skipOnboarding} size="xs" variant="subtle">
            Skip tutorial
          </Button>
        </div>
      </div>
    );
  }

  if (currentTooltip === "rate" && hasTracks) {
    return (
      <div className="absolute top-32 left-4 z-50 bg-dark-7 p-4 rounded-lg shadow-xl border border-dark-5 max-w-sm">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-gray-100">
            Rate your tracks
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
          Click on the stars in any track row to rate it. Your ratings help
          create better playlists!
        </p>
        <div className="flex gap-2 justify-end">
          <Button onClick={skipOnboarding} size="xs" variant="subtle">
            Skip tutorial
          </Button>
        </div>
      </div>
    );
  }

  if (currentTooltip === "playlist") {
    return (
      <div className="absolute top-4 right-4 z-50 bg-dark-7 p-4 rounded-lg shadow-xl border border-dark-5 max-w-sm">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-gray-100">
            Great! One more thing...
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
          Now let&apos;s check out Smart Playlists where you can create
          playlists based on your ratings and preferences!
        </p>
        <div className="flex gap-2 justify-end">
          <Button onClick={skipOnboarding} size="xs" variant="subtle">
            Skip tutorial
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => {
              navigate({ to: "/playlists" });
            }}
            size="xs"
          >
            Go to Playlists
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
