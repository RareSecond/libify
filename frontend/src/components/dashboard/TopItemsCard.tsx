import { Avatar, Card, Center, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Music, Play, TrendingUp } from "lucide-react";

import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";

export interface TopItem {
  count: number;
  id?: string;
  imageUrl?: string;
  info?: string;
  name: string;
  spotifyId?: string;
}

interface TopItemsCardProps {
  items: TopItem[];
  title: string;
  type: "artists" | "tracks";
}

export function TopItemsCard({ items, title, type }: TopItemsCardProps) {
  const { playTrackList } = useSpotifyPlayer();

  const handlePlayTrack = async (item: TopItem) => {
    if (type !== "tracks" || !item.spotifyId || !item.id) return;

    try {
      await playTrackList([
        { spotifyUri: `spotify:track:${item.spotifyId}`, trackId: item.id },
      ]);

      notifications.show({
        color: "orange",
        message: item.name,
        title: "Now playing",
      });
    } catch {
      notifications.show({
        color: "red",
        message: "Please make sure Spotify is open on one of your devices",
        title: "Failed to play track",
      });
    }
  };

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group gap="xs">
          <TrendingUp color="var(--color-orange-5)" size={20} />
          <Title className="text-dark-0" order={3}>
            {title}
          </Title>
        </Group>

        <Stack gap="xs">
          {items.length === 0 ? (
            <Center className="py-8">
              <Stack align="center" gap="sm">
                <Music color="var(--color-dark-3)" size={32} />
                <Text className="text-dark-3" size="sm">
                  No activity this week
                </Text>
              </Stack>
            </Center>
          ) : (
            items.map((item, index) => (
              <Group
                className={`p-3 rounded-md hover:bg-dark-6 transition-all duration-200 ${type === "tracks" ? "cursor-pointer group" : ""}`}
                gap="md"
                key={`${item.name}-${index}`}
                onClick={() => type === "tracks" && handlePlayTrack(item)}
                wrap="nowrap"
              >
                <div className="relative">
                  {item.imageUrl ? (
                    <Avatar radius="md" size="md" src={item.imageUrl} />
                  ) : (
                    <Avatar
                      className="bg-gradient-to-br from-orange-6 to-orange-8"
                      radius="md"
                      size="md"
                      variant="filled"
                    >
                      <Music size={20} />
                    </Avatar>
                  )}
                  {type === "tracks" && (
                    <div className="absolute inset-0 bg-dark-9/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Play
                        className="text-orange-5"
                        fill="var(--color-orange-5)"
                        size={16}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Text
                    className={`font-medium text-dark-0 ${type === "tracks" ? "group-hover:text-orange-5" : ""} transition-colors`}
                    lineClamp={1}
                    size="sm"
                  >
                    {item.name}
                  </Text>
                  {item.info && (
                    <Text className="text-dark-3" lineClamp={1} size="xs">
                      {item.info}
                    </Text>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Text className="text-dark-1 font-semibold" size="sm">
                    {item.count}
                  </Text>
                  <Text className="text-dark-3" size="xs">
                    plays
                  </Text>
                </div>
              </Group>
            ))
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
