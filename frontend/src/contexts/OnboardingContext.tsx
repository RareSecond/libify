import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { TrackDto } from "@/data/api";

interface OnboardingContextType {
  // Actions
  advance: (rating: number) => void;
  // State
  currentIndex: number;
  exitOnboarding: () => void;
  isOnboarding: boolean;
  ratings: number[];

  startOnboarding: (tracks: TrackDto[]) => void;
  totalTracks: number;
  tracks: TrackDto[];
}

const OnboardingContext = createContext<null | OnboardingContextType>(null);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [tracks, setTracks] = useState<TrackDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [ratings, setRatings] = useState<number[]>([]);

  const startOnboarding = useCallback((newTracks: TrackDto[]) => {
    setTracks(newTracks);
    setCurrentIndex(0);
    setIsOnboarding(true);
    setRatings([]);
  }, []);

  const advance = useCallback((rating: number) => {
    setRatings((prev) => [...prev, rating]);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const exitOnboarding = useCallback(() => {
    setIsOnboarding(false);
    setTracks([]);
    setCurrentIndex(0);
    setRatings([]);
  }, []);

  const value = useMemo(
    () => ({
      advance,
      currentIndex,
      exitOnboarding,
      isOnboarding,
      ratings,
      startOnboarding,
      totalTracks: tracks.length,
      tracks,
    }),
    [
      advance,
      currentIndex,
      exitOnboarding,
      isOnboarding,
      ratings,
      startOnboarding,
      tracks,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
