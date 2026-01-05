import {
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, RefreshCw, Shuffle } from "lucide-react";
import { useCallback, useState } from "react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { getNextSortState } from "@/hooks/useTrackTableSort";
import { useTrackView } from "@/hooks/useTrackView";
import { trackPlaylistViewed } from "@/lib/posthog";

import {
  getPlaylistsControllerFindOneQueryKey,
  PaginatedTracksDto,
  PlaylistsControllerGetTracksSortBy,
  usePlaylistsControllerFindOne,
  usePlaylistsControllerGetTracks,
  usePlaylistsControllerSyncToSpotify,
  usePlaylistsControllerUpdate,
} from "../data/api";
import { Route } from "../routes/~smart-playlists.$id";
import { TracksTableWithControls } from "./TracksTableWithControls";

interface PlaylistTracksProps {
  playlistId: string;
}

export function PlaylistTracks({ playlistId }: PlaylistTracksProps) {
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const {
    page = 1,
    pageSize = 20,
    sortBy,
    sortOrder = "desc",
  } = Route.useSearch();
  const { playTrackList } = useSpotifyPlayer();
  const [isSyncing, setIsSyncing] = useState(false);

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

  const syncMutation = usePlaylistsControllerSyncToSpotify();
  const updateMutation = usePlaylistsControllerUpdate();

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

  const handleSyncToSpotify = async () => {
    setIsSyncing(true);
    try {
      const result = await syncMutation.mutateAsync({ id: playlistId });
      notifications.show({
        color: "green",
        message: `Synced ${result.trackCount} tracks to Spotify`,
        title: "Playlist synced",
      });
      // Invalidate the playlist query to update lastSyncedAt
      await queryClient.invalidateQueries({
        queryKey: getPlaylistsControllerFindOneQueryKey(playlistId),
      });
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to sync playlist to Spotify. Please try again.",
        title: "Sync failed",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoSyncToggle = async (checked: boolean) => {
    try {
      await updateMutation.mutateAsync({
        data: { autoSync: checked },
        id: playlistId,
      });
      await queryClient.invalidateQueries({
        queryKey: getPlaylistsControllerFindOneQueryKey(playlistId),
      });
      notifications.show({
        color: "green",
        message: checked
          ? "Playlist will sync automatically every day"
          : "Automatic sync disabled",
        title: checked ? "Auto-sync enabled" : "Auto-sync disabled",
      });
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to update auto-sync setting",
        title: "Update failed",
      });
    }
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
          {playlist?.lastSyncedAt && (
            <Text className="text-gray-500" size="xs">
              Last synced: {new Date(playlist.lastSyncedAt).toLocaleString()}
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
          <Tooltip
            label={
              playlist?.spotifyPlaylistId
                ? "Update playlist on Spotify"
                : "Create playlist on Spotify"
            }
          >
            <Button
              disabled={!data?.tracks || data.tracks.length === 0 || isSyncing}
              leftSection={
                <RefreshCw
                  className={isSyncing ? "animate-spin" : ""}
                  size={16}
                />
              }
              loading={isSyncing}
              onClick={handleSyncToSpotify}
              variant="light"
            >
              {playlist?.spotifyPlaylistId ? "Resync" : "Sync to Spotify"}
            </Button>
          </Tooltip>
          {playlist?.spotifyPlaylistId && (
            <Tooltip label="When enabled, this playlist will automatically sync to Spotify daily">
              <Switch
                checked={playlist?.autoSync ?? true}
                disabled={updateMutation.isPending}
                label="Auto-sync"
                onChange={(event) =>
                  handleAutoSyncToggle(event.currentTarget.checked)
                }
              />
            </Tooltip>
          )}
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
