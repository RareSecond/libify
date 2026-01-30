import {
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
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

  const topGenres = genreDistribution.slice(0, 10);
  const maxCount = topGenres[0]?.count ?? 0;

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
      <Title className="text-dark-0 mb-4" order={4}>
        Genre Distribution
      </Title>

      <Stack gap="xs">
        {topGenres.map((g, index) => (
          <div key={g.genre}>
            <div className="flex items-center gap-3 mb-1">
              <Text className="text-dark-3 w-5 shrink-0 text-right" size="sm">
                {index + 1}
              </Text>
              <Text
                className="text-dark-0 flex-1 truncate font-medium"
                size="sm"
              >
                {g.displayName}
              </Text>
              <Text className="text-dark-3 shrink-0" size="xs">
                {g.count.toLocaleString()}
              </Text>
            </div>
            <div className="pl-8">
              <Progress
                color="orange.6"
                size="xs"
                value={(g.count / maxCount) * 100}
              />
            </div>
          </div>
        ))}
      </Stack>

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
