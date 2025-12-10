import {
  Button,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useState } from "react";

import { useLibraryControllerGetTags } from "@/data/api";

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

  const { data: tags = [] } = useLibraryControllerGetTags();

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
    onClose();
  };

  const tagOptions = tags.map((tag) => ({ label: tag.name, value: tag.id }));

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

        <Select
          data={tagOptions}
          label="Select tag"
          onChange={setTagId}
          placeholder="Choose a tag"
          searchable
          value={tagId}
        />

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
