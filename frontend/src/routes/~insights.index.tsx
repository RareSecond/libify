import { Container, Grid, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AudioProfileSection } from "@/components/insights/AudioProfileSection";
import { GenreBreakdownSection } from "@/components/insights/GenreBreakdownSection";
import { InsightsPageSkeleton } from "@/components/insights/InsightsPageSkeleton";
import { LibraryOverviewSection } from "@/components/insights/LibraryOverviewSection";
import { OnboardingHero } from "@/components/insights/OnboardingHero";
import { QuickPlaylistSection } from "@/components/insights/QuickPlaylistSection";
import { SyncStatusSection } from "@/components/insights/SyncStatusSection";
import { YearBreakdownSection } from "@/components/insights/YearBreakdownSection";
import { PageTitle } from "@/components/PageTitle";
import {
  getAuthControllerGetProfileQueryKey,
  QuickCreatePlaylistDtoPreset,
  useAuthControllerUpdateOnboarding,
  useLibraryControllerGetLibraryInsights,
  usePlaylistsControllerQuickCreate,
} from "@/data/api";
import { useAuth } from "@/hooks/useAuth";
import { usePersistentSyncJob } from "@/hooks/usePersistentSyncJob";

export const Route = createFileRoute("/insights/")({ component: InsightsPage });

function InsightsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const isOnboarding = !profile?.hasCompletedOnboarding;
  const { resetSyncJob } = usePersistentSyncJob();
  const updateOnboarding = useAuthControllerUpdateOnboarding();

  const { data: insights, isLoading } = useLibraryControllerGetLibraryInsights({
    query: { refetchInterval: isOnboarding ? 5000 : false },
  });
  const quickCreateMutation = usePlaylistsControllerQuickCreate();

  const handleOnboardingComplete = () => {
    updateOnboarding.mutate(
      { data: { hasCompletedOnboarding: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAuthControllerGetProfileQueryKey(),
          });
          resetSyncJob();
          localStorage.removeItem("onboarding-sync-triggered");
        },
      },
    );
  };

  const handleCreatePreset = async (
    preset: "CHILL" | "DEEP_CUTS" | "FEEL_GOOD" | "FOCUS" | "GYM",
  ) => {
    try {
      const result = await quickCreateMutation.mutateAsync({
        data: { preset: preset as QuickCreatePlaylistDtoPreset },
      });
      notifications.show({
        color: "green",
        message: `Created "${result.name}" with ${result.trackCount} tracks`,
        title: "Playlist Created",
      });
      navigate({ params: { id: result.id }, to: "/smart-playlists/$id" });
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to create playlist. Please try again.",
        title: "Error",
      });
    }
  };

  const handleCreateGenrePlaylist = async (genreName: string) => {
    try {
      const result = await quickCreateMutation.mutateAsync({
        data: { genreName, preset: QuickCreatePlaylistDtoPreset.GENRE },
      });
      notifications.show({
        color: "green",
        message: `Created "${result.name}" with ${result.trackCount} tracks`,
        title: "Playlist Created",
      });
      navigate({ params: { id: result.id }, to: "/smart-playlists/$id" });
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to create playlist. Please try again.",
        title: "Error",
      });
    }
  };

  const handleCreateYearPlaylist = async (decade: string) => {
    try {
      const result = await quickCreateMutation.mutateAsync({
        data: { decade, preset: QuickCreatePlaylistDtoPreset.DECADE },
      });
      notifications.show({
        color: "green",
        message: `Created "${result.name}" with ${result.trackCount} tracks`,
        title: "Playlist Created",
      });
      navigate({ params: { id: result.id }, to: "/smart-playlists/$id" });
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to create playlist. Please try again.",
        title: "Error",
      });
    }
  };

  if (isLoading) {
    return (
      <Container className="py-8" fluid>
        <PageTitle title="Library Insights" />
        <InsightsPageSkeleton />
      </Container>
    );
  }

  if (!insights && !isOnboarding) {
    return (
      <Container className="py-8" fluid>
        <PageTitle title="Library Insights" />
        <Text className="text-dark-2">
          No insights available. Sync your library first.
        </Text>
      </Container>
    );
  }

  return (
    <Container className="py-8" fluid>
      <Stack gap="xl">
        <div>
          <PageTitle title="Library Insights" />
          <Text className="text-dark-1" size="sm">
            Discover patterns and statistics about your music library
          </Text>
        </div>

        {/* Onboarding Hero */}
        {isOnboarding && (
          <OnboardingHero onComplete={handleOnboardingComplete} />
        )}

        {insights && (
          <>
            {/* Sync Status */}
            <SyncStatusSection
              totalTracks={insights.enrichmentProgress.totalTracks}
              tracksWithAudioFeatures={
                insights.enrichmentProgress.tracksWithAudioFeatures
              }
              tracksWithGenres={insights.enrichmentProgress.tracksWithGenres}
            />

            {/* Library Overview */}
            <LibraryOverviewSection
              newestTrackYear={insights.newestTrackYear ?? null}
              oldestTrackYear={insights.oldestTrackYear ?? null}
              topArtists={insights.topArtists}
              totalAlbums={insights.totalAlbums}
              totalArtists={insights.totalArtists}
              totalTracks={insights.totalTracks}
            />

            {/* Charts Grid */}
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <GenreBreakdownSection
                  genreDistribution={insights.genreDistribution}
                  onCreateGenrePlaylist={handleCreateGenrePlaylist}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <AudioProfileSection audioProfile={insights.audioProfile} />
              </Grid.Col>
            </Grid>

            {/* Year Distribution */}
            <YearBreakdownSection
              onCreateYearPlaylist={handleCreateYearPlaylist}
              yearDistribution={insights.yearDistribution}
            />

            {/* Quick Playlist Section */}
            <QuickPlaylistSection
              isCreating={quickCreateMutation.isPending}
              onCreatePreset={handleCreatePreset}
            />
          </>
        )}
      </Stack>
    </Container>
  );
}
