# SpotLib - Advanced Spotify Library Management System

## Project Overview

SpotLib is an advanced library management system for Spotify that provides users with granular control over their music collection. Drawing inspiration from iTunes' powerful library management features, SpotLib extends Spotify's capabilities by introducing user-defined tags, detailed play count tracking, star ratings, and intelligent playlist creation based on multiple criteria.

## Core Features

### 1. Track Tagging System
- **Multi-tag Support**: Users can assign multiple tags to any track (e.g., "workout", "summer", "chill", "nostalgic")
- **Tag Management**: Create, edit, delete, and organize tags
- **Tag-based Filtering**: Browse library by tags or tag combinations
- **Bulk Tagging**: Apply tags to multiple tracks simultaneously

### 2. Play Count Tracking
- **Explicit Tracking**: Accurate play count for each track in user's library
- **Historical Data**: Track play patterns over time
- **Play Statistics**: View most/least played tracks, play trends
- **Integration**: Sync with Spotify's play history while maintaining local counts

### 3. Star Rating System
- **5-Star Scale**: Rate tracks from 1-5 stars
- **Quick Rating**: Rate directly from player or library view
- **Rating Analytics**: View average ratings, rating distribution
- **Bulk Rating**: Rate multiple tracks at once

### 4. Smart Playlists
- **Dynamic Creation**: Playlists that automatically update based on criteria
- **Multiple Criteria**: Combine tags, ratings, play counts, date added, genre, etc.
- **Complex Logic**: Support AND/OR operations between criteria
- **Examples**:
  - "5-star tracks tagged 'workout' played more than 10 times"
  - "Added in last 30 days with rating ≥ 4 stars"
  - "Tagged 'nostalgic' OR 'throwback' with play count < 5"

### 5. Enhanced Library Management
- **Advanced Search**: Search by any combination of metadata, tags, ratings
- **Sorting Options**: Sort by play count, rating, date added, etc.
- **Library Statistics**: Overview of library size, play patterns, ratings
- **Export/Import**: Backup and restore library metadata

## Technical Architecture

### Backend (NestJS)
- **Database Models**:
  - Extended User model with Spotify integration
  - Track model with Spotify track ID reference
  - Tag model with many-to-many relationship to tracks
  - Rating model linking users and tracks
  - PlayHistory model for tracking plays
  - SmartPlaylist model with criteria storage
  
- **API Endpoints**:
  - `/tracks` - CRUD operations for track metadata
  - `/tags` - Tag management and track associations
  - `/ratings` - Rating submission and retrieval
  - `/play-history` - Record and query play counts
  - `/playlists/smart` - Smart playlist creation and management
  - `/library/stats` - Library analytics and statistics

- **Services**:
  - SpotifyService - Integration with Spotify Web API
  - LibraryService - Core library management logic
  - PlaylistService - Smart playlist generation
  - SyncService - Synchronization with Spotify data

### Frontend (React + Vite)
- **Views**:
  - Library Dashboard - Overview and quick actions
  - Track Browser - Browse with filters, tags, ratings
  - Tag Manager - Create and organize tags
  - Smart Playlist Builder - Visual criteria builder
  - Analytics Dashboard - Play patterns and statistics
  - Settings - Sync preferences, export options

- **Components**:
  - TrackList with inline rating/tagging
  - TagSelector with autocomplete
  - RatingWidget (star display/input)
  - SmartPlaylistCriteria builder
  - PlayCountDisplay with history graph

### Data Synchronization
- **Spotify Integration**:
  - OAuth flow for authentication (existing)
  - Periodic sync of user's Spotify library
  - Real-time play tracking via Spotify API
  - Two-way playlist sync (optional)

- **Local Storage**:
  - Cache frequently accessed data
  - Offline support for viewing library
  - Queue sync operations when offline

## User Experience Flow

1. **Onboarding**:
   - Login with Spotify (existing)
   - Initial library import from Spotify
   - Introduction to tagging and rating features

2. **Daily Usage**:
   - View personalized dashboard
   - Quick rate/tag while listening
   - Browse by tags or smart playlists
   - Track play statistics update automatically

3. **Library Organization**:
   - Bulk tag sessions for organizing
   - Create smart playlists for different moods/activities
   - Export library data for backup

## Technical Requirements

### Performance
- Efficient handling of large libraries (10,000+ tracks)
- Pagination for track lists
- Optimized database queries with proper indexing
- Background sync processes

### Security
- Secure storage of Spotify tokens (existing)
- User data isolation
- Rate limiting for API endpoints
- Data export encryption option

### Scalability
- Database design supporting millions of tracks/ratings
- Caching layer for frequently accessed data
- Queue system for bulk operations
- Horizontal scaling capability

## Development Phases

### Phase 1: Core Data Models
- Extend database schema
- Create track, tag, rating, and play history models
- Basic CRUD APIs
- Spotify library sync

### Phase 2: Tagging System
- Tag management UI
- Track-tag associations
- Bulk tagging operations
- Tag-based filtering

### Phase 3: Ratings & Play Counts
- Rating widget implementation
- Play count tracking integration
- Statistics calculations
- History visualization

### Phase 4: Smart Playlists
- Criteria builder UI
- Playlist generation engine
- Auto-update mechanism
- Spotify playlist sync

### Phase 5: Analytics & Polish
- Analytics dashboard
- Performance optimizations
- Export/import functionality
- Mobile responsive design

## Success Metrics

- User engagement: Daily active users
- Feature adoption: % using tags, ratings, smart playlists
- Library growth: Average tags/ratings per user
- Performance: Page load times, sync speed
- User satisfaction: Feature request completion

## Future Enhancements

- Mobile app with offline support
- Social features (share playlists, compare libraries)
- AI-powered tag suggestions
- Integration with other music services
- Advanced analytics (listening patterns, mood tracking)
- Collaborative playlists with criteria