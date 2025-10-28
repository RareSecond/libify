# Backend-Driven Playback Integration Guide

## Overview

The backend now manages queue generation and playback orchestration, while Spotify handles the actual playback transitions. This architecture provides:

- **Intelligent queue generation** with full database context
- **Multi-device consistency** - same queue across all devices
- **Automatic queue replenishment** via background monitoring
- **Better security** - Spotify tokens stay server-side
- **Smart features** - shuffle, context-aware queuing, analytics

## Architecture

```
User clicks "Play"
  → Backend generates queue and starts first track
  → Returns 200 OK (user hears music immediately)
  → Backend sends remaining tracks to Spotify queue (background)
  → Background job monitors queue depth and replenishes as needed
  → Spotify handles all playback transitions automatically
```

## API Endpoints

### 1. Start Playback

```http
POST /api/playback/play
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "contextType": "LIBRARY",  // TRACK | PLAYLIST | ALBUM | ARTIST | LIBRARY | SMART_PLAYLIST
  "contextId": "optional-id",
  "contextName": "My Library",
  "startPosition": 0,
  "shuffle": true
}
```

**Response:**
```json
{
  "queueId": "queue-uuid",
  "currentTrack": {
    "spotifyUri": "spotify:track:abc123",
    "spotifyId": "abc123",
    "title": "Song Title",
    "artist": "Artist Name"
  },
  "queueLength": 100,
  "message": "Playback started"
}
```

### 2. Skip to Next Track

```http
POST /api/playback/next
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Skipped to next track"
}
```

### 3. Pause Playback

```http
POST /api/playback/pause
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Playback paused"
}
```

### 4. Resume Playback

```http
POST /api/playback/resume
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Playback resumed"
}
```

### 5. Get Current Queue

```http
GET /api/playback/queue
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "queueId": "queue-uuid",
  "contextType": "LIBRARY",
  "contextId": null,
  "contextName": "My Library",
  "currentPosition": 5,
  "shuffle": true,
  "totalTracks": 100,
  "tracks": ["spotify:track:abc123", "..."]
}
```

## Frontend Integration

### Current State
The frontend currently uses client-side queue management via the Spotify Web Playback SDK. This works but has limitations (see main discussion).

### Recommended Migration Path

**Option 1: Full Backend Integration (Recommended)**
Replace client-side queue management with backend API calls:

```typescript
// Example: Play library with shuffle
const playLibrary = async (shuffle: boolean) => {
  const response = await fetch('/api/playback/play', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contextType: 'LIBRARY',
      shuffle,
    }),
  });

  const data = await response.json();
  console.log(`Started playing: ${data.currentTrack.title}`);
};
```

**Option 2: Hybrid Approach**
Keep Web Playback SDK for UI controls, use backend for queue management:

```typescript
const playContext = async (context: PlayContext) => {
  // Backend generates and queues tracks
  const queueResponse = await backendAPI.playback.play(context);

  // Web SDK handles UI/display
  await spotifyWebSDK.updateDisplayTrack(queueResponse.currentTrack);
};
```

## Context Types

### TRACK
Play a single track (no queue).

```json
{
  "contextType": "TRACK",
  "contextId": "spotify-track-id"
}
```

### LIBRARY
Play entire user library.

```json
{
  "contextType": "LIBRARY",
  "shuffle": true
}
```

### ALBUM
Play all tracks from an album.

```json
{
  "contextType": "ALBUM",
  "contextId": "album-database-id",
  "contextName": "Album Name"
}
```

### ARTIST
Play all tracks from an artist.

```json
{
  "contextType": "ARTIST",
  "contextId": "artist-database-id",
  "contextName": "Artist Name"
}
```

### PLAYLIST / SMART_PLAYLIST
Play tracks from a playlist.

```json
{
  "contextType": "PLAYLIST",
  "contextId": "playlist-id",
  "contextName": "My Awesome Playlist"
}
```

## Background Queue Monitoring

The system automatically monitors active queues every 30 seconds:

- Checks Spotify queue depth
- If < 10 tracks remaining, adds up to 20 more tracks
- Only monitors queues played in the last hour
- Handles rate limiting and errors gracefully

This ensures seamless playback without gaps.

## Database Schema

```prisma
model PlaybackQueue {
  id               String      @id @default(uuid())
  userId           String
  contextType      ContextType
  contextId        String?
  contextName      String?
  tracks           Json        // Array of Spotify URIs
  currentPosition  Int         @default(0)
  shuffle          Boolean     @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  lastPlayedAt     DateTime?
  isActive         Boolean     @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Future Enhancements

1. **Smart Queue Generation**
   - Analyze audio features for similar songs
   - Consider play history to avoid repetition
   - Time-based recommendations (morning vs evening)

2. **Cross-Device Sync**
   - Real-time queue updates via WebSockets
   - Sync position across devices

3. **Queue Editing**
   - Reorder tracks
   - Remove tracks
   - Add tracks to queue

4. **Analytics**
   - Track which contexts are most played
   - Optimize queue generation based on listening patterns

## Testing

### Manual Testing Steps

1. **Start Playback**
   ```bash
   curl -X POST http://127.0.0.1:3000/api/playback/play \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"contextType":"LIBRARY","shuffle":true}'
   ```

2. **Check Queue**
   ```bash
   curl http://127.0.0.1:3000/api/playback/queue \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Skip Track**
   ```bash
   curl -X POST http://127.0.0.1:3000/api/playback/next \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Verify on Spotify**
   - Open Spotify app
   - Check that tracks are playing
   - Verify queue is populated

## Notes

- Backend generates queue immediately but sends to Spotify in background
- First track starts within ~500ms
- Queue replenishment is transparent to the user
- Spotify tokens never leave the backend
- Only one active queue per user (deactivates old queues automatically)
