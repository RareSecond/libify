import {
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { useCallback } from "react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { useTrackView } from "@/hooks/useTrackView";
import { trackArtistViewed } from "@/lib/posthog";

import { useLibraryControllerGetArtistTracks } from "../data/api";
import { TracksTableWithControls } from "./TracksTableWithControls";

interface ArtistDetailProps {
  artist: string;
}

export function ArtistDetail({ artist }: ArtistDetailProps) {
  const navigate = useNavigate();
  const { playTrackList } = useSpotifyPlayer();
  const { data, error, isLoading, refetch } =
    useLibraryControllerGetArtistTracks(artist);

  // Track artist view once data is loaded
  const trackCount = data?.tracks?.length ?? 0;
  useTrackView(
    artist,
    isLoading,
    !!data?.tracks,
    useCallback(
      () => trackArtistViewed(artist, trackCount),
      [artist, trackCount],
    ),
  );

  // Get artistId from first track for playback context
  const artistId = data?.tracks?.[0]?.artistId;

  const handlePlayFromBeginning = async () => {
    if (!artistId) return;
    await playTrackList(["placeholder"], {
      contextId: artistId,
      contextType: "artist",
      shuffle: false,
    });
  };

  const handlePlayShuffled = async () => {
    if (!artistId) return;
    await playTrackList(["placeholder"], {
      contextId: artistId,
      contextType: "artist",
      shuffle: true,
    });
  };

  if (isLoading) {
    return (
      <Center className="h-[400px]">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading artist tracks: {error.message}
        </Text>
      </Center>
    );
  }

  const tracks = data?.tracks || [];

  if (tracks.length === 0) {
    return (
      <Center className="h-[400px]">
        <Text className="text-lg text-gray-600">
          No tracks found for this artist
        </Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Button
          leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate({ to: "/artists" })}
          size="xs"
          variant="subtle"
        >
          Back to Artists
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

      <Title className="mb-2" order={3}>
        {artist}
      </Title>
      <TracksTableWithControls
        contextId={artistId}
        contextType="artist"
        data={{
          page: 1,
          pageSize: tracks.length,
          total: tracks.length,
          totalPages: 1,
          tracks,
        }}
        hidePageSize
        hideSearch
        onRefetch={refetch}
        showSelection
      />
    </Stack>
  );
}
