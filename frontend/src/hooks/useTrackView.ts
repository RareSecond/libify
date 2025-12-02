import { useEffect, useRef } from "react";

/**
 * Custom hook to track a view event once when data is loaded.
 * Automatically resets when the identity changes, ensuring each unique
 * entity triggers a fresh tracking event.
 *
 * @param identity - A unique identifier that, when changed, resets tracking (e.g., artistId, albumId)
 * @param isLoading - Whether data is still loading
 * @param isReady - Whether the data is ready to be tracked (e.g., data !== undefined)
 * @param trackFn - The tracking function to call when conditions are met
 */
export function useTrackView(
  identity: string | undefined,
  isLoading: boolean,
  isReady: boolean,
  trackFn: () => void,
): void {
  const hasTrackedRef = useRef(false);
  const prevIdentityRef = useRef<string | undefined>(identity);

  useEffect(() => {
    // Reset tracking when identity changes
    if (identity !== prevIdentityRef.current) {
      hasTrackedRef.current = false;
      prevIdentityRef.current = identity;
    }

    // Track view once data is loaded and ready
    if (!isLoading && isReady && !hasTrackedRef.current && identity) {
      trackFn();
      hasTrackedRef.current = true;
    }
  }, [identity, isLoading, isReady, trackFn]);
}
