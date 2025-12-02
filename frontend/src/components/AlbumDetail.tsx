import {
  Box,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Music, Play, Shuffle, Star } from "lucide-react";
import { useCallback } from "react";

import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useTrackView } from "@/hooks/useTrackView";
import { trackAlbumViewed } from "@/lib/posthog";

import { TrackDto, useLibraryControllerGetAlbumTracks } from "../data/api";
import { useColumnVisibility } from "../hooks/useColumnVisibility";
import { formatDurationDetailed } from "../utils/format";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { TracksTable } from "./TracksTable";

interface AlbumDetailProps {
  album: string;
  artist: string;
}

export function AlbumDetail({ album, artist }: AlbumDetailProps) {
  const navigate = useNavigate();
  const { playTrackList } = useSpotifyPlayer();
  const { columnVisibility, setColumnVisibility, toggleColumnVisibility } =
    useColumnVisibility();

  // Use the album-specific endpoint
  const { data, error, isLoading, refetch } =
    useLibraryControllerGetAlbumTracks(artist, album);

  // Track album view once data is loaded
  const albumIdentity = `${artist}/${album}`;
  const trackCount = data?.tracks?.length ?? 0;
  useTrackView(
    albumIdentity,
    isLoading,
    !!data?.tracks,
    useCallback(() => trackAlbumViewed(album, trackCount), [album, trackCount]),
  );

  // Get albumId from first track for playback context
  const albumId = data?.tracks?.[0]?.albumId;

  const handlePlayFromBeginning = async () => {
    if (!albumId) return;
    await playTrackList(["placeholder"], {
      contextId: albumId,
      contextType: "album",
      shuffle: false,
    });
  };

  const handlePlayShuffled = async () => {
    if (!albumId) return;
    await playTrackList(["placeholder"], {
      contextId: albumId,
      contextType: "album",
      shuffle: true,
    });
  };

  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading album: {(error as Error).message}
        </Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center className="h-[400px]">
        <Loader size="lg" />
      </Center>
    );
  }

  // data contains an object with tracks property
  const tracks: TrackDto[] = data?.tracks || [];
  const albumArt = tracks[0]?.albumArt;
  const totalDuration = tracks.reduce(
    (sum: number, track: TrackDto) => sum + track.duration,
    0,
  );
  const totalPlayCount = tracks.reduce(
    (sum: number, track: TrackDto) => sum + track.totalPlayCount,
    0,
  );
  const avgRating =
    tracks.length > 0 && tracks.filter((t: TrackDto) => t.rating).length > 0
      ? tracks
          .filter((t: TrackDto) => t.rating)
          .reduce(
            (sum: number, track: TrackDto) => sum + (track.rating || 0),
            0,
          ) / tracks.filter((t: TrackDto) => t.rating).length
      : null;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Button
          leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate({ to: "/albums" })}
          size="xs"
          variant="subtle"
        >
          Back to Albums
        </Button>
        <Group gap="xs">
          <Button
            disabled={tracks.length === 0}
            leftSection={<Play size={16} />}
            onClick={handlePlayFromBeginning}
            size="sm"
            variant="filled"
          >
            Play
          </Button>
          <Button
            disabled={tracks.length === 0}
            leftSection={<Shuffle size={16} />}
            onClick={handlePlayShuffled}
            size="sm"
            variant="outline"
          >
            Shuffle
          </Button>
        </Group>
      </Group>

      <Paper className="p-6" radius="md" shadow="xs">
        <Group align="start" gap="xl" wrap="nowrap">
          <Box>
            {albumArt ? (
              <Image
                alt={album}
                className="h-[200px] w-[200px] object-cover"
                fallbackSrc="/placeholder-album.svg"
                radius="md"
                src={albumArt}
              />
            ) : (
              <Center className="h-[200px] w-[200px] rounded-lg bg-gray-200">
                <Music color="gray" size={48} />
              </Center>
            )}
          </Box>

          <Stack className="flex-1" gap="sm">
            <div>
              <Title order={2}>{album}</Title>
              <Text className="text-gray-600" size="lg">
                {artist}
              </Text>
            </div>

            <Group gap="xl">
              <Group gap="xs">
                <Text className="text-gray-600" size="sm">
                  Tracks:
                </Text>
                <Text className="font-medium">{tracks.length}</Text>
              </Group>

              <Group gap="xs">
                <Clock className="opacity-50" size={16} />
                <Text className="font-medium">
                  {formatDurationDetailed(totalDuration)}
                </Text>
              </Group>

              <Group gap="xs">
                <Play className="opacity-50" size={16} />
                <Text className="font-medium">{totalPlayCount} plays</Text>
              </Group>

              {avgRating && (
                <Group gap="xs">
                  <Star className="opacity-50" size={16} />
                  <Text className="font-medium">{avgRating.toFixed(1)}</Text>
                </Group>
              )}
            </Group>
          </Stack>
        </Group>
      </Paper>

      <Paper className="p-4" radius="md" shadow="xs">
        <Group className="mb-2" justify="space-between">
          <Text className="text-sm text-gray-600">Album Tracks</Text>
          <ColumnVisibilityMenu
            columnVisibility={columnVisibility}
            onToggle={toggleColumnVisibility}
          />
        </Group>

        <TracksTable
          columnVisibility={columnVisibility}
          contextId={albumId}
          contextType="album"
          isLoading={false}
          onColumnVisibilityChange={setColumnVisibility}
          onRefetch={refetch}
          tracks={tracks}
        />
      </Paper>
    </Stack>
  );
}
