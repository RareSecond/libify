import { Badge, Popover, TagsInput, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Tag } from "lucide-react";
import { useEffect, useState } from "react";

import { DEFAULT_TAG_COLOR } from "../constants/tags";
import {
  useLibraryControllerAddTagToTrack,
  useLibraryControllerCreateTag,
  useLibraryControllerGetTags,
  useLibraryControllerRemoveTagFromTrack,
} from "../data/api";

interface InlineTagEditorProps {
  onTagsChange?: () => void;
  trackId: string;
  trackTags: Array<{ color?: string; id: string; name: string }>;
}

export function InlineTagEditor({
  onTagsChange,
  trackId,
  trackTags,
}: InlineTagEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    trackTags.map((t) => t.name),
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: allTags = [], refetch: refetchTags } =
    useLibraryControllerGetTags();
  const createTagMutation = useLibraryControllerCreateTag();
  const addTagToTrackMutation = useLibraryControllerAddTagToTrack();
  const removeTagFromTrackMutation = useLibraryControllerRemoveTagFromTrack();

  useEffect(() => {
    setSelectedTags(trackTags.map((t) => t.name));
  }, [trackTags]);

  const handleAddTag = async (tagName: string) => {
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
        return;
      }
    }

    if (tag) {
      try {
        await addTagToTrackMutation.mutateAsync({
          data: { tagId: tag.id },
          trackId,
        });
        notifications.show({
          color: "green",
          message: `Added tag "${tagName}"`,
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
    }
  };

  const handleTagsChange = async (values: string[]) => {
    const currentTagNames = trackTags.map((t) => t.name);
    const newTagNames = values.filter((v) => !currentTagNames.includes(v));
    const removedTagNames = currentTagNames.filter((v) => !values.includes(v));

    setIsUpdating(true);

    for (const tagName of newTagNames) {
      await handleAddTag(tagName);
    }

    for (const tagName of removedTagNames) {
      const tag = trackTags.find((t) => t.name === tagName);
      if (tag) {
        try {
          await removeTagFromTrackMutation.mutateAsync({
            tagId: tag.id,
            trackId,
          });
          notifications.show({
            color: "green",
            message: `Removed tag "${tagName}"`,
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
      }
    }

    setSelectedTags(values);
    setIsUpdating(false);

    if (newTagNames.length === 0 && removedTagNames.length === 0) {
      setIsOpen(false);
    }
  };

  const count = trackTags.length;
  const tooltipLabel = trackTags.map((t) => t.name).join(", ");

  return (
    <Popover
      onChange={setIsOpen}
      opened={isOpen}
      position="bottom-start"
      width={300}
      withArrow
      zIndex={300}
    >
      <Popover.Target>
        <Tooltip disabled={count === 0 || isOpen} label={tooltipLabel}>
          <div
            className="inline-flex cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {count === 0 ? (
              <Badge color="gray" size="sm" variant="light">
                <Plus className="h-2.5 w-2.5" />
              </Badge>
            ) : (
              <Badge
                color="orange"
                leftSection={<Tag className="h-2.5 w-2.5" />}
                size="sm"
                variant="light"
              >
                {count}
              </Badge>
            )}
          </div>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown onClick={(e) => e.stopPropagation()}>
        <TagsInput
          clearable
          comboboxProps={{ zIndex: 350 }}
          data={allTags.map((tag) => tag.name)}
          disabled={isUpdating}
          onChange={handleTagsChange}
          placeholder="Add tags..."
          renderOption={({ option }) => {
            const tag = allTags.find((t) => t.name === option.value);
            return (
              <Badge
                color={tag?.color || "gray"}
                size="xs"
                styles={{
                  root: {
                    fontSize: "10px",
                    lineHeight: "1.2",
                    padding: "1px 6px 2px 6px",
                  },
                }}
              >
                {option.value}
              </Badge>
            );
          }}
          value={selectedTags}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
