# Spotlib Desktop Companion App

A lightweight desktop companion application for Spotlib that enables global hotkey-based track rating without breaking focus from your current work.

## Problem Statement

When rating tracks in Spotlib's fullscreen mode while working, users often miss the window to rate a track before it changes. The current recovery flow (back → rate → forward) is disruptive. Additionally, by the time you realize you missed rating, you may not remember how you felt about the track.

This companion app solves this by:
1. Registering system-wide global hotkeys that work even when the app isn't focused
2. Displaying the currently playing track so you always know what you're rating
3. Sending ratings directly to the Spotlib API

## Core Features

### 1. Global Hotkeys
- `Cmd+Shift+1` through `Cmd+Shift+5` - Rate current track (1-5 stars)
- `Cmd+Shift+0` - Clear rating / mark as unrated
- Hotkeys must work system-wide, even when other applications have focus

### 2. Current Track Display
- Show album art, track name, and artist
- Update automatically when the track changes (poll Spotify API or use webhooks)
- Visual feedback when a rating is submitted (brief flash/animation)

### 3. Menubar/Tray Integration
- Lives in the system menubar (Mac) or system tray (Windows)
- Click to expand and see current track + rating interface
- Minimal footprint when collapsed

### 4. Optional Floating Widget
- Small, always-on-top mini player
- Can be toggled on/off
- Draggable to any screen position
- Shows: album art thumbnail, track name (truncated), current rating, 5-star rating buttons

### 5. Track Change Notifications (Optional)
- Subtle system notification when a new track starts
- Can be disabled in settings
- Notification shows: album art, track name, artist

## Technical Requirements

### Authentication

The Spotlib backend supports **API key authentication** - a simple, stateless approach perfect for desktop apps.

**How it works:**
1. User copies their API key from Spotlib web app settings
2. Paste it into the desktop companion app (one-time setup)
3. All API requests include the key in the `X-API-Key` header

**Getting the API key:**
- Users find their API key at: Spotlib Web App → Settings → API Key
- The key looks like: `sk_<base64-encoded-user-id>_<signature>`
- The key is deterministic - same user always gets the same key
- No expiration, no refresh needed

### API Integration

#### Spotlib Backend API
Base URL: Configurable (default: `http://localhost:3000` for dev, production URL for release)

**Authentication:**
All requests must include the API key header:
```
X-API-Key: sk_xxxxx_xxxxxxxxxxxxxxxx
```

Or as a Bearer token:
```
Authorization: Bearer sk_xxxxx_xxxxxxxxxxxxxxxx
```

**Get current playback state (includes Spotify access token):**
```
GET /playback/current
```
Returns current track info and playback state. The backend handles Spotify token management.

**Get library track by Spotify ID:**
```
GET /library/tracks/spotify/{spotifyTrackId}
```
Returns track details including current rating if it exists.

**Update track rating:**
```
PUT /library/tracks/{trackId}/rating
Content-Type: application/json

{
  "rating": 4.5  // 0.5 to 5 in 0.5 increments
}
```

**Note:** The track must exist in the user's library to be rated. If the current Spotify track isn't in the library, show a visual indicator and disable rating.

### Data Flow
1. Call Spotlib `/playback/current` to get current track (backend handles Spotify auth)
2. Check if track exists in Spotlib library (cache this lookup)
3. If exists: enable rating, show current rating if any
4. On hotkey press: send rating to Spotlib API
5. Show success/error feedback

## UI/UX Specifications

### Menubar Popover (Expanded State)
```
┌─────────────────────────────────┐
│  ┌───────┐                      │
│  │       │  Track Name          │
│  │ Album │  Artist Name         │
│  │  Art  │  Album Name          │
│  └───────┘                      │
│                                 │
│  ☆ ☆ ☆ ☆ ☆   (clickable)       │
│                                 │
│  ─────────────────────────────  │
│  ⚙ Settings    ⌘⇧1-5 to rate   │
└─────────────────────────────────┘
```

### Floating Widget (Minimal Mode)
```
┌─────────────────────────────┐
│ [Art] Track Name - Artist   │
│       ★ ★ ★ ★ ☆             │
└─────────────────────────────┘
```

### Visual States
- **Track in library, unrated**: Empty stars, full opacity
- **Track in library, rated**: Filled stars showing rating
- **Track not in library**: Grayed out, "Not in library" text, rating disabled
- **Rating submitted**: Brief green flash/checkmark animation
- **Error**: Brief red flash, error icon

### Settings Panel
- API key input field (paste from Spotlib web app)
- Connection status indicator
- Spotlib backend URL configuration (for self-hosted instances)
- Global hotkey customization
- Floating widget toggle
- Notifications toggle
- Launch at login toggle
- Hotkey modifier key selection (Cmd+Shift, Ctrl+Alt, etc.)

## Recommended Tech Stack

### Option A: Tauri (Recommended)
- **Framework**: Tauri v2
- **Frontend**: React + TypeScript (or Svelte for lighter bundle)
- **Styling**: Tailwind CSS
- **Pros**: Lightweight (~10-20MB), fast, cross-platform, Rust backend for native features
- **Global Hotkeys**: Use `tauri-plugin-global-shortcut`

### Option B: Electron
- **Framework**: Electron
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Pros**: Larger ecosystem, more examples available
- **Cons**: Heavier bundle size (~100MB+)
- **Global Hotkeys**: Use `globalShortcut` module

### Option C: Native Swift (Mac only)
- **Framework**: SwiftUI
- **Pros**: Smallest footprint, best macOS integration
- **Cons**: Mac only, different language/ecosystem
- **Global Hotkeys**: Use `CGEvent.tapCreate` or `MASShortcut` library

## Project Structure (Tauri Example)

```
spotlib-companion/
├── src/                    # Frontend (React/TypeScript)
│   ├── components/
│   │   ├── TrackDisplay.tsx
│   │   ├── RatingStars.tsx
│   │   ├── FloatingWidget.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useSpotifyPlayback.ts
│   │   ├── useSpotlibApi.ts
│   │   └── useGlobalHotkeys.ts
│   ├── services/
│   │   ├── spotify.ts
│   │   └── spotlib.ts
│   ├── stores/
│   │   └── appStore.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/              # Backend (Rust)
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```

## Authentication Flow

### Initial Setup (Simple!)
1. User launches companion app for the first time
2. App shows "Enter your API key" screen with instructions
3. User opens Spotlib web app → Settings → copies their API key
4. User pastes API key into companion app
5. App validates the key by calling `/auth/profile`
6. If valid: store locally, proceed to main UI
7. If invalid: show error, prompt to try again

### No Token Refresh Needed
- API keys are stateless and don't expire
- If key becomes invalid (user regenerates it), show re-authentication prompt

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No internet connection | Show offline indicator, queue ratings for retry |
| Spotify not playing | Show "No track playing" state |
| Track not in library | Show "Not in library" badge, disable rating |
| API error on rating | Show error toast, offer retry |
| Invalid API key (401) | Prompt to re-enter API key |

## Future Enhancements (Out of Scope for V1)

- Half-star ratings via modifier key (e.g., `Cmd+Shift+Alt+3` for 3.5)
- Quick tagging via hotkeys
- Mini playback controls (play/pause, next, previous)
- "Rate last track" hotkey with audio snippet preview
- Listening history view
- Multiple Spotlib account support

## Success Criteria

1. User can rate the currently playing track without leaving their current application
2. Rating submission takes less than 500ms from hotkey press to visual confirmation
3. App uses minimal system resources (< 50MB RAM, < 1% CPU when idle)
4. App starts automatically on system login (optional)
5. Hotkeys never conflict with common application shortcuts

## Development Notes

### Spotlib API Authentication
API key authentication is already implemented in the Spotlib backend. The desktop app just needs to:
1. Accept API key input from user
2. Include `X-API-Key` header in all requests
3. Handle 401 responses by prompting for a new key

### Environment Variable
The backend requires `API_KEY_SECRET` environment variable to be set. This is the secret used to sign/verify API keys.

### Polling Strategy
- Poll `/playback/current` every 3-5 seconds for track changes
- Consider using exponential backoff on errors
- Cache track library lookups to reduce API calls

### Testing
- Test global hotkeys with various applications in focus (IDEs, browsers, etc.)
- Test with different Spotify playback states (playing, paused, no active device)
- Test offline scenarios and invalid API key flows
