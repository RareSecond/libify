import { useContext } from "react";

import { OnboardingContext } from "@/contexts/OnboardingContextDef";

export function useOnboarding() {
  return useContext(OnboardingContext);
}
