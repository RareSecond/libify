import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Link } from "@tanstack/react-router";
import { Edit, Music, Plus, Trash } from "lucide-react";
import { useState } from "react";

import {
  SmartPlaylistWithTracksDto,
  usePlaylistsControllerFindAll,
  usePlaylistsControllerRemove,
} from "../data/api";
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
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Smart Playlists</Title>
        <Button leftSection={<Plus size={16} />} onClick={handleCreate}>
          Create Playlist
        </Button>
      </Group>

      {playlists?.length === 0 ? (
        <Card className="p-8" radius="md" shadow="xs">
          <Center>
            <Stack align="center" gap="md">
              <Music className="opacity-50" size={48} />
              <Text className="text-gray-600" size="lg">
                No smart playlists yet
              </Text>
              <Button onClick={handleCreate} variant="light">
                Create your first playlist
              </Button>
            </Stack>
          </Center>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists?.map((playlist) => (
            <Card
              className="p-6"
              key={playlist.id}
              radius="md"
              shadow="xs"
              withBorder
            >
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text className="font-semibold" size="lg">
                    {playlist.name}
                  </Text>
                  <Group gap="xs">
                    <ActionIcon
                      onClick={() => handleEdit(playlist)}
                      size="sm"
                      variant="subtle"
                    >
                      <Edit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      onClick={() => handleDelete(playlist.id, playlist.name)}
                      size="sm"
                      variant="subtle"
                    >
                      <Trash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>

                {playlist.description && (
                  <Text className="text-gray-600" size="sm">
                    {playlist.description}
                  </Text>
                )}

                <Box>
                  <Text className="text-xs uppercase text-gray-600">
                    {playlist.criteria.logic === "or"
                      ? "Match any"
                      : "Match all"}{" "}
                    of:
                  </Text>
                  <Stack className="mt-1" gap={4}>
                    {playlist.criteria.rules.slice(0, 3).map((rule, index) => {
                      const operatorsWithNoValue = [
                        "isNull",
                        "isNotNull",
                        "hasAnyTag",
                        "hasNoTags",
                      ];
                      const hasValue = !operatorsWithNoValue.includes(
                        rule.operator,
                      );

                      return (
                        <Text key={index} size="sm">
                          • {rule.field} {rule.operator}
                          {hasValue && " "}
                          {hasValue &&
                            (rule.value ||
                              rule.numberValue ||
                              `${rule.daysValue} days`)}
                        </Text>
                      );
                    })}
                    {playlist.criteria.rules.length > 3 && (
                      <Text className="text-gray-600" size="sm">
                        + {playlist.criteria.rules.length - 3} more rules
                      </Text>
                    )}
                  </Stack>
                </Box>

                <Group justify="space-between">
                  <Text className="text-gray-600" size="sm">
                    {playlist.trackCount} tracks
                  </Text>
                  <Link
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    params={{ id: playlist.id }}
                    to="/playlists/$id"
                  >
                    <Button size="xs" variant="light">
                      View Tracks
                    </Button>
                  </Link>
                </Group>
              </Stack>
            </Card>
          ))}
        </div>
      )}

      <Modal
        onClose={close}
        opened={opened}
        size="lg"
        title={
          editingPlaylist ? "Edit Smart Playlist" : "Create Smart Playlist"
        }
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
