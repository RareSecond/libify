import { ActionIcon, Badge, Group } from "@mantine/core";
import { X } from "lucide-react";

interface RatingHeaderProps {
  onClose: () => void;
  progress: string;
  ratedCount: number;
  remainingCount: number;
}

export function RatingHeader({
  onClose,
  progress,
  ratedCount,
  remainingCount,
}: RatingHeaderProps) {
  return (
    <Group className="px-4 md:px-8 mb-4" justify="space-between">
      <ActionIcon color="gray" onClick={onClose} size="lg" variant="subtle">
        <X size={24} />
      </ActionIcon>

      <Group gap="sm">
        <Badge color="green" radius="md" size="lg" variant="light">
          {ratedCount} Rated
        </Badge>
        <Badge color="orange" radius="md" size="lg" variant="light">
          {remainingCount} Remaining
        </Badge>
        <Badge color="blue" radius="md" size="lg" variant="light">
          {progress}%
        </Badge>
      </Group>

      <div className="w-10" />
    </Group>
  );
}
