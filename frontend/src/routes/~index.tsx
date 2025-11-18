import {
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { ActivityStatsCard } from "@/components/dashboard/ActivityStatsCard";
import { LibrarySummaryCard } from "@/components/dashboard/LibrarySummaryCard";
import { RatingProgressCard } from "@/components/dashboard/RatingProgressCard";
import { RecentlyPlayed } from "@/components/dashboard/RecentlyPlayed";
import { SyncPromptCard } from "@/components/dashboard/SyncPromptCard";
import { TagOverviewCard } from "@/components/dashboard/TagOverviewCard";
import { TopItemsCard } from "@/components/dashboard/TopItemsCard";
import { LibrarySync } from "@/components/LibrarySync";
import { PageTitle } from "@/components/PageTitle";
import { UserProfile } from "@/components/UserProfile";
import { useLibraryControllerGetDashboardStats } from "@/data/api";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const {
    data: dashboardStats,
    isLoading,
    refetch,
  } = useLibraryControllerGetDashboardStats();

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
        <Group align="center" justify="space-between">
          <div>
            <PageTitle title="Dashboard" />
            <Text className="text-dark-1" size="sm">
              {isSynced
                ? "Welcome back! Here's what's happening with your music library"
                : "Get started by syncing your Spotify library"}
            </Text>
          </div>
        </Group>

        {!isSynced ? (
          <Grid>
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <SyncPromptCard onSyncStarted={() => refetch()} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="lg">
                <UserProfile />
                <LibrarySync onSyncComplete={() => refetch()} />
              </Stack>
            </Grid.Col>
          </Grid>
        ) : (
          <>
            {/* Top Stats Row */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <LibrarySummaryCard
                  totalAlbums={dashboardStats?.totalAlbums || 0}
                  totalArtists={dashboardStats?.totalArtists || 0}
                  totalTracks={dashboardStats?.totalTracks || 0}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <RatingProgressCard
                  averageRating={dashboardStats?.ratingStats.averageRating || 0}
                  percentageRated={
                    dashboardStats?.ratingStats.percentageRated || 0
                  }
                  ratedTracks={dashboardStats?.ratingStats.ratedTracks || 0}
                  totalTracks={dashboardStats?.ratingStats.totalTracks || 0}
                  unratedTracks={dashboardStats?.ratingStats.unratedTracks || 0}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <ActivityStatsCard
                  totalPlaysThisWeek={
                    dashboardStats?.activityStats.totalPlaysThisWeek || 0
                  }
                  tracksAddedThisWeek={
                    dashboardStats?.activityStats.tracksAddedThisWeek || 0
                  }
                  tracksPlayedThisWeek={
                    dashboardStats?.activityStats.tracksPlayedThisWeek || 0
                  }
                  tracksRatedThisWeek={
                    dashboardStats?.activityStats.tracksRatedThisWeek || 0
                  }
                />
              </Grid.Col>
            </Grid>

            {/* Main Content Grid */}
            <Grid>
              {/* Left Column - Recent Activity & Top Items */}
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Stack gap="lg">
                  <RecentlyPlayed />
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TopItemsCard
                        items={dashboardStats?.topTracksThisWeek || []}
                        title="Top Tracks This Week"
                        type="tracks"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TopItemsCard
                        items={dashboardStats?.topArtistsThisWeek || []}
                        title="Top Artists This Week"
                        type="artists"
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Grid.Col>

              {/* Right Column - Profile & Actions */}
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Stack gap="lg">
                  <UserProfile />
                  <TagOverviewCard
                    percentageTagged={
                      dashboardStats?.tagStats.percentageTagged || 0
                    }
                    taggedTracks={dashboardStats?.tagStats.taggedTracks || 0}
                    topTags={dashboardStats?.tagStats.topTags || []}
                    totalTags={dashboardStats?.tagStats.totalTags || 0}
                    totalTracks={dashboardStats?.totalTracks || 0}
                  />
                  <LibrarySync
                    lastSyncedAt={
                      dashboardStats?.lastSyncedAt
                        ? new Date(dashboardStats.lastSyncedAt)
                        : undefined
                    }
                    onSyncComplete={() => refetch()}
                    totalAlbums={dashboardStats?.totalAlbums || 0}
                    totalTracks={dashboardStats?.totalTracks || 0}
                  />
                </Stack>
              </Grid.Col>
            </Grid>
          </>
        )}
      </Stack>
    </Container>
  );
}
