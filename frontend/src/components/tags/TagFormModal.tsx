import {
  Button,
  ColorInput,
  Group,
  Modal,
  Stack,
  TextInput,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";

import { TagDto } from "@/data/api";

interface TagFormModalProps {
  editingTag: null | TagDto;
  form: UseFormReturnType<{ color: string; name: string }>;
  onClose: () => void;
  onSubmit: (values: { color: string; name: string }) => void;
  opened: boolean;
}

export function TagFormModal({
  editingTag,
  form,
  onClose,
  onSubmit,
  opened,
}: TagFormModalProps) {
  return (
    <Modal
      onClose={onClose}
      opened={opened}
      title={editingTag ? "Edit Tag" : "Create New Tag"}
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
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
            <Button onClick={onClose} variant="subtle">
              Cancel
            </Button>
            <Button type="submit">
              {editingTag ? "Update" : "Create"} Tag
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
