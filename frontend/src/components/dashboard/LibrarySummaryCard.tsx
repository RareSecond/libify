import { Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Disc, Library, Music, User } from "lucide-react";

interface LibrarySummaryCardProps {
  totalAlbums: number;
  totalArtists: number;
  totalTracks: number;
}

export function LibrarySummaryCard({
  totalAlbums,
  totalArtists,
  totalTracks,
}: LibrarySummaryCardProps) {
  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 h-full"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group gap="xs">
          <Library color="var(--color-orange-5)" size={20} />
          <Title className="text-dark-0" order={3}>
            Library Overview
          </Title>
        </Group>

        <SimpleGrid cols={3}>
          <div className="text-center p-3 rounded-md bg-dark-6 border border-dark-5">
            <Music className="text-orange-5 mx-auto mb-2" size={24} />
            <Text className="text-dark-0 font-bold" size="xl">
              {totalTracks.toLocaleString()}
            </Text>
            <Text className="text-dark-3" size="xs">
              Tracks
            </Text>
          </div>

          <div className="text-center p-3 rounded-md bg-dark-6 border border-dark-5">
            <Disc className="text-orange-5 mx-auto mb-2" size={24} />
            <Text className="text-dark-0 font-bold" size="xl">
              {totalAlbums.toLocaleString()}
            </Text>
            <Text className="text-dark-3" size="xs">
              Albums
            </Text>
          </div>

          <div className="text-center p-3 rounded-md bg-dark-6 border border-dark-5">
            <User className="text-orange-5 mx-auto mb-2" size={24} />
            <Text className="text-dark-0 font-bold" size="xl">
              {totalArtists.toLocaleString()}
            </Text>
            <Text className="text-dark-3" size="xs">
              Artists
            </Text>
          </div>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
