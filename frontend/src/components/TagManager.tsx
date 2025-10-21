import {
  ActionIcon,
  Badge,
  Button,
  ColorInput,
  Group,
  Modal,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useLibraryControllerAddTagToTrack,
  useLibraryControllerCreateTag,
  useLibraryControllerDeleteTag,
  useLibraryControllerGetTags,
  useLibraryControllerRemoveTagFromTrack,
  useLibraryControllerUpdateTag,
} from "../data/api";

interface TagManagerProps {
  onTagsChange?: () => void;
  trackId?: string;
  trackTags?: Array<{ color?: string; id: string; name: string }>;
}

export function TagManager({
  onTagsChange,
  trackId,
  trackTags = [],
}: TagManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<null | {
    color?: string;
    id: string;
    name: string;
  }>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    trackTags.map((t) => t.name),
  );

  const { data: allTags = [], refetch: refetchTags } =
    useLibraryControllerGetTags();
  const createTagMutation = useLibraryControllerCreateTag();
  const updateTagMutation = useLibraryControllerUpdateTag();
  const deleteTagMutation = useLibraryControllerDeleteTag();
  const addTagToTrackMutation = useLibraryControllerAddTagToTrack();
  const removeTagFromTrackMutation = useLibraryControllerRemoveTagFromTrack();

  // Sync selected tags when trackTags change
  useEffect(() => {
    setSelectedTags(trackTags.map((t) => t.name));
  }, [trackTags]);

  const form = useForm({
    initialValues: { color: "#339af0", name: "" },
    validate: {
      name: (value: string) => (!value.trim() ? "Tag name is required" : null),
    },
  });

  const handleCreateTag = async (values: { color: string; name: string }) => {
    try {
      await createTagMutation.mutateAsync({
        data: { color: values.color, name: values.name },
      });
      notifications.show({
        color: "green",
        message: `Tag "${values.name}" has been created`,
        title: "Tag created",
      });
      form.reset();
      refetchTags();
    } catch {
      notifications.show({
        color: "red",
        message: "Please try again",
        title: "Failed to create tag",
      });
    }
  };

  const handleUpdateTag = async (
    tagId: string,
    values: { color?: string; name?: string },
  ) => {
    try {
      await updateTagMutation.mutateAsync({ data: values, tagId });
      notifications.show({
        color: "green",
        message: "Tag has been updated successfully",
        title: "Tag updated",
      });
      setEditingTag(null);
      refetchTags();
      onTagsChange?.();
    } catch {
      notifications.show({
        color: "red",
        message: "Please try again",
        title: "Failed to update tag",
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTagMutation.mutateAsync({ tagId });
      notifications.show({
        color: "green",
        message: "Tag has been deleted successfully",
        title: "Tag deleted",
      });
      refetchTags();
      onTagsChange?.();
    } catch {
      notifications.show({
        color: "red",
        message: "Please try again",
        title: "Failed to delete tag",
      });
    }
  };

  const handleAddTagToTrack = async (tagId: string) => {
    if (!trackId) return;

    try {
      await addTagToTrackMutation.mutateAsync({ data: { tagId }, trackId });
      notifications.show({
        color: "green",
        message: "Tag has been added to the track",
        title: "Tag added",
      });
      onTagsChange?.();
    } catch {
      notifications.show({
        color: "red",
        message: "Please try again",
        title: "Failed to add tag",
      });
    }
  };

  const handleRemoveTagFromTrack = async (tagId: string) => {
    if (!trackId) return;

    try {
      await removeTagFromTrackMutation.mutateAsync({ tagId, trackId });
      notifications.show({
        color: "green",
        message: "Tag has been removed from the track",
        title: "Tag removed",
      });
      onTagsChange?.();
    } catch {
      notifications.show({
        color: "red",
        message: "Please try again",
        title: "Failed to remove tag",
      });
    }
  };

  const handleTagsChange = async (values: string[]) => {
    if (!trackId) return;

    const currentTagNames = trackTags.map((t) => t.name);
    const newTagNames = values.filter((v) => !currentTagNames.includes(v));
    const removedTagNames = currentTagNames.filter((v) => !values.includes(v));

    // Handle new tags
    for (const tagName of newTagNames) {
      let tag = allTags.find((t) => t.name === tagName);

      // Create tag if it doesn't exist
      if (!tag) {
        try {
          const response = await createTagMutation.mutateAsync({
            data: { color: "#339af0", name: tagName },
          });
          await refetchTags();
          tag = response;
        } catch {
          notifications.show({
            color: "red",
            message: `Could not create tag "${tagName}"`,
            title: "Failed to create tag",
          });
          continue;
        }
      }

      // Add tag to track
      if (tag) {
        await handleAddTagToTrack(tag.id);
      }
    }

    // Handle removed tags
    for (const tagName of removedTagNames) {
      const tag = trackTags.find((t) => t.name === tagName);
      if (tag) {
        await handleRemoveTagFromTrack(tag.id);
      }
    }

    setSelectedTags(values);
  };

  return (
    <>
      <Stack gap="md">
        {trackId && (
          <div>
            <TagsInput
              clearable
              data={allTags.map((tag) => tag.name)}
              label="Track Tags"
              onChange={handleTagsChange}
              placeholder="Add tags to this track"
              renderOption={({ option }) => {
                const tag = allTags.find((t) => t.name === option.value);
                return (
                  <Group gap="xs">
                    <Badge color={tag?.color || "gray"} size="sm">
                      {option.value}
                    </Badge>
                  </Group>
                );
              }}
              value={selectedTags}
            />
          </div>
        )}

        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">
              All Tags
            </Text>
            <Button
              leftSection={<Plus size={14} />}
              onClick={() => setIsModalOpen(true)}
              size="xs"
            >
              Create Tag
            </Button>
          </Group>
          <Stack gap="xs">
            {allTags.length === 0 ? (
              <Text c="dimmed" size="sm">
                No tags created yet
              </Text>
            ) : (
              allTags.map((tag) => (
                <Group justify="space-between" key={tag.id}>
                  <Badge color={tag.color || "gray"}>{tag.name}</Badge>
                  <Group gap="xs">
                    {trackId && !trackTags.some((t) => t.id === tag.id) && (
                      <ActionIcon
                        onClick={() => handleAddTagToTrack(tag.id)}
                        size="sm"
                        variant="subtle"
                      >
                        <Plus size={16} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      onClick={() => {
                        setEditingTag(tag);
                        form.setValues({
                          color: tag.color || "#339af0",
                          name: tag.name,
                        });
                        setIsModalOpen(true);
                      }}
                      size="sm"
                      variant="subtle"
                    >
                      <Edit2 size={16} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      onClick={() => handleDeleteTag(tag.id)}
                      size="sm"
                      variant="subtle"
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))
            )}
          </Stack>
        </div>
      </Stack>

      <Modal
        onClose={() => {
          setIsModalOpen(false);
          setEditingTag(null);
          form.reset();
        }}
        opened={isModalOpen}
        title={editingTag ? "Edit Tag" : "Create New Tag"}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            if (editingTag) {
              handleUpdateTag(editingTag.id, values);
            } else {
              handleCreateTag(values);
            }
            setIsModalOpen(false);
          })}
        >
          <Stack>
            <TextInput
              label="Tag Name"
              placeholder="Enter tag name"
              {...form.getInputProps("name")}
            />
            <ColorInput
              label="Tag Color"
              placeholder="Choose a color"
              {...form.getInputProps("color")}
            />
            <Group justify="flex-end">
              <Button onClick={() => setIsModalOpen(false)} variant="subtle">
                Cancel
              </Button>
              <Button type="submit">
                {editingTag ? "Update" : "Create"} Tag
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
