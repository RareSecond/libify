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
      className="h-full cursor-pointer p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
      radius="md"
      shadow="sm"
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
            <Center className="h-[200px] bg-gray-200">
              <User color="gray" size={48} />
            </Center>
          )}
          <Box className="absolute right-2 top-2 rounded bg-gray-900 px-2 py-1 opacity-90">
            <Text className="text-xs font-semibold text-white">
              {artist.trackCount} tracks
            </Text>
          </Box>
        </Box>
      </Card.Section>

      <Stack gap="xs">
        <div>
          <Text className="font-semibold" lineClamp={1} size="md">
            {artist.name}
          </Text>
          <Text className="text-gray-600" lineClamp={1} size="sm">
            {artist.albumCount} albums
          </Text>
        </div>

        <Group gap="xs" wrap="nowrap">
          <Group gap={4}>
            <Play size={14} />
            <Text size="xs">{artist.totalPlayCount}</Text>
          </Group>

          {artist.avgRating && (
            <Group gap={4}>
              <Star size={14} />
              <Text size="xs">{artist.avgRating}</Text>
            </Group>
          )}

          <Text className="ml-auto text-xs text-gray-600">
            {formatDuration(artist.totalDuration)}
          </Text>
        </Group>

        <Text className="text-xs text-gray-600">
          Last played: {formatDate(artist.lastPlayed)}
        </Text>
      </Stack>
    </Card>
  );
}
