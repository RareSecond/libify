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
      className="h-full cursor-pointer p-4 hover:-translate-y-1 transition-all duration-200 bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      radius="md"
      shadow="md"
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
            <Center className="h-[200px] bg-dark-6">
              <Music color="var(--color-dark-3)" size={48} />
            </Center>
          )}
          <Box className="absolute right-2 top-2 rounded bg-gradient-to-br from-orange-7 to-orange-8 px-2 py-1 opacity-95">
            <Text className="text-xs font-semibold text-white">
              {album.trackCount} tracks
            </Text>
          </Box>
        </Box>
      </Card.Section>

      <Stack gap="xs">
        <div>
          <Text className="font-semibold text-dark-0" lineClamp={1} size="md">
            {album.name}
          </Text>
          <Text c="dimmed" lineClamp={1} size="sm">
            {album.artist}
          </Text>
        </div>

        <Group gap="xs" wrap="nowrap">
          <Group gap={4}>
            <Play color="var(--color-orange-5)" size={14} />
            <Text c="dimmed" size="xs">
              {album.totalPlayCount}
            </Text>
          </Group>

          {album.avgRating && (
            <Group gap={4}>
              <Star color="var(--color-orange-5)" fill="var(--color-orange-5)" size={14} />
              <Text c="dimmed" size="xs">
                {album.avgRating}
              </Text>
            </Group>
          )}

          <Text c="dimmed" className="ml-auto" size="xs">
            {formatDuration(album.totalDuration)}
          </Text>
        </Group>

        <Text c="dimmed" size="xs">
          Last played: {formatDate(album.lastPlayed)}
        </Text>
      </Stack>
    </Card>
  );
}
