# Onboarding Redesign - Implementation Plan

## Overview

Redesign the onboarding flow to deliver the "aha moment" faster with zero user effort. Instead of asking users to rate tracks to unlock value, we show them value immediately based on their existing Spotify data.

**Current flow:**
OAuth → Quick sync (50 tracks) → Rate 3 tracks → Create basic playlists → Done

**New flow:**
OAuth → Parallel sync + enrichment → Evolving Insights page → Platform unlocks at threshold → Done

---

## The Aha Moment

Based on user research, the aha moment is:
1. **Instant utility**: "Here's a Gym playlist built from YOUR library"
2. **Instant insight**: "40% of your music is indie rock"

Both delivered within the first minute, requiring no user input.

---

## Core Principles

### 1. No Waiting for Sequential Steps
Don't wait for full sync before starting enrichment. Pipeline everything:
- Sync and enrichment run in parallel
- Insights appear as data arrives
- User sees progress, not a loading screen

### 2. Leverage Shared Enrichment
Tracks are shared entities. If a track was enriched for another user, it's instantly available. Popular music libraries will onboard very fast.

### 3. Progressive Disclosure
Show what we have, hide what we don't. The Insights page reveals sections as data becomes available rather than showing empty states.

### 4. Exit Anytime
Users aren't trapped. Once minimum threshold is hit, they can explore the app. Enrichment continues in background.

---

## Detailed Flow

### Step 1: OAuth Complete

User authenticates with Spotify. Backend:
1. Creates user with `hasCompletedOnboarding = false`
2. Stores encrypted Spotify tokens
3. Redirects to `/insights` (the Library Insights page)

### Step 2: Parallel Processing Begins

Three concurrent streams start immediately:

```
Stream 1 - Sync:
  Liked Songs → Saved Albums → User Playlists
  (tracks flow to enrichment queue as they arrive)

Stream 2 - Enrichment:
  Priority 1: Check if track already enriched (instant)
  Priority 2: Liked Songs tracks → Reccobeats + Last.fm
  Priority 3: Album/Playlist tracks → Reccobeats + Last.fm

Stream 3 - Insights:
  Recalculate/update insights as enrichment completes
  Push updates via WebSocket to frontend
```

### Step 3: Evolving Insights Page

The Insights page shows a "discovery" experience during onboarding:

| Timing | What Appears |
|--------|--------------|
| Immediately | "Found X liked tracks from Y artists" |
| ~10 seconds | Most saved artists, decade distribution |
| First enrichment batch (~50 tracks) | Energy meter starts populating |
| ~100 enriched | Mood profile takes shape |
| ~200 enriched | First playlist card: "Your Gym Playlist is ready!" |
| Threshold (~300 enriched) | "Ready to explore" button appears |

Each insight animates in smoothly. Counter shows progress: "Analyzed 156 of 2,341 tracks..."

### Step 4: Platform Unlocks

Once threshold is reached:
1. Navigation becomes available (was hidden/disabled)
2. "Ready to explore" or "Continue" button appears
3. User can leave Insights page and use the full app
4. `hasCompletedOnboarding` set to `true`

### Step 5: Background Continuation

After user leaves onboarding:
- Sync and enrichment continue in background
- Progress indicator persists in app header/sidebar
- New insights surface on dashboard: "New: Your full library has been analyzed"
- Insights page continues to evolve and become more accurate

---

## Threshold Logic

### What Counts as "Enriched"
A track is fully enriched when:
- `audioFeaturesUpdatedAt` is not null (Reccobeats data)
- OR track was already enriched by another user

Genre enrichment (Last.fm) is NOT required for threshold - it's slower and insights work without it.

### Threshold Value
~300 fully enriched tracks. This provides:
- Enough data for audio-feature playlists (Gym, Chill, Focus)
- Statistically meaningful distributions
- Fast enough that users don't bounce (target: <2 minutes for most libraries)

### Threshold Tracking
```typescript
interface OnboardingProgress {
  totalTracksFound: number;      // From Spotify API counts
  tracksSynced: number;          // Imported to database
  tracksEnriched: number;        // Have audio features
  thresholdReached: boolean;     // tracksEnriched >= 300
  estimatedTimeRemaining?: number;
}
```

Exposed via WebSocket on `/sync` namespace, same pattern as existing sync progress.

---

## Auto-Generated Playlists

During onboarding, automatically create starter playlists as soon as enough qualifying tracks exist:

| Playlist | Criteria | Min Tracks to Create |
|----------|----------|---------------------|
| Gym / Workout | energy > 0.7, tempo > 120 | 20 |
| Chill / Unwind | energy < 0.4, acousticness > 0.5 | 20 |
| Focus | instrumentalness > 0.5, speechiness < 0.3 | 15 |
| Feel Good | valence > 0.7, energy > 0.5 | 20 |
| Deep Cuts | popularity < 30 | 15 |

Each playlist "unlocks" and appears on the Insights page when enough tracks qualify. This creates the progressive reveal effect.

---

## UI States

### Navigation During Onboarding
- Main nav items are visible but disabled/greyed out
- Tooltip on hover: "Finish setup to unlock"
- Only Insights page is accessible
- Once threshold hit: nav items enable with subtle animation

### Insights Page During Onboarding
- Shows sync/enrichment progress prominently at top
- Sections fade in as data arrives
- Empty sections are hidden, not shown as empty
- Playlist cards appear with "New!" badge when ready
- "Continue to app" button appears at threshold

### Insights Page After Onboarding
- Progress bar only shows if enrichment still ongoing
- All sections visible (with appropriate empty states if needed)
- No "Continue" button - just a normal page
- Same page, different context

---

## Edge Cases

### Small Library (<100 Liked Songs)
- Lower threshold to match library size (or no threshold)
- Show messaging: "Add more music to unlock deeper insights"
- Don't block access to platform
- Generate what playlists we can

### Large Library (10k+ tracks)
- Threshold stays at 300 - fast onboarding
- Clear messaging: "Analyzed 312 of 10,847 tracks"
- Background enrichment continues for hours/days
- Dashboard notification when complete

### Mostly Popular Music
- Already-enriched tracks mean near-instant threshold
- This is fine - fast is good
- Don't artificially slow down

### Mostly Obscure Music
- Will take longer to enrich
- Progress indicator keeps user informed
- Consider timeout: if threshold not reached in X minutes, unlock anyway with partial data

### API Failures
- Reccobeats/Last.fm down or rate limited
- Retry with exponential backoff
- After X failures, lower threshold or unlock with partial data
- Show: "Some features are still loading" rather than blocking forever

### User Closes Browser
- All jobs continue server-side
- On return: check threshold
  - If not reached: show Insights page in onboarding mode
  - If reached: show normal app with Insights available
- Persist progress in database, not just WebSocket

### User Has No Liked Songs
- Fall back to recently saved albums/playlists
- Or prompt: "Like some songs in Spotify to get started"
- Don't completely block - show what we can

---

## Technical Changes

### Backend

#### New/Modified Endpoints

**`GET /library/onboarding-status`**
Returns current onboarding progress for gating logic.

```typescript
interface OnboardingStatusDto {
  hasCompletedOnboarding: boolean;
  progress: {
    totalTracksFound: number;
    tracksSynced: number;
    tracksEnriched: number;
    thresholdReached: boolean;
  };
  unlockedPlaylists: string[]; // IDs of auto-generated playlists
}
```

**`POST /library/sync/onboarding`**
New sync mode that starts the parallel sync+enrichment flow.
- Kicks off Liked Songs sync
- Immediately starts enrichment queue watcher
- Returns job ID for WebSocket subscription

#### Modified Sync Processor

Current: Sync completes, then enrichment is separate.
New: As tracks sync, immediately check if enriched. If not, add to priority queue.

```typescript
// In sync processor, after saving tracks:
for (const track of syncedTracks) {
  if (!track.audioFeaturesUpdatedAt) {
    await this.enrichmentQueue.add('enrich-track', {
      trackId: track.id,
      priority: isLikedSong ? 1 : 2
    });
  }
}
```

#### Enrichment Priority Queue

New Bull queue or modify existing:
- Priority levels (higher = processed first)
- Respects Reccobeats rate limits
- Batches requests (50 tracks per call)
- Updates progress via WebSocket

#### WebSocket Events

Extend `/sync` namespace:

```typescript
// Existing
'sync:progress' -> { phase, current, total }

// New
'enrichment:progress' -> { enriched, total, thresholdReached }
'playlist:unlocked' -> { playlistId, playlistName, trackCount }
'onboarding:complete' -> { }
```

### Frontend

#### Route Protection

```typescript
// In router config or layout
if (!user.hasCompletedOnboarding && !onThresholdReached) {
  // Only allow /insights route
  redirect('/insights');
}
```

#### Insights Page (Onboarding Mode)

```typescript
// Detect onboarding mode
const isOnboarding = !user.hasCompletedOnboarding;

// Show/hide elements based on mode
{isOnboarding && <OnboardingProgress />}
{isOnboarding && thresholdReached && <ContinueButton />}
{!isOnboarding && enrichmentOngoing && <BackgroundProgressBar />}
```

#### WebSocket Integration

Subscribe to enrichment progress:

```typescript
useEffect(() => {
  socket.on('enrichment:progress', (data) => {
    setEnrichmentProgress(data);
    if (data.thresholdReached) {
      setCanContinue(true);
    }
  });

  socket.on('playlist:unlocked', (data) => {
    // Animate new playlist card appearing
    addUnlockedPlaylist(data);
  });
}, []);
```

---

## Migration

### Existing Users
- `hasCompletedOnboarding` already true - no change
- They get access to Insights page as a new feature
- Their existing enrichment continues as normal

### New Users (After Deploy)
- Get new onboarding flow automatically
- `hasCompletedOnboarding` starts false
- Set to true when threshold reached

### Users Mid-Onboarding (Edge Case)
- Check their `hasCompletedOnboarding` flag
- If false and they have some data: put them in new flow
- If false and no data: start fresh with new flow

---

## Implementation Order

### Prerequisites
- Library Insights page must exist first (see library-insights-plan.md)
- Current sync infrastructure works, just needs modification

### Phase 2a: Backend Onboarding Infrastructure
1. Create `GET /library/onboarding-status` endpoint
2. Create `POST /library/sync/onboarding` endpoint
3. Implement enrichment priority queue
4. Add WebSocket events for enrichment progress
5. Implement threshold tracking logic

### Phase 2b: Frontend Onboarding Flow
1. Add route protection (redirect to /insights if not onboarded)
2. Add onboarding mode to Insights page
3. Implement progress indicators
4. Add "Continue to app" flow
5. Implement playlist unlock animations

### Phase 2c: Auto-Generated Playlists
1. Define playlist criteria templates
2. Implement auto-creation logic (trigger when enough tracks qualify)
3. Add WebSocket event for playlist unlock
4. Add playlist cards to Insights page

### Phase 2d: Polish
1. Navigation disabled state during onboarding
2. Animations and transitions
3. Error handling and edge cases
4. Timeout/fallback logic

---

## Success Metrics

- **Time to first playlist**: Target <2 minutes
- **Onboarding completion rate**: Should increase (no manual rating required)
- **Onboarding drop-off**: Should decrease (engaging progress vs loading screen)
- **Insights page return visits**: Users coming back to check stats

---

## Open Questions

1. **Threshold value**: 300 is a guess. Should we A/B test different values?
2. **Rating flow**: Remove entirely or make it optional post-onboarding?
3. **Timeout**: How long before we unlock with partial data? 5 min? 10 min?
4. **Notifications**: How to surface "enrichment complete" for users who left?
5. **Onboarding skip**: Should power users be able to skip and access app immediately?
