import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import {
  useAuthControllerGetProfile,
  useAuthControllerUpdateOnboarding,
} from "@/data/api";

const ONBOARDING_STORAGE_KEY = "spotlib-onboarding-completed";
const CURRENT_TOOLTIP_KEY = "spotlib-current-tooltip";

export type OnboardingStep = "playlist" | "rate" | "sort";

interface OnboardingState {
  currentTooltip: null | OnboardingStep;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
}

export function useOnboarding() {
  const queryClient = useQueryClient();
  const { data: profile } = useAuthControllerGetProfile();
  const updateOnboardingMutation = useAuthControllerUpdateOnboarding();

  const [localState, setLocalState] = useState<OnboardingState>(() => {
    // Initialize from localStorage
    const hasCompletedLocal =
      localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
    const currentTooltip = localStorage.getItem(
      CURRENT_TOOLTIP_KEY,
    ) as null | OnboardingStep;

    return {
      currentTooltip: hasCompletedLocal ? null : currentTooltip || "sort",
      hasCompletedOnboarding: hasCompletedLocal,
      isLoading: false,
    };
  });

  // Sync local state with backend profile data
  useEffect(() => {
    if (profile?.hasCompletedOnboarding) {
      setLocalState((prev) => ({
        ...prev,
        currentTooltip: null,
        hasCompletedOnboarding: true,
      }));
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      localStorage.removeItem(CURRENT_TOOLTIP_KEY);
    }
  }, [profile]);

  const completeOnboarding = useCallback(async () => {
    setLocalState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Update local storage immediately
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      localStorage.removeItem(CURRENT_TOOLTIP_KEY);

      // Update backend
      await updateOnboardingMutation.mutateAsync({
        data: { hasCompletedOnboarding: true },
      });

      // Invalidate profile query to get fresh data
      await queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });

      setLocalState({
        currentTooltip: null,
        hasCompletedOnboarding: true,
        isLoading: false,
      });
    } catch {
      // Failed to update backend, but local state is already updated
      setLocalState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [updateOnboardingMutation, queryClient]);

  const advanceTooltip = useCallback(() => {
    if (localState.hasCompletedOnboarding) return;

    const steps: OnboardingStep[] = ["sort", "rate", "playlist"];
    const currentIndex = localState.currentTooltip
      ? steps.indexOf(localState.currentTooltip)
      : -1;

    if (currentIndex < steps.length - 1) {
      const nextTooltip = steps[currentIndex + 1];
      localStorage.setItem(CURRENT_TOOLTIP_KEY, nextTooltip);
      setLocalState((prev) => ({ ...prev, currentTooltip: nextTooltip }));
    } else {
      // Last tooltip - complete onboarding
      completeOnboarding();
    }
  }, [
    localState.currentTooltip,
    localState.hasCompletedOnboarding,
    completeOnboarding,
  ]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const resetOnboarding = useCallback(() => {
    // For testing purposes
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.setItem(CURRENT_TOOLTIP_KEY, "sort");
    setLocalState({
      currentTooltip: "sort",
      hasCompletedOnboarding: false,
      isLoading: false,
    });
  }, []);

  // Expose debug info to window for easy testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)["debugOnboarding"] = () => {
        return {
          currentTooltip: localState.currentTooltip,
          hasCompletedOnboarding: localState.hasCompletedOnboarding,
          localStorage: {
            completed: localStorage.getItem(ONBOARDING_STORAGE_KEY),
            currentTooltip: localStorage.getItem(CURRENT_TOOLTIP_KEY),
          },
          profile: { hasCompletedOnboarding: profile?.hasCompletedOnboarding },
        };
      };
    }
  }, [localState, profile]);

  return {
    ...localState,
    advanceTooltip,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
  };
}
