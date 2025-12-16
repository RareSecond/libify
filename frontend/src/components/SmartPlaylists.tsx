import {
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { ListMusic, Music, Plus, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

import {
  SmartPlaylistWithTracksDto,
  usePlaylistsControllerFindAll,
  usePlaylistsControllerRemove,
} from "../data/api";
import { SmartPlaylistCard } from "./cards/SmartPlaylistCard";
import { PlaylistEditor } from "./PlaylistEditor";

export function SmartPlaylists() {
  const [opened, { close, open }] = useDisclosure(false);
  const [editingPlaylist, setEditingPlaylist] =
    useState<null | SmartPlaylistWithTracksDto>(null);

  const {
    data: playlists,
    isLoading,
    refetch,
  } = usePlaylistsControllerFindAll();
  const deleteMutation = usePlaylistsControllerRemove();

  const handleCreate = () => {
    setEditingPlaylist(null);
    open();
  };

  const handleEdit = (playlist: SmartPlaylistWithTracksDto) => {
    setEditingPlaylist(playlist);
    open();
  };

  const handleDelete = async (playlistId: string, playlistName: string) => {
    if (!confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: playlistId });
      notifications.show({
        color: "green",
        message: "Playlist deleted successfully",
      });
      refetch();
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to delete playlist",
      });
    }
  };

  const handleSave = () => {
    close();
    refetch();
  };

  if (isLoading) {
    return (
      <Center className="h-[400px]">
        <Loader color="orange" size="lg" />
      </Center>
    );
  }

  const totalTracks = playlists?.reduce((sum, p) => sum + p.trackCount, 0) || 0;

  return (
    <Stack gap="xl">
      {/* Hero Header */}
      <Card
        className="bg-gradient-to-br from-dark-7 via-dark-8 to-dark-9 border-dark-5 relative overflow-hidden"
        padding="xl"
        radius="lg"
        shadow="lg"
        withBorder
      >
        <div className="absolute right-0 top-0 opacity-10">
          <Sparkles className="text-orange-5" size={200} />
        </div>
        <Group justify="space-between" wrap="wrap">
          <div className="relative z-10">
            <Group className="mb-2" gap="xs">
              <Zap className="text-orange-5" size={24} />
              <Text className="text-dark-1 uppercase tracking-wider text-xs font-semibold">
                Dynamic Collections
              </Text>
            </Group>
            <Text className="text-dark-0 font-bold text-2xl md:text-3xl mb-2">
              Smart Playlists
            </Text>
            <Text className="text-dark-1 max-w-md">
              Create playlists that automatically update based on your rules.
              Filter by rating, tags, play count, and more.
            </Text>
            {playlists && playlists.length > 0 && (
              <Group className="mt-4" gap="lg">
                <Group gap="xs">
                  <ListMusic className="text-orange-5" size={16} />
                  <Text className="text-dark-0 font-medium">
                    {playlists.length}{" "}
                    {playlists.length === 1 ? "playlist" : "playlists"}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Music className="text-orange-5" size={16} />
                  <Text className="text-dark-0 font-medium">
                    {totalTracks.toLocaleString()} total tracks
                  </Text>
                </Group>
              </Group>
            )}
          </div>
          <Button
            className="bg-gradient-to-r from-orange-6 to-orange-7 hover:from-orange-5 hover:to-orange-6 border-none shadow-lg shadow-orange-9/30"
            leftSection={<Plus size={18} />}
            onClick={handleCreate}
            size="lg"
          >
            Create Playlist
          </Button>
        </Group>
      </Card>

      {/* Playlists Grid or Empty State */}
      {playlists?.length === 0 ? (
        <Card
          className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 border-dashed"
          padding="xl"
          radius="lg"
          withBorder
        >
          <Center>
            <Stack align="center" className="py-8" gap="lg">
              <div className="p-6 rounded-full bg-dark-6">
                <Sparkles className="text-orange-5" size={48} />
              </div>
              <div className="text-center">
                <Text className="text-dark-0 font-semibold text-xl mb-2">
                  No smart playlists yet
                </Text>
                <Text className="text-dark-1 max-w-sm">
                  Create your first smart playlist to automatically organize
                  your music based on custom rules.
                </Text>
              </div>
              <Button
                className="mt-2"
                color="orange"
                leftSection={<Plus size={16} />}
                onClick={handleCreate}
                size="md"
              >
                Create your first playlist
              </Button>
            </Stack>
          </Center>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {playlists?.map((playlist) => (
            <SmartPlaylistCard
              key={playlist.id}
              onDelete={() => handleDelete(playlist.id, playlist.name)}
              onEdit={() => handleEdit(playlist)}
              playlist={playlist}
            />
          ))}
        </div>
      )}

      <Modal
        classNames={{ body: "pb-24 md:pb-32" }}
        onClose={close}
        opened={opened}
        size="lg"
        title={
          editingPlaylist ? "Edit Smart Playlist" : "Create Smart Playlist"
        }
        zIndex={300}
      >
        <PlaylistEditor
          onCancel={close}
          onSave={handleSave}
          playlist={editingPlaylist}
        />
      </Modal>
    </Stack>
  );
}
