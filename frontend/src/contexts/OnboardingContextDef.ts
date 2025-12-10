import { createContext } from "react";

import { TrackDto } from "@/data/api";

export interface OnboardingContextType {
  advance: (rating: number) => void;
  currentIndex: number;
  exitOnboarding: () => void;
  isOnboarding: boolean;
  ratings: number[];
  startOnboarding: (tracks: TrackDto[]) => void;
  totalTracks: number;
  tracks: TrackDto[];
}

export const OnboardingContext = createContext<null | OnboardingContextType>(
  null,
);
