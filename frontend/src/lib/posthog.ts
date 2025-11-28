import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com";

export const isPostHogEnabled = (): boolean => {
  return !!POSTHOG_KEY && import.meta.env.PROD;
};

export const initPostHog = (): void => {
  if (!isPostHogEnabled()) {
    // eslint-disable-next-line no-console
    console.log("[PostHog] Disabled in development or missing key");
    return;
  }

  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    autocapture: false, // We use explicit event tracking
    capture_pageleave: true,
    capture_pageview: false, // We handle this manually with router
    persistence: "localStorage",
    person_profiles: "identified_only",
  });
};

// Identify user after authentication
export const identifyUser = (
  userId: string,
  properties?: Record<string, unknown>,
): void => {
  if (!isPostHogEnabled()) return;
  posthog.identify(userId, properties);
};

// Reset user on logout
export const resetUser = (): void => {
  if (!isPostHogEnabled()) return;
  posthog.reset();
};

// Track page view
export const trackPageView = (path: string): void => {
  if (!isPostHogEnabled()) return;
  posthog.capture("$pageview", { $current_url: path });
};

// Generic event tracking
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>,
): void => {
  if (!isPostHogEnabled()) return;
  posthog.capture(eventName, properties);
};

// ============================================================================
// STRATEGIC EVENT TRACKING
// ============================================================================
// Events designed to measure what matters for SpotLib's success:
// 1. Acquisition: How users discover and sign up
// 2. Activation: First meaningful actions (library sync, first rating)
// 3. Retention: Regular usage patterns
// 4. Engagement: Deep feature usage
// 5. Value Creation: User-generated organization (tags, playlists)
// ============================================================================

// --- ACQUISITION & ONBOARDING ---

export const trackSignupStarted = (): void => {
  trackEvent("signup_started", { source: "welcome_page" });
};

export const trackSignupCompleted = (): void => {
  trackEvent("signup_completed");
};

export const trackOnboardingStep = (step: string, completed: boolean): void => {
  trackEvent("onboarding_step", { completed, step });
};

// --- LIBRARY SYNC (Core Activation) ---

export const trackSyncStarted = (itemCounts?: {
  albums?: number;
  artists?: number;
  tracks?: number;
}): void => {
  trackEvent("sync_started", itemCounts);
};

export const trackSyncCompleted = (
  duration: number,
  counts: { albums: number; artists: number; tracks: number },
): void => {
  trackEvent("sync_completed", { duration_seconds: duration, ...counts });
};

export const trackSyncFailed = (error: string): void => {
  trackEvent("sync_failed", { error });
};

// --- RATING (Primary Engagement) ---

export const trackTrackRated = (
  rating: number,
  source: "album" | "artist" | "fullscreen" | "library",
): void => {
  trackEvent("track_rated", { rating, source });
};

export const trackRatingCleared = (source: string): void => {
  trackEvent("rating_cleared", { source });
};

// --- TAGGING (Value Creation) ---

export const trackTagCreated = (tagName: string): void => {
  trackEvent("tag_created", { tag_name: tagName });
};

export const trackTagApplied = (trackCount: number): void => {
  trackEvent("tag_applied", { track_count: trackCount });
};

export const trackTagRemoved = (): void => {
  trackEvent("tag_removed");
};

// --- SMART PLAYLISTS (Advanced Feature) ---

export const trackPlaylistCreated = (criteriaCount: number): void => {
  trackEvent("smart_playlist_created", { criteria_count: criteriaCount });
};

export const trackPlaylistViewed = (trackCount: number): void => {
  trackEvent("smart_playlist_viewed", { track_count: trackCount });
};

// --- LIBRARY BROWSING (Retention) ---

export const trackLibraryFiltered = (filters: {
  genre?: string;
  sort?: string;
  tag?: string;
}): void => {
  trackEvent("library_filtered", filters);
};

export const trackLibrarySearched = (hasResults: boolean): void => {
  trackEvent("library_searched", { has_results: hasResults });
};

// --- PLAYBACK (Engagement) ---

export type PlaybackContext =
  | "album"
  | "artist"
  | "library"
  | "play_history"
  | "recently_played"
  | "smart_playlist"
  | "top_tracks";

const CONTEXT_TYPE_MAP: Record<string, PlaybackContext> = {
  album: "album",
  artist: "artist",
  library: "library",
  play_history: "play_history",
  recently_played: "recently_played",
  smart_playlist: "smart_playlist",
  top_tracks: "top_tracks",
};

export const mapToPlaybackContext = (contextType?: string): PlaybackContext => {
  return CONTEXT_TYPE_MAP[contextType || "library"] || "library";
};

export interface PlaybackEventProperties {
  context: PlaybackContext;
  context_id?: string;
  shuffle?: boolean;
  track_count?: number;
}

export const trackPlaybackStarted = (
  properties: PlaybackEventProperties,
): void => {
  trackEvent("playback_started", { ...properties });
};

export const trackPlaybackSkipped = (context: PlaybackContext): void => {
  trackEvent("playback_skipped", { context });
};

export const trackPlaybackPaused = (): void => {
  trackEvent("playback_paused");
};

export const trackPlaybackResumed = (): void => {
  trackEvent("playback_resumed");
};

// --- PLAY HISTORY ---

export const trackPlayHistoryViewed = (): void => {
  trackEvent("play_history_viewed");
};

export const trackAddedToLibraryFromHistory = (): void => {
  trackEvent("added_to_library_from_history");
};

// --- ALBUM & ARTIST VIEWS ---

export const trackAlbumViewed = (
  albumName: string,
  trackCount: number,
): void => {
  trackEvent("album_viewed", {
    album_name: albumName,
    track_count: trackCount,
  });
};

export const trackArtistViewed = (
  artistName: string,
  trackCount: number,
): void => {
  trackEvent("artist_viewed", {
    artist_name: artistName,
    track_count: trackCount,
  });
};

// --- DASHBOARD ---

export const trackDashboardViewed = (stats: {
  ratedPercentage: number;
  taggedPercentage: number;
  totalTracks: number;
}): void => {
  trackEvent("dashboard_viewed", stats);
};

// Export posthog instance for advanced usage
export { posthog };
