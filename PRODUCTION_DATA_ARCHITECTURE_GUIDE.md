# Production Data Architecture Guide

This guide addresses critical data architecture issues identified in the Spotlib application that need to be resolved before production deployment.

## 🔴 Critical Issues & Solutions

### 1. N+1 Query Performance

**Problem**: Deep nested includes cause hundreds of database queries when loading playlists with many tracks.

```typescript
// BAD: Current implementation
const tracks = await this.prisma.userTrack.findMany({
  include: {
    spotifyTrack: {
      include: {
        album: { include: { artist: true } },
        artist: true,
      },
    },
    tags: { include: { tag: true } },
  },
});
```

**Solution**: Use Prisma's query optimization or raw SQL

```typescript
// GOOD: Option 1 - Selective loading with findFirst for counts
async getPlaylistTracksOptimized(playlistId: string, page: number) {
  // First, get track IDs only
  const trackIds = await this.prisma.playlistTrack.findMany({
    where: { playlistId },
    select: { userTrackId: true },
    skip: (page - 1) * 50,
    take: 50,
  });

  // Then batch load with minimal nesting
  const tracks = await this.prisma.userTrack.findMany({
    where: { id: { in: trackIds.map(t => t.userTrackId) } },
    include: {
      spotifyTrack: {
        select: {
          id: true,
          name: true,
          duration: true,
          album: { select: { id: true, name: true, imageUrl: true } },
          artist: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Load tags separately if needed
  const trackTags = await this.prisma.trackTag.findMany({
    where: { userTrackId: { in: trackIds.map(t => t.userTrackId) } },
    include: { tag: true },
  });

  // Combine in memory
  return tracks.map(track => ({
    ...track,
    tags: trackTags.filter(tt => tt.userTrackId === track.id),
  }));
}

// GOOD: Option 2 - Raw SQL for complex queries
async getPlaylistTracksRaw(playlistId: string) {
  return this.prisma.$queryRaw`
    SELECT 
      ut.*,
      st.name as track_name,
      st.duration,
      al.name as album_name,
      ar.name as artist_name,
      ARRAY_AGG(DISTINCT t.name) as tags
    FROM "PlaylistTrack" pt
    JOIN "UserTrack" ut ON pt."userTrackId" = ut.id
    JOIN "SpotifyTrack" st ON ut."spotifyTrackId" = st.id
    JOIN "SpotifyAlbum" al ON st."albumId" = al.id
    JOIN "SpotifyArtist" ar ON st."artistId" = ar.id
    LEFT JOIN "TrackTag" tt ON ut.id = tt."userTrackId"
    LEFT JOIN "Tag" t ON tt."tagId" = t.id
    WHERE pt."playlistId" = ${playlistId}
    GROUP BY ut.id, st.id, al.id, ar.id
  `;
}
```

### 2. Missing Composite Indexes

**Problem**: Smart playlist queries scan full tables due to missing composite indexes.

**Solution**: Add indexes for common query patterns

```prisma
// schema.prisma additions
model UserTrack {
  // ... existing fields ...
  
  @@index([userId, rating, addedAt], name: "idx_user_rating_added")
  @@index([userId, totalPlayCount, lastPlayedAt], name: "idx_user_plays")
  @@index([userId, lastPlayedAt], name: "idx_user_last_played")
  @@index([spotifyTrackId, userId], name: "idx_track_user")
}

model PlayHistory {
  // ... existing fields ...
  
  @@index([userTrackId, playedAt(sort: Desc)], name: "idx_track_played_desc")
  @@index([playedAt], name: "idx_played_at")
}

model TrackTag {
  // ... existing fields ...
  
  @@index([tagId, userTrackId], name: "idx_tag_track")
}
```

**Migration**: Add indexes with CONCURRENTLY to avoid locking

```sql
-- Migration: add_performance_indexes
CREATE INDEX CONCURRENTLY "idx_user_rating_added" ON "UserTrack"("userId", "rating", "addedAt");
CREATE INDEX CONCURRENTLY "idx_user_plays" ON "UserTrack"("userId", "totalPlayCount", "lastPlayedAt");
CREATE INDEX CONCURRENTLY "idx_user_last_played" ON "UserTrack"("userId", "lastPlayedAt");
CREATE INDEX CONCURRENTLY "idx_track_user" ON "UserTrack"("spotifyTrackId", "userId");
CREATE INDEX CONCURRENTLY "idx_track_played_desc" ON "PlayHistory"("userTrackId", "playedAt" DESC);
CREATE INDEX CONCURRENTLY "idx_played_at" ON "PlayHistory"("playedAt");
CREATE INDEX CONCURRENTLY "idx_tag_track" ON "TrackTag"("tagId", "userTrackId");

-- Analyze tables after index creation
ANALYZE "UserTrack";
ANALYZE "PlayHistory";
ANALYZE "TrackTag";
```

### 3. Unbounded PlayHistory Growth

**Problem**: PlayHistory table grows forever with no archival strategy.

**Option 1**: Time-based partitioning (PostgreSQL 11+)

```sql
-- Convert PlayHistory to partitioned table
BEGIN;

-- Rename existing table
ALTER TABLE "PlayHistory" RENAME TO "PlayHistory_old";

-- Create partitioned table
CREATE TABLE "PlayHistory" (
  "id" TEXT NOT NULL,
  "userTrackId" TEXT NOT NULL,
  "playedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id", "playedAt")
) PARTITION BY RANGE ("playedAt");

-- Create indexes
CREATE INDEX "idx_playhistory_usertrack" ON "PlayHistory" ("userTrackId", "playedAt" DESC);

-- Create monthly partitions
CREATE TABLE "PlayHistory_2024_01" PARTITION OF "PlayHistory"
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE "PlayHistory_2024_02" PARTITION OF "PlayHistory"
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... create more partitions ...

-- Copy data
INSERT INTO "PlayHistory" SELECT * FROM "PlayHistory_old";

-- Drop old table
DROP TABLE "PlayHistory_old";

COMMIT;
```

**Option 2**: Archive old data with service

```typescript
// play-history-archiver.service.ts
@Injectable()
export class PlayHistoryArchiverService {
  constructor(private prisma: PrismaService) {}

  @Cron('0 2 * * *') // Run at 2 AM daily
  async archiveOldPlayHistory() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Move to archive table
    await this.prisma.$transaction(async (tx) => {
      // Create archive records
      const oldRecords = await tx.playHistory.findMany({
        where: { playedAt: { lt: sixMonthsAgo } },
        take: 10000, // Batch size
      });

      if (oldRecords.length > 0) {
        await tx.playHistoryArchive.createMany({
          data: oldRecords,
        });

        // Delete from main table
        await tx.playHistory.deleteMany({
          where: {
            id: { in: oldRecords.map(r => r.id) },
          },
        });
      }
    });
  }

  // Query that checks both tables
  async getFullHistory(userTrackId: string, from?: Date, to?: Date) {
    const [recent, archived] = await Promise.all([
      this.prisma.playHistory.findMany({
        where: { userTrackId, playedAt: { gte: from, lte: to } },
      }),
      from && from < sixMonthsAgo 
        ? this.prisma.playHistoryArchive.findMany({
            where: { userTrackId, playedAt: { gte: from, lte: to } },
          })
        : [],
    ]);

    return [...recent, ...archived].sort((a, b) => 
      b.playedAt.getTime() - a.playedAt.getTime()
    );
  }
}
```

### 4. Genre Array Anti-Pattern

**Problem**: `genres String[]` can't be indexed properly for efficient queries.

**Solution**: Normalize into proper many-to-many relationship

```prisma
// schema.prisma changes
model Genre {
  id        String   @id @default(cuid())
  name      String   @unique
  artists   ArtistGenre[]
  
  @@index([name])
}

model ArtistGenre {
  artist    SpotifyArtist @relation(fields: [artistId], references: [id], onDelete: Cascade)
  artistId  String
  genre     Genre         @relation(fields: [genreId], references: [id], onDelete: Cascade)
  genreId   String
  
  @@id([artistId, genreId])
  @@index([genreId, artistId])
}

model SpotifyArtist {
  // Remove: genres String[]
  // Add:
  genres    ArtistGenre[]
}
```

**Migration with data transformation**:

```typescript
// migration script
export async function migrateGenresToNormalized(prisma: PrismaService) {
  // Step 1: Create all unique genres
  const artists = await prisma.spotifyArtist.findMany({
    select: { id: true, genres: true },
  });

  const allGenres = new Set<string>();
  artists.forEach(artist => {
    artist.genres.forEach(genre => allGenres.add(genre));
  });

  // Bulk create genres
  await prisma.genre.createMany({
    data: Array.from(allGenres).map(name => ({ name })),
    skipDuplicates: true,
  });

  // Step 2: Create artist-genre relationships
  const genreMap = await prisma.genre.findMany()
    .then(genres => new Map(genres.map(g => [g.name, g.id])));

  const artistGenreData = [];
  for (const artist of artists) {
    for (const genreName of artist.genres) {
      const genreId = genreMap.get(genreName);
      if (genreId) {
        artistGenreData.push({
          artistId: artist.id,
          genreId,
        });
      }
    }
  }

  // Batch insert relationships
  const batchSize = 1000;
  for (let i = 0; i < artistGenreData.length; i += batchSize) {
    await prisma.artistGenre.createMany({
      data: artistGenreData.slice(i, i + batchSize),
      skipDuplicates: true,
    });
  }
}
```

**Optimized genre queries**:

```typescript
// Find all tracks of a specific genre
async getTracksByGenre(userId: string, genreName: string) {
  return this.prisma.userTrack.findMany({
    where: {
      userId,
      spotifyTrack: {
        artist: {
          genres: {
            some: {
              genre: { name: genreName },
            },
          },
        },
      },
    },
    include: {
      spotifyTrack: {
        include: {
          artist: true,
          album: true,
        },
      },
    },
  });
}
```

### 5. Race Conditions in Aggregation Updates

**Problem**: Concurrent updates to stats can cause incorrect counts.

**Solution**: Use transactions and atomic operations

```typescript
// aggregation.service.ts improvements
async updateStatsTransactional(userId: string, trackId: string) {
  await this.prisma.$transaction(async (tx) => {
    // Lock the user track to prevent concurrent updates
    const userTrack = await tx.userTrack.findUnique({
      where: { id: trackId },
      include: { spotifyTrack: true },
    });

    if (!userTrack) return;

    // Use upsert with atomic increments
    await tx.userArtist.upsert({
      where: {
        userId_artistId: {
          userId,
          artistId: userTrack.spotifyTrack.artistId,
        },
      },
      create: {
        userId,
        artistId: userTrack.spotifyTrack.artistId,
        totalPlayTime: userTrack.spotifyTrack.duration,
        trackCount: 1,
        totalPlayCount: userTrack.totalPlayCount,
      },
      update: {
        // Atomic operations prevent race conditions
        totalPlayTime: { increment: userTrack.spotifyTrack.duration },
        totalPlayCount: { increment: 1 },
      },
    });

    // Same for album stats
    await tx.userAlbum.upsert({
      where: {
        userId_albumId: {
          userId,
          albumId: userTrack.spotifyTrack.albumId,
        },
      },
      create: {
        userId,
        albumId: userTrack.spotifyTrack.albumId,
        totalPlayTime: userTrack.spotifyTrack.duration,
        trackCount: 1,
        totalPlayCount: userTrack.totalPlayCount,
      },
      update: {
        totalPlayTime: { increment: userTrack.spotifyTrack.duration },
        totalPlayCount: { increment: 1 },
      },
    });
  }, {
    isolationLevel: 'RepeatableRead', // Prevent phantom reads
    timeout: 10000, // 10 second timeout
  });
}

// For bulk operations, use advisory locks
async bulkUpdateStats(userId: string, trackIds: string[]) {
  await this.prisma.$transaction(async (tx) => {
    // Acquire advisory lock for this user
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${userId.hashCode()})`;

    // Now safe to do bulk updates
    for (const trackId of trackIds) {
      await this.updateStatsInTransaction(tx, userId, trackId);
    }
  });
}
```

**Add database constraints**:

```sql
-- Migration: add_check_constraints
ALTER TABLE "UserTrack" 
  ADD CONSTRAINT "chk_play_count_positive" CHECK ("totalPlayCount" >= 0),
  ADD CONSTRAINT "chk_rating_valid" CHECK ("rating" >= 0 AND "rating" <= 5 AND ("rating" * 2) = FLOOR("rating" * 2));

ALTER TABLE "UserArtist"
  ADD CONSTRAINT "chk_artist_stats_positive" CHECK (
    "totalPlayCount" >= 0 AND 
    "totalPlayTime" >= 0 AND 
    "trackCount" >= 0
  );
```

### 6. JSON Criteria Column

**Problem**: Can't index or validate JSON criteria for smart playlists.

**Solution**: Normalize into structured tables

```prisma
// schema.prisma - New structured approach
model SmartPlaylist {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  rules       PlaylistRule[]
  ruleLogic   RuleLogic @default(AND) // AND or OR
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
}

enum RuleLogic {
  AND
  OR
}

model PlaylistRule {
  id           String       @id @default(cuid())
  playlistId   String
  playlist     SmartPlaylist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  field        RuleField
  operator     RuleOperator
  value        String       // Store as string, parse based on field type
  valueType    ValueType    // NUMBER, STRING, DATE, ARRAY
  sequence     Int          // Order of rules
  
  @@index([playlistId, sequence])
  @@index([field, operator]) // For rule analysis
}

enum RuleField {
  RATING
  PLAY_COUNT
  LAST_PLAYED
  ADDED_AT
  GENRE
  ARTIST_NAME
  ALBUM_NAME
  TRACK_NAME
  TAG
  DURATION
}

enum RuleOperator {
  EQUALS
  NOT_EQUALS
  GREATER_THAN
  LESS_THAN
  GREATER_EQUAL
  LESS_EQUAL
  CONTAINS
  NOT_CONTAINS
  IN
  NOT_IN
  BETWEEN
}

enum ValueType {
  NUMBER
  STRING
  DATE
  ARRAY
}
```

**Query builder implementation**:

```typescript
// smart-playlist.service.ts
export class SmartPlaylistService {
  async buildWhereClause(playlistId: string): Promise<Prisma.UserTrackWhereInput> {
    const playlist = await this.prisma.smartPlaylist.findUnique({
      where: { id: playlistId },
      include: { rules: { orderBy: { sequence: 'asc' } } },
    });

    if (!playlist || playlist.rules.length === 0) {
      return {};
    }

    const conditions = playlist.rules.map(rule => 
      this.buildRuleCondition(rule)
    );

    return playlist.ruleLogic === 'AND' 
      ? { AND: conditions }
      : { OR: conditions };
  }

  private buildRuleCondition(rule: PlaylistRule): Prisma.UserTrackWhereInput {
    switch (rule.field) {
      case 'RATING':
        return this.buildNumberCondition('rating', rule);
      
      case 'PLAY_COUNT':
        return this.buildNumberCondition('totalPlayCount', rule);
      
      case 'LAST_PLAYED':
        return this.buildDateCondition('lastPlayedAt', rule);
      
      case 'GENRE':
        return {
          spotifyTrack: {
            artist: {
              genres: {
                some: {
                  genre: this.buildStringCondition('name', rule),
                },
              },
            },
          },
        };
      
      case 'TAG':
        return {
          tags: {
            some: {
              tag: this.buildStringCondition('name', rule),
            },
          },
        };
      
      // ... more field handlers
    }
  }

  private buildNumberCondition(field: string, rule: PlaylistRule) {
    const value = parseFloat(rule.value);
    
    switch (rule.operator) {
      case 'EQUALS': return { [field]: value };
      case 'GREATER_THAN': return { [field]: { gt: value } };
      case 'LESS_THAN': return { [field]: { lt: value } };
      case 'BETWEEN': {
        const [min, max] = rule.value.split(',').map(parseFloat);
        return { [field]: { gte: min, lte: max } };
      }
      // ... more operators
    }
  }

  // Optimized query with proper indexes
  async getPlaylistTracks(playlistId: string, limit = 50) {
    const whereClause = await this.buildWhereClause(playlistId);
    
    // Use index hints for complex queries
    return this.prisma.$queryRaw`
      SELECT ut.*, st.name, sa.name as album_name, sar.name as artist_name
      FROM "UserTrack" ut
      INNER JOIN "SpotifyTrack" st ON ut."spotifyTrackId" = st.id
      INNER JOIN "SpotifyAlbum" sa ON st."albumId" = sa.id
      INNER JOIN "SpotifyArtist" sar ON st."artistId" = sar.id
      WHERE ${Prisma.sql(whereClause)}
      ORDER BY ut."addedAt" DESC
      LIMIT ${limit}
    `;
  }
}
```

### 7. Memory-Heavy Sync Optimization

**Problem**: Loading entire artist maps into memory causes OOM errors.

**Solution**: Stream processing and batch operations

```typescript
// library-sync.service.ts improvements
export class LibrarySyncService {
  private readonly BATCH_SIZE = 50;
  private readonly STREAM_CHUNK_SIZE = 100;

  async syncUserLibraryStreaming(userId: string) {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch small batch from Spotify
      const batch = await this.spotify.getMySavedTracks({
        limit: this.BATCH_SIZE,
        offset,
      });

      if (batch.items.length === 0) {
        hasMore = false;
        break;
      }

      // Process batch without loading everything
      await this.processBatchOptimized(userId, batch.items);

      offset += this.BATCH_SIZE;
      hasMore = batch.next !== null;

      // Prevent memory buildup
      if (global.gc) global.gc();
    }
  }

  private async processBatchOptimized(userId: string, tracks: SpotifyTrack[]) {
    // Extract unique IDs
    const artistIds = [...new Set(tracks.map(t => t.track.artists[0].id))];
    const albumIds = [...new Set(tracks.map(t => t.track.album.id))];

    // Batch check what exists
    const [existingArtists, existingAlbums] = await Promise.all([
      this.prisma.spotifyArtist.findMany({
        where: { id: { in: artistIds } },
        select: { id: true },
      }),
      this.prisma.spotifyAlbum.findMany({
        where: { id: { in: albumIds } },
        select: { id: true },
      }),
    ]);

    const existingArtistIds = new Set(existingArtists.map(a => a.id));
    const existingAlbumIds = new Set(existingAlbums.map(a => a.id));

    // Prepare batch inserts
    const newArtists = [];
    const newAlbums = [];
    const userTracks = [];

    for (const item of tracks) {
      const track = item.track;
      const artist = track.artists[0];
      const album = track.album;

      // Only prepare new entities
      if (!existingArtistIds.has(artist.id)) {
        newArtists.push({
          id: artist.id,
          name: artist.name,
          externalUrl: artist.external_urls.spotify,
        });
        existingArtistIds.add(artist.id); // Prevent duplicates in batch
      }

      if (!existingAlbumIds.has(album.id)) {
        newAlbums.push({
          id: album.id,
          name: album.name,
          imageUrl: album.images[0]?.url,
          artistId: artist.id,
        });
        existingAlbumIds.add(album.id);
      }

      userTracks.push({
        userId,
        spotifyTrackId: track.id,
        addedAt: new Date(item.added_at),
      });
    }

    // Batch insert with conflict handling
    await this.prisma.$transaction([
      this.prisma.spotifyArtist.createMany({
        data: newArtists,
        skipDuplicates: true,
      }),
      this.prisma.spotifyAlbum.createMany({
        data: newAlbums,
        skipDuplicates: true,
      }),
      this.prisma.spotifyTrack.createMany({
        data: tracks.map(item => ({
          id: item.track.id,
          name: item.track.name,
          duration: item.track.duration_ms,
          artistId: item.track.artists[0].id,
          albumId: item.track.album.id,
        })),
        skipDuplicates: true,
      }),
      this.prisma.userTrack.createMany({
        data: userTracks,
        skipDuplicates: true,
      }),
    ]);
  }

  // For genre processing, use database directly
  async updateArtistGenres(artistUpdates: Array<{id: string, genres: string[]}>) {
    // Process in chunks to avoid memory issues
    for (let i = 0; i < artistUpdates.length; i += this.STREAM_CHUNK_SIZE) {
      const chunk = artistUpdates.slice(i, i + this.STREAM_CHUNK_SIZE);
      
      await this.prisma.$transaction(
        chunk.map(update => 
          this.prisma.spotifyArtist.update({
            where: { id: update.id },
            data: { genres: update.genres },
          })
        )
      );
    }
  }
}
```

**Use database aggregation instead of in-memory**:

```typescript
// Get artist stats without loading all data
async getArtistStats(userId: string) {
  return this.prisma.$queryRaw`
    SELECT 
      sar.id,
      sar.name,
      COUNT(DISTINCT ut.id) as track_count,
      SUM(ut."totalPlayCount") as total_plays,
      MAX(ut."lastPlayedAt") as last_played
    FROM "UserTrack" ut
    INNER JOIN "SpotifyTrack" st ON ut."spotifyTrackId" = st.id
    INNER JOIN "SpotifyArtist" sar ON st."artistId" = sar.id
    WHERE ut."userId" = ${userId}
    GROUP BY sar.id, sar.name
    ORDER BY total_plays DESC
    LIMIT 100
  `;
}
```

### 8. Cursor-Based Pagination

**Problem**: Offset pagination becomes exponentially slower with more data.

**Solution**: Implement cursor-based pagination

```typescript
// pagination.dto.ts
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string; // Base64 encoded cursor

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

// cursor.service.ts
@Injectable()
export class CursorService {
  encodeCursor(data: Record<string, any>): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  decodeCursor(cursor: string): Record<string, any> {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }
}

// user-tracks.service.ts
export class UserTracksService {
  async getTracksWithCursor(
    userId: string,
    { cursor, limit = 50 }: CursorPaginationDto,
  ) {
    let whereClause: Prisma.UserTrackWhereInput = { userId };

    // Decode cursor to get last item's sort values
    if (cursor) {
      const decoded = this.cursorService.decodeCursor(cursor);
      
      // For sorting by addedAt DESC, id ASC
      whereClause = {
        userId,
        OR: [
          { addedAt: { lt: new Date(decoded.addedAt) } },
          {
            addedAt: new Date(decoded.addedAt),
            id: { gt: decoded.id }, // Tiebreaker
          },
        ],
      };
    }

    const tracks = await this.prisma.userTrack.findMany({
      where: whereClause,
      orderBy: [
        { addedAt: 'desc' },
        { id: 'asc' }, // Stable sort tiebreaker
      ],
      take: limit + 1, // Fetch one extra to check if more exist
      include: {
        spotifyTrack: {
          include: {
            artist: true,
            album: true,
          },
        },
      },
    });

    const hasMore = tracks.length > limit;
    const items = hasMore ? tracks.slice(0, -1) : tracks;

    const nextCursor = hasMore
      ? this.cursorService.encodeCursor({
          addedAt: items[items.length - 1].addedAt.toISOString(),
          id: items[items.length - 1].id,
        })
      : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  // For complex sorts (e.g., by play count and last played)
  async getTracksByPlayCount(
    userId: string,
    { cursor, limit = 50 }: CursorPaginationDto,
  ) {
    // Use raw SQL for optimal cursor pagination with multiple sort fields
    const cursorCondition = cursor
      ? this.cursorService.decodeCursor(cursor)
      : null;

    const query = `
      SELECT 
        ut.*,
        st.name as track_name,
        sa.name as album_name,
        sar.name as artist_name
      FROM "UserTrack" ut
      INNER JOIN "SpotifyTrack" st ON ut."spotifyTrackId" = st.id
      INNER JOIN "SpotifyAlbum" sa ON st."albumId" = sa.id
      INNER JOIN "SpotifyArtist" sar ON st."artistId" = sar.id
      WHERE ut."userId" = $1
      ${
        cursorCondition
          ? `AND (
              ut."totalPlayCount" < $2 OR 
              (ut."totalPlayCount" = $2 AND ut."lastPlayedAt" < $3::timestamp) OR
              (ut."totalPlayCount" = $2 AND ut."lastPlayedAt" = $3::timestamp AND ut.id > $4)
            )`
          : ''
      }
      ORDER BY ut."totalPlayCount" DESC, ut."lastPlayedAt" DESC, ut.id ASC
      LIMIT $5
    `;

    const params = cursorCondition
      ? [userId, cursorCondition.playCount, cursorCondition.lastPlayed, cursorCondition.id, limit + 1]
      : [userId, limit + 1];

    const tracks = await this.prisma.$queryRawUnsafe(query, ...params);

    const hasMore = tracks.length > limit;
    const items = hasMore ? tracks.slice(0, -1) : tracks;

    const nextCursor = hasMore
      ? this.cursorService.encodeCursor({
          playCount: items[items.length - 1].totalPlayCount,
          lastPlayed: items[items.length - 1].lastPlayedAt,
          id: items[items.length - 1].id,
        })
      : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}

// Frontend usage with TanStack Query
export function useInfiniteUserTracks() {
  return useInfiniteQuery({
    queryKey: ['userTracks'],
    queryFn: ({ pageParam }) =>
      api.getUserTracks({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });
}
```

**Index optimization for cursor pagination**:

```prisma
model UserTrack {
  // ... fields ...
  
  // Indexes for cursor-based pagination
  @@index([userId, addedAt(sort: Desc), id])
  @@index([userId, totalPlayCount(sort: Desc), lastPlayedAt(sort: Desc), id])
  @@index([userId, rating(sort: Desc), addedAt(sort: Desc), id])
}
```

## Implementation Priority

1. **Immediate (Before Production)**
   - Add composite indexes (#2) - Quick win, immediate performance gain
   - Fix N+1 queries (#1) - Critical for user experience
   - Implement transactions for race conditions (#5) - Data integrity

2. **Soon After Launch**
   - Implement cursor pagination (#8) - Before data grows
   - Set up PlayHistory partitioning (#3) - Before table gets huge
   - Optimize memory-heavy sync (#7) - Before users with large libraries

3. **Medium Term**
   - Normalize genres (#4) - Migration complexity
   - Replace JSON criteria (#6) - Feature enhancement

## Monitoring & Maintenance

### Query Performance Monitoring

```sql
-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%UserTrack%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

### Regular Maintenance Tasks

```typescript
// maintenance.service.ts
@Injectable()
export class MaintenanceService {
  @Cron('0 3 * * 0') // Weekly at 3 AM Sunday
  async performMaintenance() {
    // Update table statistics
    await this.prisma.$executeRaw`ANALYZE`;
    
    // Vacuum tables
    await this.prisma.$executeRaw`VACUUM ANALYZE "UserTrack"`;
    await this.prisma.$executeRaw`VACUUM ANALYZE "PlayHistory"`;
    
    // Reindex if needed
    const indexBloat = await this.checkIndexBloat();
    if (indexBloat > 30) {
      await this.prisma.$executeRaw`REINDEX TABLE CONCURRENTLY "UserTrack"`;
    }
  }
}
```

## Conclusion

These optimizations will ensure your application scales smoothly to production workloads. Start with the high-priority items that provide immediate benefits with minimal risk, then gradually implement the more complex optimizations as your user base grows.

Remember to:
- Test all migrations on production-like data
- Monitor query performance after each change
- Keep indexes updated with `ANALYZE`
- Plan for data growth from day one