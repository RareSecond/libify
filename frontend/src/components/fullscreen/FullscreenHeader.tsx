import { ActionIcon, Group } from "@mantine/core";
import { X } from "lucide-react";

interface FullscreenHeaderProps {
  onClose: () => void;
}

export function FullscreenHeader({ onClose }: FullscreenHeaderProps) {
  return (
    <Group className="px-4 md:px-8 mb-4" justify="space-between">
      <ActionIcon color="gray" onClick={onClose} size="lg" variant="subtle">
        <X size={24} />
      </ActionIcon>
      <div className="w-10" />
    </Group>
  );
}
