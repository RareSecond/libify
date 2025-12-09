import {
  Avatar,
  Card,
  Center,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Clock, Music, Play } from "lucide-react";

import { useSpotifyPlayer } from "../../contexts/SpotifyPlayerContext";
import { useLibraryControllerGetPlayHistory } from "../../data/api";
import { formatDate } from "../../utils/format";

export function RecentlyPlayed() {
  const { playTrackList } = useSpotifyPlayer();
  const { data, isLoading } = useLibraryControllerGetPlayHistory({
    page: 1,
    pageSize: 10,
  });

  const handlePlayTrack = async (
    trackTitle: string,
    spotifyId: string,
    trackId: string,
  ) => {
    try {
      await playTrackList(
        [{ spotifyUri: `spotify:track:${spotifyId}`, trackId }],
        { contextId: `spotify:track:${spotifyId}`, contextType: "track" },
      );

      notifications.show({
        color: "orange",
        message: trackTitle,
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

  if (isLoading) {
    return (
      <Card
        className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
        padding="lg"
        radius="md"
        shadow="md"
        withBorder
      >
        <Center className="h-[300px]">
          <Loader color="orange" size="lg" />
        </Center>
      </Card>
    );
  }

  const items = data?.items || [];

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
          <Clock color="var(--color-orange-5)" size={20} />
          <Title className="text-dark-0" order={3}>
            Recently Played
          </Title>
        </Group>

        <ScrollArea className="h-[400px]" type="auto">
          <Stack gap="xs">
            {items.length === 0 ? (
              <Center className="h-[300px]">
                <Stack align="center" gap="md">
                  <Music color="var(--color-dark-3)" size={48} />
                  <Text className="text-dark-1">No recent plays yet</Text>
                </Stack>
              </Center>
            ) : (
              items.map((item) => (
                <Group
                  className="p-3 rounded-md hover:bg-dark-6 cursor-pointer transition-all duration-200 group"
                  gap="md"
                  key={item.id}
                  onClick={() =>
                    handlePlayTrack(
                      item.trackTitle,
                      item.trackSpotifyId,
                      item.trackId,
                    )
                  }
                  wrap="nowrap"
                >
                  <div className="relative">
                    {item.trackAlbumArt ? (
                      <Avatar radius="md" size="lg" src={item.trackAlbumArt} />
                    ) : (
                      <Avatar
                        className="bg-gradient-to-br from-orange-6 to-orange-8"
                        radius="md"
                        size="lg"
                        variant="filled"
                      >
                        <Music size={24} />
                      </Avatar>
                    )}
                    {/* Play icon overlay on hover */}
                    <div className="absolute inset-0 bg-dark-9/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Play
                        className="text-orange-5"
                        fill="var(--color-orange-5)"
                        size={20}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Text
                      className="font-medium text-dark-0 group-hover:text-orange-5 transition-colors"
                      lineClamp={1}
                      size="sm"
                    >
                      {item.trackTitle}
                    </Text>
                    <Text className="text-dark-1" lineClamp={1} size="xs">
                      {item.trackArtist}
                    </Text>
                  </div>

                  <Text className="text-dark-1 text-right" size="xs">
                    {formatDate(item.playedAt)}
                  </Text>
                </Group>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Card>
  );
}
