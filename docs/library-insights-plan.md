# Library Insights Page - Implementation Plan

## Overview

A new "Library Insights" page that shows users statistics and patterns about their music library. This page serves dual purposes:

1. **For existing users**: A new feature to explore their music taste, discover patterns, and quickly generate smart playlists
2. **For new users (future)**: The onboarding discovery screen that reveals insights as their library is analyzed

This plan focuses on Phase 1: building the Insights page for existing users.

---

## User Value

Based on user research (Reddit r/truespotify thread):
- Users love stats about their listening (multiple mentions of stats.fm)
- Users organize music by mood/context (gym, chill, driving)
- Users want ready-to-use playlists without manual curation
- "Mine is a mess" - some users need help understanding their own library

The Insights page addresses all of these by:
- Showing genre, audio feature, and decade breakdowns
- Providing one-click playlist generation from any insight
- Helping users discover patterns they didn't know about

---

## Page Sections

### 1. Sync Status (conditional)
Only shown if enrichment is incomplete.

```
Your library is being analyzed...
[=========>          ] 847 of 3,200 tracks
Insights will become more accurate as we analyze more tracks.
```

### 2. Library Overview
Basic stats available immediately from sync metadata.

- Total tracks, albums, artists
- Library age: "Your library spans from 2008 to today"
- Most saved artists (top 5)

### 3. Genre Breakdown
Requires Last.fm enrichment. Shows distribution of genres.

- Visual: Pie chart or horizontal bar chart
- Top 5-10 genres with percentages
- Each genre has a "Create playlist" action button
- Note: "Based on X analyzed tracks" if enrichment incomplete

### 4. Audio Profile
Requires Reccobeats enrichment. Shows audio feature distributions.

**Energy Distribution:**
- Low / Medium / High energy breakdown
- Quick actions: "Chill playlist", "High energy playlist"

**Mood Quadrant:**
- X-axis: Valence (sad ← → happy)
- Y-axis: Energy (calm ← → intense)
- Clickable quadrants to generate mood-based playlists

**Tempo Distribution:**
- Slow (<100 BPM) / Medium / Fast (>140 BPM)
- Useful for workout playlist generation

### 5. Decade Breakdown
Available from track/album release year metadata.

- Visual: Bar chart showing tracks per decade
- "Make 90s playlist", "Make 2010s playlist" actions

### 6. Quick Playlist Actions
Prominent section with preset playlist generators:

| Playlist | Criteria |
|----------|----------|
| Gym / Workout | energy > 0.7, tempo > 120 |
| Chill / Unwind | energy < 0.4, acousticness > 0.5 |
| Focus | instrumentalness > 0.5, speechiness < 0.3 |
| Feel Good | valence > 0.7, energy > 0.5 |
| Deep Cuts | popularity < 30 |

Each button creates a smart playlist with the criteria and redirects to it.

---

## Technical Requirements

### Backend

#### New Endpoint: `GET /library/insights`

Returns aggregated insights for the current user.

```typescript
interface LibraryInsightsDto {
  // Overview
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
  oldestTrackYear: number | null;
  newestTrackYear: number | null;
  topArtists: Array<{ name: string; trackCount: number; imageUrl?: string }>;

  // Enrichment status
  enrichmentProgress: {
    tracksWithAudioFeatures: number;
    tracksWithGenres: number;
    totalTracks: number;
  };

  // Genre breakdown (from enriched tracks)
  genreDistribution: Array<{ genre: string; count: number; percentage: number }>;

  // Audio features (aggregated from enriched tracks)
  audioProfile: {
    energyDistribution: { low: number; medium: number; high: number };
    valenceDistribution: { low: number; medium: number; high: number };
    tempoDistribution: { slow: number; medium: number; fast: number };
    averageEnergy: number;
    averageValence: number;
    averageTempo: number;
  };

  // Decade breakdown
  decadeDistribution: Array<{ decade: string; count: number; percentage: number }>;
}
```

#### Implementation Notes

- Use Kysely for aggregation queries (GROUP BY, COUNT, AVG)
- Genre distribution: Join through TrackGenre, group by genre name
- Audio features: Aggregate from SpotifyTrack where audioFeaturesUpdatedAt is not null
- Decade: Extract from track/album release date, bucket into decades
- Cache results with short TTL (5 min) - insights don't change rapidly

#### New Endpoint: `POST /playlists/quick-create`

Creates a smart playlist from a preset.

```typescript
interface QuickCreatePlaylistDto {
  preset: 'gym' | 'chill' | 'focus' | 'feel-good' | 'deep-cuts' | 'genre' | 'decade';
  // For genre/decade presets:
  genreName?: string;
  decade?: string;
}
```

Returns the created playlist so frontend can redirect.

### Frontend

#### New Route: `/insights`

- Add to main navigation
- Accessible to authenticated users
- Shows loading skeletons while data fetches

#### Components

```
InsightsPage
├── SyncStatusBar (conditional)
├── LibraryOverview
│   ├── StatCard (total tracks)
│   ├── StatCard (total artists)
│   ├── StatCard (library age)
│   └── TopArtistsList
├── GenreBreakdown
│   ├── GenreChart (pie or bar)
│   └── GenrePlaylistButtons
├── AudioProfile
│   ├── EnergyDistribution
│   ├── MoodQuadrant
│   └── TempoDistribution
├── DecadeBreakdown
│   ├── DecadeChart
│   └── DecadePlaylistButtons
└── QuickPlaylistActions
    └── PresetPlaylistButton (x5)
```

#### State Management

- Use TanStack Query for fetching insights
- Refetch on window focus (insights may have updated from background enrichment)
- Optimistic UI not needed - this is read-heavy

---

## Database Queries

### Genre Distribution
```sql
SELECT g.name as genre, COUNT(*) as count
FROM "TrackGenre" tg
JOIN "Genre" g ON g.id = tg."genreId"
JOIN "UserTrack" ut ON ut."spotifyTrackId" = tg."spotifyTrackId"
WHERE ut."userId" = :userId
GROUP BY g.name
ORDER BY count DESC
LIMIT 10
```

### Audio Feature Averages
```sql
SELECT
  AVG(st.energy) as avg_energy,
  AVG(st.valence) as avg_valence,
  AVG(st.tempo) as avg_tempo,
  COUNT(CASE WHEN st.energy < 0.4 THEN 1 END) as low_energy,
  COUNT(CASE WHEN st.energy >= 0.4 AND st.energy < 0.7 THEN 1 END) as mid_energy,
  COUNT(CASE WHEN st.energy >= 0.7 THEN 1 END) as high_energy
FROM "UserTrack" ut
JOIN "SpotifyTrack" st ON st.id = ut."spotifyTrackId"
WHERE ut."userId" = :userId
  AND st."audioFeaturesUpdatedAt" IS NOT NULL
```

### Decade Distribution
```sql
SELECT
  FLOOR(EXTRACT(YEAR FROM st."releaseDate") / 10) * 10 as decade,
  COUNT(*) as count
FROM "UserTrack" ut
JOIN "SpotifyTrack" st ON st.id = ut."spotifyTrackId"
WHERE ut."userId" = :userId
  AND st."releaseDate" IS NOT NULL
GROUP BY decade
ORDER BY decade
```

---

## UI/UX Notes

### Visual Style
- Use existing Mantine components
- Cards for each section
- Charts: Consider Recharts or Mantine Charts
- Keep it clean - don't overwhelm with data

### Empty States
- If no genres enriched: "We're still analyzing your library's genres. Check back soon!"
- If no audio features: "Audio analysis in progress..."
- Always show what we CAN show (overview stats are always available)

### Mobile Responsive
- Stack sections vertically
- Charts should resize gracefully
- Quick actions as horizontal scroll on mobile

---

## Future: Onboarding Integration

Once the Insights page exists, onboarding changes become:

1. After OAuth, redirect to `/insights` instead of current sync modal
2. Page shows progressive reveals as enrichment happens
3. Gate rest of platform until threshold (300 enriched tracks) is reached
4. Add "Continue to app" button that appears once threshold is hit

This is Phase 2 - not part of initial implementation.

---

## Implementation Order

### Phase 1a: Backend
1. Create `GET /library/insights` endpoint
2. Implement Kysely aggregation queries
3. Add caching layer
4. Create `POST /playlists/quick-create` endpoint

### Phase 1b: Frontend
1. Create `/insights` route
2. Build LibraryOverview section (no enrichment needed)
3. Build GenreBreakdown section
4. Build AudioProfile section
5. Build DecadeBreakdown section
6. Build QuickPlaylistActions section
7. Add to navigation

### Phase 1c: Polish
1. Empty states and loading skeletons
2. Mobile responsiveness
3. Chart animations

### Phase 2: Onboarding (future)
1. Redirect new users to insights page
2. Add threshold gating logic
3. Add "Continue to app" flow
4. Update `hasCompletedOnboarding` logic

---

## Open Questions

1. **Chart library**: Recharts vs Mantine Charts vs something else?
2. **Navigation placement**: Top nav? Sidebar item? Both?
3. **Playlist naming**: Auto-name like "Gym Playlist" or prompt user?
4. **Sharing**: Should users be able to share their insights page? (future feature)
