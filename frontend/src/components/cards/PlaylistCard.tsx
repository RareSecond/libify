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
import { ListMusic, Play, Shuffle, Star, Users } from "lucide-react";
import { useState } from "react";

import { PlaylistDto } from "../../data/api";
import { formatDate, formatDuration } from "../../utils/format";

interface PlaylistCardProps {
  playlist: PlaylistDto;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
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
          {playlist.imageUrl ? (
            <Image
              alt={playlist.name}
              className="h-[200px] object-cover transition-transform duration-300 group-hover:scale-110"
              fallbackSrc="/placeholder-album.svg"
              src={playlist.imageUrl}
            />
          ) : (
            <Center className="h-[200px] bg-dark-6">
              <ListMusic color="var(--color-dark-3)" size={48} />
            </Center>
          )}

          {/* Hover Overlay with Actions */}
          <Box
            className={`absolute inset-0 bg-gradient-to-t from-dark-9/95 via-dark-9/60 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Group gap="xs">
              <Tooltip label="Play Playlist">
                <ActionIcon
                  className="bg-gradient-to-br from-orange-6 to-orange-8 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Play playlist logic
                  }}
                  size="xl"
                  variant="filled"
                >
                  <Play fill="white" size={24} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Shuffle Playlist">
                <ActionIcon
                  className="bg-dark-6 hover:bg-dark-5 hover:scale-110 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Shuffle playlist logic
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
              {playlist.trackCount} tracks
            </Text>
          </Box>

          {/* Collaborative Badge */}
          {playlist.collaborative && (
            <Box className="absolute left-2 top-2">
              <Tooltip label="Collaborative Playlist">
                <div className="bg-dark-6/80 rounded-full p-1.5 backdrop-blur-sm">
                  <Users color="white" size={16} />
                </div>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Card.Section>

      <Stack gap="sm">
        <div>
          <Text
            className="font-bold text-dark-0 group-hover:text-orange-5 transition-colors"
            lineClamp={1}
            size="md"
          >
            {playlist.name}
          </Text>
          {playlist.ownerName && (
            <Text className="text-dark-1" lineClamp={1} size="sm">
              by {playlist.ownerName}
            </Text>
          )}
        </div>

        <Group gap="md" wrap="nowrap">
          <Group gap={4}>
            <Play color="var(--color-orange-5)" size={14} />
            <Text className="text-dark-1 font-medium" size="xs">
              {playlist.totalPlayCount.toLocaleString()}
            </Text>
          </Group>

          {playlist.avgRating && playlist.avgRating > 0 && (
            <Group gap={4}>
              <Star
                color="var(--color-orange-5)"
                fill="var(--color-orange-5)"
                size={14}
              />
              <Text className="text-dark-1 font-medium" size="xs">
                {playlist.avgRating.toFixed(1)}
              </Text>
            </Group>
          )}

          <Text className="text-dark-1 ml-auto font-medium" size="xs">
            {formatDuration(playlist.totalDuration)}
          </Text>
        </Group>

        {playlist.lastPlayed && (
          <Text className="text-dark-1" size="xs">
            Last played: {formatDate(playlist.lastPlayed)}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
