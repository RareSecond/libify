import {
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, Shuffle } from "lucide-react";

import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";

import { useLibraryControllerGetArtistTracks } from "../data/api";
import { useColumnVisibility } from "../hooks/useColumnVisibility";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { TracksTable } from "./TracksTable";

interface ArtistDetailProps {
  artist: string;
}

export function ArtistDetail({ artist }: ArtistDetailProps) {
  const navigate = useNavigate();
  const { playTrackList } = useSpotifyPlayer();
  const { data, error, isLoading, refetch } =
    useLibraryControllerGetArtistTracks(artist);
  const { columnVisibility, setColumnVisibility, toggleColumnVisibility } =
    useColumnVisibility();

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

      <Paper className="p-4" radius="md" shadow="xs">
        <Group className="mb-4" justify="space-between">
          <Title order={3}>{artist}</Title>
          <ColumnVisibilityMenu
            columnVisibility={columnVisibility}
            onToggle={toggleColumnVisibility}
          />
        </Group>
        <TracksTable
          columnVisibility={columnVisibility}
          contextId={artistId}
          contextType="artist"
          onColumnVisibilityChange={setColumnVisibility}
          onRefetch={refetch}
          tracks={tracks}
        />
      </Paper>
    </Stack>
  );
}
