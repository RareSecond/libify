import { ActionIcon, Button, Group } from "@mantine/core";
import { X } from "lucide-react";

interface FullscreenHeaderProps {
  closeText?: string;
  onClose: () => void;
}

export function FullscreenHeader({
  closeText,
  onClose,
}: FullscreenHeaderProps) {
  return (
    <Group className="px-4 md:px-8 mb-4" justify="space-between">
      {closeText ? (
        <Button
          color="gray"
          leftSection={<X size={16} />}
          onClick={onClose}
          size="sm"
          variant="subtle"
        >
          {closeText}
        </Button>
      ) : (
        <ActionIcon color="gray" onClick={onClose} size="lg" variant="subtle">
          <X size={24} />
        </ActionIcon>
      )}
      <div className="w-10" />
    </Group>
  );
}
