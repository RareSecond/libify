import {
  ActionIcon,
  Box,
  Card,
  Center,
  Group,
  Image,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Music, Play, Shuffle, Star } from "lucide-react";
import { useState } from "react";

import { AlbumDto } from "../../data/api";
import { formatDate, formatDuration } from "../../utils/format";

interface AlbumCardProps {
  album: AlbumDto;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="h-full cursor-pointer p-4 hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 hover:border-orange-5/50 hover:shadow-xl hover:shadow-orange-9/20 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      radius="md"
      shadow="md"
      withBorder
    >
      <Card.Section className="mb-4">
        <Box className="relative overflow-hidden">
          {album.albumArt ? (
            <Image
              alt={album.name}
              className="h-[200px] object-cover transition-transform duration-300 group-hover:scale-110"
              fallbackSrc="/placeholder-album.svg"
              src={album.albumArt}
            />
          ) : (
            <Center className="h-[200px] bg-dark-6">
              <Music color="var(--color-dark-3)" size={48} />
            </Center>
          )}

          {/* Hover Overlay with Actions */}
          <Box
            className={`absolute inset-0 bg-gradient-to-t from-dark-9/95 via-dark-9/60 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Group gap="xs">
              <Tooltip label="Play Album">
                <ActionIcon
                  className="bg-gradient-to-br from-orange-6 to-orange-8 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Play album logic
                  }}
                  size="xl"
                  variant="filled"
                >
                  <Play fill="white" size={24} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Shuffle Album">
                <ActionIcon
                  className="bg-dark-6 hover:bg-dark-5 hover:scale-110 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Shuffle album logic
                  }}
                  size="lg"
                  variant="filled"
                >
                  <Shuffle size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Box>

          {/* Track Count Badge */}
          <Box className="absolute right-2 top-2 rounded-full bg-gradient-to-br from-orange-7 to-orange-8 px-3 py-1 opacity-95 backdrop-blur-sm">
            <Text className="text-xs font-semibold text-white">
              {album.trackCount} tracks
            </Text>
          </Box>
        </Box>
      </Card.Section>

      <Stack gap="sm">
        <div>
          <Text
            className="font-bold text-dark-0 group-hover:text-orange-5 transition-colors"
            lineClamp={1}
            size="md"
          >
            {album.name}
          </Text>
          <Text className="text-dark-1" lineClamp={1} size="sm">
            {album.artist}
          </Text>
        </div>

        <Group gap="md" wrap="nowrap">
          <Group gap={4}>
            <Play color="var(--color-orange-5)" size={14} />
            <Text className="text-dark-1 font-medium" size="xs">
              {album.totalPlayCount.toLocaleString()}
            </Text>
          </Group>

          {album.avgRating && album.avgRating > 0 && (
            <Group gap={4}>
              <Star
                color="var(--color-orange-5)"
                fill="var(--color-orange-5)"
                size={14}
              />
              <Text className="text-dark-1 font-medium" size="xs">
                {album.avgRating.toFixed(1)}
              </Text>
            </Group>
          )}

          <Text className="text-dark-1 ml-auto font-medium" size="xs">
            {formatDuration(album.totalDuration)}
          </Text>
        </Group>

        {album.lastPlayed && (
          <Text className="text-dark-1" size="xs">
            Last played: {formatDate(album.lastPlayed)}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
