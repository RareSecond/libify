import { ActionIcon, Badge, Button, Group, Paper } from "@mantine/core";
import { Star, Tag, X } from "lucide-react";

import { SelectionMode } from "@/hooks/useTrackSelection";

interface BulkActionBarProps {
  onBulkRate: () => void;
  onBulkTag: () => void;
  onClearSelection: () => void;
  onSelectAllMatching: () => void;
  selectionCount: number;
  selectionMode: SelectionMode;
  totalMatchingTracks: number;
}

export function BulkActionBar({
  onBulkRate,
  onBulkTag,
  onClearSelection,
  onSelectAllMatching,
  selectionCount,
  selectionMode,
  totalMatchingTracks,
}: BulkActionBarProps) {
  if (selectionCount === 0) return null;

  return (
    <Paper
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 p-3 shadow-lg"
      radius="md"
      withBorder
    >
      <Group gap="md">
        <Group gap="xs">
          <Badge size="lg" variant="filled">
            {selectionCount} selected
          </Badge>
          {selectionMode === "page" && selectionCount < totalMatchingTracks && (
            <Button onClick={onSelectAllMatching} size="xs" variant="subtle">
              Select all {totalMatchingTracks} matching
            </Button>
          )}
        </Group>

        <Group gap="xs">
          <Button
            leftSection={<Star size={16} />}
            onClick={onBulkRate}
            size="sm"
            variant="light"
          >
            Rate
          </Button>
          <Button
            leftSection={<Tag size={16} />}
            onClick={onBulkTag}
            size="sm"
            variant="light"
          >
            Tag
          </Button>
        </Group>

        <ActionIcon onClick={onClearSelection} variant="subtle">
          <X size={18} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
