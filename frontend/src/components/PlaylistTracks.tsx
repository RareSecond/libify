import { Button, Center, Group, Loader, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { useCallback, useState } from "react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { useTrackView } from "@/hooks/useTrackView";
import { trackPlaylistViewed } from "@/lib/posthog";

import {
  PaginatedTracksDto,
  PlaylistsControllerGetTracksSortBy,
  usePlaylistsControllerFindOne,
  usePlaylistsControllerGetTracks,
} from "../data/api";
import { TracksTableWithControls } from "./TracksTableWithControls";

interface PlaylistTracksProps {
  playlistId: string;
}

export function PlaylistTracks({ playlistId }: PlaylistTracksProps) {
  const navigate = useNavigate();
  const { playTrackList } = useSpotifyPlayer();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<
    PlaylistsControllerGetTracksSortBy | undefined
  >();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: playlist, isLoading: playlistLoading } =
    usePlaylistsControllerFindOne(playlistId);
  const { data, error, isLoading, refetch } =
    usePlaylistsControllerGetTracks<PaginatedTracksDto>(playlistId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

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
            onClick={() => navigate({ to: "/playlists" })}
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
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newPageSize) => {
          setPage(1);
          setPageSize(newPageSize);
        }}
        onRefetch={refetch}
        onSortChange={(columnId) => {
          // If clicking the same column, toggle sort order
          if (columnId === sortBy) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          } else {
            // If clicking a new column, set to desc by default
            setSortBy(columnId as PlaylistsControllerGetTracksSortBy);
            setSortOrder("desc");
          }
        }}
        page={page}
        pageSize={pageSize}
        showSelection
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </Stack>
  );
}
