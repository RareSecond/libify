import { Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";

import { DEFAULT_TAG_COLOR } from "../constants/tags";
import {
  useLibraryControllerAddTagToTrack,
  useLibraryControllerCreateTag,
  useLibraryControllerDeleteTag,
  useLibraryControllerGetTags,
  useLibraryControllerRemoveTagFromTrack,
  useLibraryControllerUpdateTag,
} from "../data/api";
import {
  trackTagApplied,
  trackTagCreated,
  trackTagRemoved,
} from "../lib/posthog";
import { TagFormModal } from "./tags/TagFormModal";
import { TagList } from "./tags/TagList";
import { TrackTagsInput } from "./tags/TrackTagsInput";

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
  useEffect(() => {
    setSelectedTags(trackTags.map((t) => t.name));
  }, [trackTags]);

  const form = useForm({
    initialValues: { color: DEFAULT_TAG_COLOR, name: "" },
    validate: {
      name: (value: string) => (!value.trim() ? "Tag name is required" : null),
    },
  });

  const handleCreateTag = async (values: { color: string; name: string }) => {
    try {
      await createTagMutation.mutateAsync({
        data: { color: values.color, name: values.name },
      });
      trackTagCreated(values.name);
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
      trackTagApplied(1);
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
      trackTagRemoved();
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

    for (const tagName of newTagNames) {
      let tag = allTags.find((t) => t.name === tagName);

      if (!tag) {
        try {
          const response = await createTagMutation.mutateAsync({
            data: { color: DEFAULT_TAG_COLOR, name: tagName },
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

      if (tag) {
        await handleAddTagToTrack(tag.id);
      }
    }

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
          <TrackTagsInput
            allTags={allTags}
            onChange={handleTagsChange}
            selectedTags={selectedTags}
          />
        )}

        <TagList
          onAddTagToTrack={handleAddTagToTrack}
          onCreateClick={() => setIsModalOpen(true)}
          onDeleteTag={handleDeleteTag}
          onEditTag={(tag) => {
            setEditingTag(tag);
            form.setValues({
              color: tag.color || DEFAULT_TAG_COLOR,
              name: tag.name,
            });
            setIsModalOpen(true);
          }}
          tags={allTags}
          trackId={trackId}
          trackTags={trackTags}
        />
      </Stack>

      <TagFormModal
        editingTag={editingTag}
        form={form}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTag(null);
          form.reset();
        }}
        onSubmit={(values) => {
          if (editingTag) {
            handleUpdateTag(editingTag.id, values);
          } else {
            handleCreateTag(values);
          }
          setIsModalOpen(false);
        }}
        opened={isModalOpen}
      />
    </>
  );
}
