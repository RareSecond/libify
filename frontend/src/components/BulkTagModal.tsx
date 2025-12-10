import {
  Badge,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  useLibraryControllerCreateTag,
  useLibraryControllerGetTags,
} from "@/data/api";

interface BulkTagModalProps {
  onClose: () => void;
  onConfirm: (tagId: string, action: "add" | "remove") => Promise<void>;
  opened: boolean;
  selectionCount: number;
}

export function BulkTagModal({
  onClose,
  onConfirm,
  opened,
  selectionCount,
}: BulkTagModalProps) {
  const [tagId, setTagId] = useState<null | string>(null);
  const [action, setAction] = useState<"add" | "remove">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const { data: tags = [], refetch: refetchTags } =
    useLibraryControllerGetTags();
  const createTagMutation = useLibraryControllerCreateTag();

  const handleConfirm = async () => {
    if (!tagId) return;
    setIsSubmitting(true);
    try {
      await onConfirm(tagId, action);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTagId(null);
    setAction("add");
    setNewTagName("");
    onClose();
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    // Check if tag already exists
    const existingTag = tags.find(
      (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase(),
    );
    if (existingTag) {
      setTagId(existingTag.id);
      setNewTagName("");
      return;
    }

    setIsCreatingTag(true);
    try {
      const response = await createTagMutation.mutateAsync({
        data: { color: "#339af0", name: newTagName.trim() },
      });
      await refetchTags();
      setTagId(response.id);
      setNewTagName("");
      notifications.show({
        color: "green",
        message: `Tag "${newTagName.trim()}" created`,
        title: "Tag created",
      });
    } catch {
      notifications.show({
        color: "red",
        message: "Please try again",
        title: "Failed to create tag",
      });
    } finally {
      setIsCreatingTag(false);
    }
  };

  const tagOptions = tags.map((tag) => ({ label: tag.name, value: tag.id }));
  const selectedTag = tags.find((t) => t.id === tagId);

  return (
    <Modal
      onClose={handleClose}
      opened={opened}
      title={`${action === "add" ? "Add" : "Remove"} tag for ${selectionCount} tracks`}
    >
      <Stack gap="md">
        <SegmentedControl
          data={[
            { label: "Add Tag", value: "add" },
            { label: "Remove Tag", value: "remove" },
          ]}
          onChange={(value) => setAction(value as "add" | "remove")}
          value={action}
        />

        <Stack gap="xs">
          <Select
            data={tagOptions}
            label="Select existing tag"
            onChange={setTagId}
            placeholder="Choose a tag"
            searchable
            value={tagId}
          />

          {action === "add" && (
            <>
              <Text className="text-center text-gray-500" size="xs">
                or
              </Text>
              <Group gap="xs">
                <TextInput
                  className="flex-1"
                  disabled={isCreatingTag}
                  onChange={(e) => setNewTagName(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  placeholder="Create new tag..."
                  value={newTagName}
                />
                <Button
                  disabled={!newTagName.trim()}
                  leftSection={<Plus size={16} />}
                  loading={isCreatingTag}
                  onClick={handleCreateTag}
                  variant="light"
                >
                  Create
                </Button>
              </Group>
            </>
          )}

          {selectedTag && (
            <Group gap="xs">
              <Text size="xs">Selected:</Text>
              <Badge color={selectedTag.color || "gray"} size="sm">
                {selectedTag.name}
              </Badge>
            </Group>
          )}
        </Stack>

        <Text className="text-gray-500" size="xs">
          {action === "add"
            ? "Tracks that already have this tag will be skipped."
            : "Only tracks with this tag will be affected."}
        </Text>

        <Group justify="flex-end">
          <Button onClick={handleClose} variant="subtle">
            Cancel
          </Button>
          <Button
            disabled={!tagId || isSubmitting}
            loading={isSubmitting}
            onClick={handleConfirm}
          >
            {action === "add" ? "Add Tag" : "Remove Tag"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
