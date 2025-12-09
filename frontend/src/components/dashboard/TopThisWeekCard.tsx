import {
  Avatar,
  Card,
  Center,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Music, Play, TrendingUp, User } from "lucide-react";

import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";

export interface TopItem {
  count: number;
  id?: string;
  imageUrl?: string;
  info?: string;
  name: string;
  spotifyId?: string;
}

interface TopThisWeekCardProps {
  topArtists: TopItem[];
  topTracks: TopItem[];
}

export function TopThisWeekCard({
  topArtists,
  topTracks,
}: TopThisWeekCardProps) {
  const { playTrackList } = useSpotifyPlayer();

  const handlePlayTrack = async (item: TopItem) => {
    if (!item.spotifyId || !item.id) return;

    try {
      await playTrackList(
        [{ spotifyUri: `spotify:track:${item.spotifyId}`, trackId: item.id }],
        { contextId: `spotify:track:${item.spotifyId}`, contextType: "track" },
      );

      notifications.show({
        color: "orange",
        message: item.name,
        title: "Now playing",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to play track. Please try again.";
      notifications.show({ color: "red", message, title: "Playback error" });
    }
  };

  const hasNoActivity = topTracks.length === 0 && topArtists.length === 0;

  if (hasNoActivity) {
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
            <TrendingUp className="text-orange-5" size={20} />
            <Text className="text-dark-0 font-semibold" size="lg">
              Top This Week
            </Text>
          </Group>
          <Center className="py-8">
            <Stack align="center" gap="sm">
              <Music className="text-dark-3" size={32} />
              <Text className="text-dark-3" size="sm">
                No activity this week
              </Text>
            </Stack>
          </Center>
        </Stack>
      </Card>
    );
  }

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
          <TrendingUp className="text-orange-5" size={20} />
          <Text className="text-dark-0 font-semibold" size="lg">
            Top This Week
          </Text>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {/* Top Tracks */}
          <div>
            <Group className="mb-3" gap="xs">
              <Music className="text-dark-2" size={14} />
              <Text className="text-dark-2 uppercase text-xs font-medium tracking-wide">
                Tracks
              </Text>
            </Group>
            <Stack gap="xs">
              {topTracks.slice(0, 3).map((item, index) => (
                <Group
                  className="p-2 rounded-md hover:bg-dark-6 transition-all duration-200 cursor-pointer group"
                  gap="sm"
                  key={`track-${item.name}-${index}`}
                  onClick={() => handlePlayTrack(item)}
                  wrap="nowrap"
                >
                  <Text className="text-dark-3 w-4 text-xs">{index + 1}</Text>
                  <div className="relative flex-shrink-0">
                    {item.imageUrl ? (
                      <Avatar radius="sm" size="sm" src={item.imageUrl} />
                    ) : (
                      <Avatar
                        className="bg-gradient-to-br from-orange-6 to-orange-8"
                        radius="sm"
                        size="sm"
                      >
                        <Music size={14} />
                      </Avatar>
                    )}
                    <div className="absolute inset-0 bg-dark-9/60 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Play
                        className="text-orange-5"
                        fill="var(--color-orange-5)"
                        size={12}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text
                      className="text-dark-0 group-hover:text-orange-5 transition-colors text-sm"
                      lineClamp={1}
                    >
                      {item.name}
                    </Text>
                    {item.info && (
                      <Text className="text-dark-3 text-xs" lineClamp={1}>
                        {item.info}
                      </Text>
                    )}
                  </div>
                  <Text className="text-dark-2 text-xs">{item.count}</Text>
                </Group>
              ))}
              {topTracks.length === 0 && (
                <Text className="text-dark-3 text-sm py-2">No tracks yet</Text>
              )}
            </Stack>
          </div>

          {/* Top Artists */}
          <div>
            <Group className="mb-3" gap="xs">
              <User className="text-dark-2" size={14} />
              <Text className="text-dark-2 uppercase text-xs font-medium tracking-wide">
                Artists
              </Text>
            </Group>
            <Stack gap="xs">
              {topArtists.slice(0, 3).map((item, index) => (
                <Group
                  className="p-2 rounded-md"
                  gap="sm"
                  key={`artist-${item.name}-${index}`}
                  wrap="nowrap"
                >
                  <Text className="text-dark-3 w-4 text-xs">{index + 1}</Text>
                  <div className="flex-shrink-0">
                    {item.imageUrl ? (
                      <Avatar radius="xl" size="sm" src={item.imageUrl} />
                    ) : (
                      <Avatar
                        className="bg-gradient-to-br from-orange-6 to-orange-8"
                        radius="xl"
                        size="sm"
                      >
                        <User size={14} />
                      </Avatar>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text className="text-dark-0 text-sm" lineClamp={1}>
                      {item.name}
                    </Text>
                  </div>
                  <Text className="text-dark-2 text-xs">{item.count}</Text>
                </Group>
              ))}
              {topArtists.length === 0 && (
                <Text className="text-dark-3 text-sm py-2">No artists yet</Text>
              )}
            </Stack>
          </div>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
