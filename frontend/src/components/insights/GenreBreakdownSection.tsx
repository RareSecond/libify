import { BarChart } from "@mantine/charts";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { ListMusic } from "lucide-react";

interface GenreBreakdownSectionProps {
  genreDistribution: GenreDistribution[];
  onCreateGenrePlaylist: (genreName: string) => void;
}

interface GenreDistribution {
  count: number;
  displayName: string;
  genre: string;
  percentage: number;
}

export function GenreBreakdownSection({
  genreDistribution,
  onCreateGenrePlaylist,
}: GenreBreakdownSectionProps) {
  if (genreDistribution.length === 0) {
    return (
      <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
        <Title className="text-dark-0 mb-4" order={4}>
          Genre Distribution
        </Title>
        <Text className="text-dark-2" size="sm">
          No genre data available yet. Genre enrichment happens in the
          background.
        </Text>
      </Paper>
    );
  }

  const chartData = genreDistribution
    .slice(0, 10)
    .map((g) => ({ count: g.count, genre: g.displayName }));

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
      <Title className="text-dark-0 mb-4" order={4}>
        Genre Distribution
      </Title>

      <BarChart
        className="h-[300px]"
        data={chartData}
        dataKey="genre"
        gridColor="var(--mantine-color-dark-5)"
        orientation="vertical"
        series={[{ color: "orange.6", name: "count" }]}
        tickLine="none"
        withLegend={false}
      />

      <Stack className="mt-6" gap="xs">
        <Text className="text-dark-2" size="sm">
          Quick create playlists from your top genres:
        </Text>
        <Group gap="xs">
          {genreDistribution.slice(0, 5).map((g) => (
            <Button
              key={g.genre}
              leftSection={<ListMusic size={14} />}
              onClick={() => onCreateGenrePlaylist(g.genre)}
              size="xs"
              variant="light"
            >
              {g.displayName}
            </Button>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
}
