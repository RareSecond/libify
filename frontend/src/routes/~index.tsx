import { Container, Grid, Group, Stack, Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { Disc, Library, Music, TrendingUp } from "lucide-react";

import { RatingModeCard } from "@/components/dashboard/RatingModeCard";
import { RecentlyPlayed } from "@/components/dashboard/RecentlyPlayed";
import { LibrarySync } from "@/components/LibrarySync";
import { PageTitle } from "@/components/PageTitle";
import { StatsCard } from "@/components/stats/StatsCard";
import { UserProfile } from "@/components/UserProfile";
import { useLibraryControllerGetSyncLibraryStatus } from "@/data/api";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const { data: syncStatus } = useLibraryControllerGetSyncLibraryStatus();

  return (
    <Container className="py-8" fluid>
      <Stack gap="xl">
        <Group align="center" justify="space-between">
          <div>
            <PageTitle title="Dashboard" />
            <Text className="text-dark-1" size="sm">
              Welcome back! Here's what's happening with your music library
            </Text>
          </div>
        </Group>

        {/* Stats Grid */}
        <Grid>
          <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
            <StatsCard
              icon={Music}
              label="Total Tracks"
              value={syncStatus?.totalTracks?.toLocaleString() || "0"}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
            <StatsCard
              color="orange"
              icon={Disc}
              label="Total Albums"
              value={syncStatus?.totalAlbums?.toLocaleString() || "0"}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
            <StatsCard
              color="orange"
              icon={Library}
              label="Library Status"
              value={syncStatus?.lastSync ? "Synced" : "Not Synced"}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
            <StatsCard
              color="orange"
              icon={TrendingUp}
              label="Growth"
              value="Active"
            />
          </Grid.Col>
        </Grid>

        {/* Main Content Grid */}
        <Grid>
          {/* Left Column - Recent Activity */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="lg">
              <RecentlyPlayed />
            </Stack>
          </Grid.Col>

          {/* Right Column - Profile & Actions */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="lg">
              <UserProfile />
              <RatingModeCard />
              <LibrarySync />
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
