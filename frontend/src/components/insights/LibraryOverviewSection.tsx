import { Avatar, Grid, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Calendar, Disc, Music, User } from "lucide-react";

interface LibraryOverviewSectionProps {
  newestTrackYear: null | number;
  oldestTrackYear: null | number;
  topArtists: TopArtist[];
  totalAlbums: number;
  totalArtists: number;
  totalTracks: number;
}

interface TopArtist {
  imageUrl?: string;
  name: string;
  trackCount: number;
}

export function LibraryOverviewSection({
  newestTrackYear,
  oldestTrackYear,
  topArtists,
  totalAlbums,
  totalArtists,
  totalTracks,
}: LibraryOverviewSectionProps) {
  const yearRange =
    oldestTrackYear && newestTrackYear
      ? `${oldestTrackYear} - ${newestTrackYear}`
      : "N/A";

  const stats = [
    { icon: Music, label: "Tracks", value: totalTracks.toLocaleString() },
    { icon: Disc, label: "Albums", value: totalAlbums.toLocaleString() },
    { icon: User, label: "Artists", value: totalArtists.toLocaleString() },
    { icon: Calendar, label: "Years", value: yearRange },
  ];

  return (
    <Stack gap="lg">
      {/* Stat Cards */}
      <Grid>
        {stats.map((stat) => (
          <Grid.Col key={stat.label} span={{ base: 6, md: 3 }}>
            <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
              <Group gap="md">
                <div className="p-2 rounded-lg bg-orange-9/20">
                  <stat.icon className="text-orange-5" size={24} />
                </div>
                <div>
                  <Text className="text-dark-0 font-semibold" size="xl">
                    {stat.value}
                  </Text>
                  <Text className="text-dark-2" size="sm">
                    {stat.label}
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      {/* Top Artists */}
      {topArtists.length > 0 && (
        <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
          <Title className="text-dark-0 mb-4" order={4}>
            Top Artists
          </Title>
          <Grid>
            {topArtists.slice(0, 5).map((artist) => (
              <Grid.Col key={artist.name} span={{ base: 6, md: 2.4, sm: 4 }}>
                <Stack align="center" gap="xs">
                  <Avatar
                    className="border-2 border-dark-5"
                    radius="xl"
                    size="lg"
                    src={artist.imageUrl}
                  >
                    {artist.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Text
                    className="text-center text-dark-1"
                    lineClamp={1}
                    size="sm"
                  >
                    {artist.name}
                  </Text>
                  <Text className="text-dark-2" size="xs">
                    {artist.trackCount} tracks
                  </Text>
                </Stack>
              </Grid.Col>
            ))}
          </Grid>
        </Paper>
      )}
    </Stack>
  );
}
