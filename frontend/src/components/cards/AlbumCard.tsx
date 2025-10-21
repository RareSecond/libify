import { Box, Card, Center, Group, Image, Stack, Text } from "@mantine/core";
import { Music, Play, Star } from "lucide-react";

import { AlbumDto } from "../../data/api";
import { formatDate, formatDuration } from "../../utils/format";

interface AlbumCardProps {
  album: AlbumDto;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Card
      className="h-full cursor-pointer p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
      radius="md"
      shadow="sm"
      withBorder
    >
      <Card.Section className="mb-4">
        <Box className="relative">
          {album.albumArt ? (
            <Image
              alt={album.name}
              className="h-[200px] object-cover"
              fallbackSrc="/placeholder-album.svg"
              src={album.albumArt}
            />
          ) : (
            <Center className="h-[200px] bg-gray-200">
              <Music color="gray" size={48} />
            </Center>
          )}
          <Box className="absolute right-2 top-2 rounded bg-gray-900 px-2 py-1 opacity-90">
            <Text className="text-xs font-semibold text-white">
              {album.trackCount} tracks
            </Text>
          </Box>
        </Box>
      </Card.Section>

      <Stack gap="xs">
        <div>
          <Text className="font-semibold" lineClamp={1} size="md">
            {album.name}
          </Text>
          <Text className="text-gray-600" lineClamp={1} size="sm">
            {album.artist}
          </Text>
        </div>

        <Group gap="xs" wrap="nowrap">
          <Group gap={4}>
            <Play size={14} />
            <Text size="xs">{album.totalPlayCount}</Text>
          </Group>

          {album.avgRating && (
            <Group gap={4}>
              <Star size={14} />
              <Text size="xs">{album.avgRating}</Text>
            </Group>
          )}

          <Text className="ml-auto text-xs text-gray-600">
            {formatDuration(album.totalDuration)}
          </Text>
        </Group>

        <Text className="text-xs text-gray-600">
          Last played: {formatDate(album.lastPlayed)}
        </Text>
      </Stack>
    </Card>
  );
}
