import { Button, Center, Group, Loader, Stack, Text } from "@mantine/core";
import { keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { useCallback } from "react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { getNextSortState } from "@/hooks/useTrackTableSort";
import { useTrackView } from "@/hooks/useTrackView";
import { trackPlaylistViewed } from "@/lib/posthog";

import {
  PaginatedTracksDto,
  PlaylistsControllerGetTracksSortBy,
  usePlaylistsControllerFindOne,
  usePlaylistsControllerGetTracks,
} from "../data/api";
import { Route } from "../routes/~smart-playlists.$id";
import { TracksTableWithControls } from "./TracksTableWithControls";

interface PlaylistTracksProps {
  playlistId: string;
}

export function PlaylistTracks({ playlistId }: PlaylistTracksProps) {
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    page = 1,
    pageSize = 20,
    sortBy,
    sortOrder = "desc",
  } = Route.useSearch();
  const { playTrackList } = useSpotifyPlayer();

  const { data: playlist, isLoading: playlistLoading } =
    usePlaylistsControllerFindOne(playlistId);
  const { data, error, isLoading, refetch } =
    usePlaylistsControllerGetTracks<PaginatedTracksDto>(
      playlistId,
      {
        page,
        pageSize,
        sortBy: sortBy as PlaylistsControllerGetTracksSortBy | undefined,
        sortOrder,
      },
      { query: { placeholderData: keepPreviousData } },
    );

  // Track playlist view once data is loaded
  const trackCount = data?.total || data?.tracks?.length || 0;
  useTrackView(
    playlistId,
    isLoading,
    !!data?.tracks,
    useCallback(() => trackPlaylistViewed(trackCount), [trackCount]),
  );

  const handlePlayFromBeginning = async () => {
    // Backend will build the queue based on context
    await playTrackList(["placeholder"], {
      contextId: playlistId,
      contextType: "smart_playlist",
      shuffle: false,
    });
  };

  const handlePlayShuffled = async () => {
    // Backend will build the shuffled queue based on context
    await playTrackList(["placeholder"], {
      contextId: playlistId,
      contextType: "smart_playlist",
      shuffle: true,
    });
  };

  if (playlistLoading) {
    return (
      <Center className="h-[400px]">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <div>
          <Button
            className="mb-2"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate({ to: "/smart-playlists" })}
            size="xs"
            variant="subtle"
          >
            Back to Playlists
          </Button>
          <Text className="mb-2 font-bold" size="lg">
            {playlist?.name}
          </Text>
          {playlist?.description && (
            <Text className="text-gray-600" size="sm">
              {playlist.description}
            </Text>
          )}
        </div>
        <Group gap="sm">
          <Button
            disabled={!data?.tracks || data.tracks.length === 0}
            leftSection={<Play size={16} />}
            onClick={handlePlayFromBeginning}
            variant="filled"
          >
            Play
          </Button>
          <Button
            disabled={!data?.tracks || data.tracks.length === 0}
            leftSection={<Shuffle size={16} />}
            onClick={handlePlayShuffled}
            variant="outline"
          >
            Shuffle
          </Button>
        </Group>
      </Group>

      <TracksTableWithControls
        contextId={playlistId}
        contextType="smart_playlist"
        data={data}
        error={error}
        hideSearch
        isLoading={isLoading}
        onPageChange={(newPage) =>
          navigate({ search: (prev) => ({ ...prev, page: newPage }) })
        }
        onPageSizeChange={(newPageSize) =>
          navigate({
            search: (prev) => ({ ...prev, page: 1, pageSize: newPageSize }),
          })
        }
        onRefetch={refetch}
        onSortChange={(columnId) =>
          navigate({
            search: (prev) => ({
              ...prev,
              ...getNextSortState(columnId, sortBy, sortOrder),
            }),
          })
        }
        page={page}
        pageSize={pageSize}
        showSelection
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </Stack>
  );
}
