# Onboarding Redesign - Staged Implementation Plan

## Context

**Current flow (broken):** OAuth → modal (quick sync 10 tracks) → rate 3 tracks → create seed playlists. Bug: `hasCompletedOnboarding` is never set to `true`.

**New flow:** OAuth → redirect to `/insights` → auto full sync + enrichment → insights evolve as data arrives → platform unlocks at threshold → done.

**What already exists:**
- Insights page: fully built with 6 sections (`/insights`)
- Sync: Bull queue + WebSocket progress (`useSyncProgress`, `usePersistentSyncJob` hooks)
- Genre enrichment: Bull queue, auto-triggered after sync
- Audio features: ReccoBeats service (NOT queued, NOT auto-triggered — admin-only)
- Quick-create playlists: `POST /playlists/quick-create` works
- Onboarding flag: `hasCompletedOnboarding` on User model, `PUT /auth/profile/onboarding` exists

---

## Stage 1: Redirect New Users to Insights + Auto-Sync

**Value:** New users land on the insights page instead of a broken modal. Library syncs automatically. Users click "Continue" when ready.

### Backend: No changes needed

All required endpoints already exist.

### Frontend changes

**Modify `frontend/src/routes/~auth/~success.tsx`:**
- Remove `OnboardingSyncModal` usage entirely
- For new users (`!profile.hasCompletedOnboarding`):
  - Trigger full sync via `useLibraryControllerSyncLibrary()` mutation
  - Store jobId using the existing `usePersistentSyncJob().startSyncJob()` pattern
  - Navigate to `/insights`
- For returning users: keep existing redirect to `/`

**Modify `frontend/src/routes/~insights.index.tsx`:**
- Read `profile.hasCompletedOnboarding` from auth context
- Read sync jobId from `usePersistentSyncJob()`
- If `!hasCompletedOnboarding`: render `<OnboardingHero>` above existing sections
- Add `refetchInterval: 5000` on insights query during onboarding so sections populate live
- When user clicks "Continue": call `PUT /auth/profile/onboarding`, invalidate profile query, clear persisted sync job

**Create `frontend/src/components/insights/OnboardingHero.tsx` (~80 lines):**
- Props: `{ jobId: string | null; onComplete: () => void }`
- Uses existing `useSyncProgress(jobId)` for real-time progress
- Shows: welcome message, animated progress bar, phase text, track count
- On sync complete: transitions to "Your library is ready!" with "Continue to app" button
- On sync failed: shows retry button
- If no active sync (jobId is null, e.g. user returned after sync finished): show "Continue" directly

---

## Stage 2: Audio Features Enrichment Queue

**Value:** Audio features (energy, valence, tempo, etc.) get enriched automatically after sync instead of requiring admin intervention. The AudioProfile section on insights populates without manual backfill.

### Backend changes

**Create `backend/src/library/audio-features-queue.service.ts` (new):**
- Pattern: match `GenreQueueService` exactly
- Methods:
  - `enqueueForUser(userId)` — enrich unenriched tracks for a user (deduped by jobId `user-${userId}`)
  - `enqueueForTracks(trackIds[])` — enrich specific tracks
  - `enqueueBackfill()` — global backfill (replaces admin direct call)

**Create `backend/src/queue/processors/audio-features.processor.ts` (new):**
- Pattern: match `GenreEnrichmentProcessor`
- `@Processor("audio-features")`
- Job data: `{ userId?, trackIds?, all? }`
- Calls existing `LibrarySyncService.syncAudioFeatures()` / `syncAudioFeaturesGlobal()`
- Progress updates every 10 tracks
- Self-chains for backfill if more tracks remain

**Modify `backend/src/queue/queue.module.ts`:**
- Register `audio-features` queue (same config as `genre-enrichment`)

**Modify `backend/src/library/library.module.ts`:**
- Add `AudioFeaturesQueueService` to providers/exports

**Modify `backend/src/queue/processors/sync.processor.ts`:**
- After the existing genre enrichment trigger, add:
  ```
  await this.audioFeaturesQueueService.enqueueForUser(userId);
  ```
- Non-blocking (catch errors, log warning)

**Modify `backend/src/admin/admin.controller.ts`:**
- Replace direct `syncAllAudioFeaturesGlobal()` calls with `audioFeaturesQueueService.enqueueBackfill()`

### Frontend: No changes needed

The existing `SyncStatusSection` already shows `tracksWithAudioFeatures` progress.

---

## Stage 3: Enrichment Progress + Progressive Disclosure

**Value:** During onboarding, insights sections fade in one by one as data arrives. Users see their library being analyzed in real-time.

### Backend changes

**Modify `backend/src/library/library.controller.ts`:**
- Add lightweight endpoint `GET /library/enrichment-progress`
- Returns just `{ totalTracks, tracksWithAudioFeatures, tracksWithGenres }` (subset of insights)

**Modify `backend/src/library/insights.service.ts`:**
- Extract enrichment counts query into standalone `getEnrichmentCounts(userId)` method (reusable)

### Frontend changes

**Modify `frontend/src/routes/~insights.index.tsx`:**
- During onboarding: wrap each section in `<SectionReveal>` with visibility conditions:
  - `LibraryOverview` + `YearBreakdown`: visible when `totalTracks > 0`
  - `GenreBreakdown`: visible when `tracksWithGenres > 10`
  - `AudioProfile`: visible when `tracksWithAudioFeatures > 10`
  - `QuickPlaylist`: visible when `min(genres, audioFeatures) >= 100`
- For non-onboarding users: all sections always visible (no wrapping)
- Poll enrichment-progress endpoint every 3s during onboarding

**Create `frontend/src/components/insights/SectionReveal.tsx` (~25 lines):**
- Props: `{ visible: boolean; children: ReactNode; delay?: number }`
- CSS transition: opacity 0→1, translateY 10px→0

**Modify `frontend/src/components/insights/OnboardingHero.tsx`:**
- Add enrichment progress bars below sync progress (Genres + Audio Features)
- Show counts: "Analyzed X of Y tracks"

---

## Stage 4: Threshold Gating + Route Protection

**Value:** New users are properly gated to `/insights` until their library is ready. Onboarding auto-completes at 300 enriched tracks.

### Backend changes

**Modify `backend/src/queue/processors/audio-features.processor.ts`:**
- After processing a batch, check enrichment threshold for the user:
  ```
  if (enrichedCount >= threshold) authService.updateOnboardingStatus(userId, true)
  ```
- Threshold: `min(totalTracks * 0.8, 300)` — handles small libraries

**Modify `backend/src/queue/processors/genre-enrichment.processor.ts`:**
- Same threshold check (whichever finishes last crosses the line)

### Frontend changes

**Modify `frontend/src/routes/~__root.tsx`:**
- In `AuthWrapper`: if authenticated + `!hasCompletedOnboarding` + not on `/insights` or `/auth/*` → redirect to `/insights`

**Modify `frontend/src/components/AppShell.tsx`:**
- Read `hasCompletedOnboarding` from auth context
- During onboarding: render nav items with muted style + lock icon for non-insights routes
- Tooltip on locked items: "Complete library setup to unlock"

**Modify `frontend/src/routes/~insights.index.tsx`:**
- Remove manual `PUT /auth/profile/onboarding` call from Stage 1 "Continue" button
- Instead poll profile query (`refetchInterval: 10000`) to detect auto-completion
- When `hasCompletedOnboarding` flips to true: show toast, unlock nav

**Modify `frontend/src/components/insights/OnboardingHero.tsx`:**
- Change "Continue" button logic: only appears when backend has set `hasCompletedOnboarding: true`
- Before threshold: show progress toward unlock ("87 of 300 tracks analyzed")

---

## Stage 5: Cleanup + Edge Cases

**Value:** Remove legacy onboarding code. Handle edge cases (small libraries, API failures, returning mid-onboarding).

### Files to delete
- `frontend/src/components/OnboardingSyncModal.tsx`
- `frontend/src/components/OnboardingRatingPrompt.tsx`
- `frontend/src/contexts/OnboardingContext.tsx`
- `frontend/src/contexts/OnboardingContextDef.ts`
- `frontend/src/hooks/useOnboarding.ts`
- `frontend/src/components/fullscreen/OnboardingProgress.tsx`

### Files to modify
- `frontend/src/routes/~__root.tsx` — remove `OnboardingProvider`
- `frontend/src/routes/~fullscreen.tsx` — remove onboarding-specific rating logic
- `frontend/src/components/insights/OnboardingHero.tsx` — handle resume (user returns after closing browser), small-library messaging

### Edge cases to handle
- **Small library (<100 tracks):** Lower threshold to `totalTracks * 0.8`, never block access
- **User closes browser mid-onboarding:** Sync/enrichment continue server-side. On return, `usePersistentSyncJob` reconnects or detects completion. Check `hasCompletedOnboarding` — if still false, show insights in onboarding mode
- **API failures (ReccoBeats/Last.fm down):** Enrichment processors already retry with backoff. If threshold not reached after sync + enrichment complete, fall back to lower threshold
- **Existing users with `hasCompletedOnboarding: false`:** If they have data already, auto-set the flag on first insights page load

---

## Verification

After each stage, test:
1. **New user flow:** Clear `hasCompletedOnboarding` for a test user, log in, verify redirect to insights
2. **Returning user flow:** Existing user logs in, verify redirect to `/` (not insights)
3. **Sync progress:** Verify WebSocket progress shows on insights page
4. **Data population:** Verify insights sections populate as sync/enrichment runs
5. **Onboarding completion:** Verify `hasCompletedOnboarding` gets set to `true`
6. **Browser refresh:** Close and reopen during onboarding, verify state is preserved

Run `npm run lint` in both frontend and backend after each stage. Run `npm run test` in backend for any modified services.
