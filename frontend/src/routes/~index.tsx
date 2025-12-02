import {
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Disc, Music, User } from "lucide-react";
import { useEffect, useRef } from "react";

import { LibraryHealthCard } from "@/components/dashboard/LibraryHealthCard";
import { RecentlyPlayed } from "@/components/dashboard/RecentlyPlayed";
import { SyncPromptCard } from "@/components/dashboard/SyncPromptCard";
import { SyncStatusBar } from "@/components/dashboard/SyncStatusBar";
import { TopThisWeekCard } from "@/components/dashboard/TopThisWeekCard";
import { WeeklyActivityCard } from "@/components/dashboard/WeeklyActivityCard";
import { LibrarySync } from "@/components/LibrarySync";
import { PageTitle } from "@/components/PageTitle";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useLibraryControllerGetDashboardStats } from "@/data/api";
import { trackDashboardViewed } from "@/lib/posthog";

export const Route = createFileRoute("/")({ component: HomePage });

interface LibrarySummaryInlineProps {
  totalAlbums: number;
  totalArtists: number;
  totalTracks: number;
}

function HomePage() {
  const navigate = useNavigate();
  const { playTrackList } = useSpotifyPlayer();
  const {
    data: dashboardStats,
    isLoading,
    refetch,
  } = useLibraryControllerGetDashboardStats();
  const hasTrackedViewRef = useRef(false);

  // Track dashboard view once stats are loaded
  useEffect(() => {
    if (!isLoading && dashboardStats && !hasTrackedViewRef.current) {
      trackDashboardViewed({
        ratedPercentage: dashboardStats.ratingStats?.percentageRated || 0,
        taggedPercentage: dashboardStats.tagStats?.percentageTagged || 0,
        totalTracks: dashboardStats.totalTracks || 0,
      });
      hasTrackedViewRef.current = true;
    }
  }, [isLoading, dashboardStats]);

  const handleStartRating = async () => {
    await playTrackList(["placeholder"], {
      contextType: "library",
      shuffle: true,
      unratedOnly: true,
    });
    navigate({ to: "/fullscreen" });
  };

  if (isLoading) {
    return (
      <Container className="py-8" fluid>
        <Center className="h-[50vh]">
          <Loader color="orange" size="lg" />
        </Center>
      </Container>
    );
  }

  const isSynced = dashboardStats?.isSynced ?? false;

  return (
    <Container className="py-8" fluid>
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group align="flex-end" gap="md" justify="space-between" wrap="wrap">
            <div>
              <PageTitle title="Dashboard" />
              <Text className="text-dark-1" size="sm">
                {isSynced
                  ? "Welcome back! Here's what's happening with your music library"
                  : "Get started by syncing your Spotify library"}
              </Text>
            </div>
            {isSynced && (
              <LibrarySummaryInline
                totalAlbums={dashboardStats?.totalAlbums || 0}
                totalArtists={dashboardStats?.totalArtists || 0}
                totalTracks={dashboardStats?.totalTracks || 0}
              />
            )}
          </Group>
        </div>

        {!isSynced ? (
          <Grid>
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <SyncPromptCard onSyncStarted={() => refetch()} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <LibrarySync onSyncComplete={() => refetch()} />
            </Grid.Col>
          </Grid>
        ) : (
          <>
            {/* Library Health - Full Width Hero */}
            <LibraryHealthCard
              averageRating={dashboardStats?.ratingStats.averageRating || 0}
              onStartRating={handleStartRating}
              percentageRated={dashboardStats?.ratingStats.percentageRated || 0}
              percentageTagged={dashboardStats?.tagStats.percentageTagged || 0}
              ratedTracks={dashboardStats?.ratingStats.ratedTracks || 0}
              taggedTracks={dashboardStats?.tagStats.taggedTracks || 0}
              totalTracks={dashboardStats?.totalTracks || 0}
              unratedTracks={dashboardStats?.ratingStats.unratedTracks || 0}
            />

            {/* Main Content Grid */}
            <Grid>
              {/* Left Column - Activity & Top Items */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap="lg">
                  <WeeklyActivityCard
                    totalPlaysThisWeek={
                      dashboardStats?.activityStats.totalPlaysThisWeek || 0
                    }
                    tracksAddedThisWeek={
                      dashboardStats?.activityStats.tracksAddedThisWeek || 0
                    }
                    tracksRatedThisWeek={
                      dashboardStats?.activityStats.tracksRatedThisWeek || 0
                    }
                  />
                  <TopThisWeekCard
                    topArtists={dashboardStats?.topArtistsThisWeek || []}
                    topTracks={dashboardStats?.topTracksThisWeek || []}
                  />
                </Stack>
              </Grid.Col>

              {/* Right Column - Recently Played */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <RecentlyPlayed />
              </Grid.Col>
            </Grid>

            {/* Sync Status Bar */}
            <SyncStatusBar
              lastSyncedAt={
                dashboardStats?.lastSyncedAt
                  ? new Date(dashboardStats.lastSyncedAt)
                  : undefined
              }
              onSyncComplete={() => refetch()}
              totalAlbums={dashboardStats?.totalAlbums || 0}
              totalTracks={dashboardStats?.totalTracks || 0}
            />
          </>
        )}
      </Stack>
    </Container>
  );
}

function LibrarySummaryInline({
  totalAlbums,
  totalArtists,
  totalTracks,
}: LibrarySummaryInlineProps) {
  return (
    <Group className="text-dark-2" gap="md">
      <Group gap="xs">
        <Music size={14} />
        <Text size="sm">{totalTracks.toLocaleString()} tracks</Text>
      </Group>
      <Group gap="xs">
        <Disc size={14} />
        <Text size="sm">{totalAlbums.toLocaleString()} albums</Text>
      </Group>
      <Group gap="xs">
        <User size={14} />
        <Text size="sm">{totalArtists.toLocaleString()} artists</Text>
      </Group>
    </Group>
  );
}
