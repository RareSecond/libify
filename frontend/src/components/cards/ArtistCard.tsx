import { Box, Card, Center, Group, Image, Stack, Text } from "@mantine/core";
import { Play, Star, User } from "lucide-react";

import { ArtistDto } from "../../data/api";
import { formatDate, formatDuration } from "../../utils/format";

interface ArtistCardProps {
  artist: ArtistDto;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Card
      className="h-full cursor-pointer p-4 hover:-translate-y-1 transition-all duration-200 bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      radius="md"
      shadow="md"
      withBorder
    >
      <Card.Section className="mb-4">
        <Box className="relative">
          {artist.artistImage ? (
            <Image
              alt={artist.name}
              className="h-[200px] object-cover"
              fallbackSrc="/placeholder-album.svg"
              src={artist.artistImage}
            />
          ) : (
            <Center className="h-[200px] bg-dark-6">
              <User color="var(--color-dark-3)" size={48} />
            </Center>
          )}
          <Box className="absolute right-2 top-2 rounded bg-gradient-to-br from-orange-7 to-orange-8 px-2 py-1 opacity-95">
            <Text className="text-xs font-semibold text-white">
              {artist.trackCount} tracks
            </Text>
          </Box>
        </Box>
      </Card.Section>

      <Stack gap="xs">
        <div>
          <Text className="font-semibold text-dark-0" lineClamp={1} size="md">
            {artist.name}
          </Text>
          <Text c="dimmed" lineClamp={1} size="sm">
            {artist.albumCount} albums
          </Text>
        </div>

        <Group gap="xs" wrap="nowrap">
          <Group gap={4}>
            <Play color="var(--color-orange-5)" size={14} />
            <Text c="dimmed" size="xs">
              {artist.totalPlayCount}
            </Text>
          </Group>

          {artist.avgRating && (
            <Group gap={4}>
              <Star color="var(--color-orange-5)" fill="var(--color-orange-5)" size={14} />
              <Text c="dimmed" size="xs">
                {artist.avgRating}
              </Text>
            </Group>
          )}

          <Text c="dimmed" className="ml-auto" size="xs">
            {formatDuration(artist.totalDuration)}
          </Text>
        </Group>

        <Text c="dimmed" size="xs">
          Last played: {formatDate(artist.lastPlayed)}
        </Text>
      </Stack>
    </Card>
  );
}
