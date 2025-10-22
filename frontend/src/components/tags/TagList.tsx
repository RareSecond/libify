import { ActionIcon, Badge, Button, Group, Stack, Text } from "@mantine/core";
import { Edit2, Plus, Trash2 } from "lucide-react";

interface Tag {
  color?: string;
  id: string;
  name: string;
}

interface TagListProps {
  onAddTagToTrack?: (tagId: string) => void;
  onCreateClick: () => void;
  onDeleteTag: (tagId: string) => void;
  onEditTag: (tag: Tag) => void;
  tags: Tag[];
  trackId?: string;
  trackTags?: Tag[];
}

export function TagList({
  onAddTagToTrack,
  onCreateClick,
  onDeleteTag,
  onEditTag,
  tags,
  trackId,
  trackTags = [],
}: TagListProps) {
  return (
    <div>
      <Group className="mb-2" justify="space-between">
        <Text className="font-medium" size="sm">
          All Tags
        </Text>
        <Button
          leftSection={<Plus size={14} />}
          onClick={onCreateClick}
          size="xs"
        >
          Create Tag
        </Button>
      </Group>
      <Stack gap="xs">
        {tags.length === 0 ? (
          <Text className="text-gray-600" size="sm">
            No tags created yet
          </Text>
        ) : (
          tags.map((tag) => (
            <Group justify="space-between" key={tag.id}>
              <Badge color={tag.color || "gray"}>{tag.name}</Badge>
              <Group gap="xs">
                {trackId && !trackTags.some((t) => t.id === tag.id) && (
                  <ActionIcon
                    onClick={() => onAddTagToTrack?.(tag.id)}
                    size="sm"
                    variant="subtle"
                  >
                    <Plus size={16} />
                  </ActionIcon>
                )}
                <ActionIcon
                  onClick={() => onEditTag(tag)}
                  size="sm"
                  variant="subtle"
                >
                  <Edit2 size={16} />
                </ActionIcon>
                <ActionIcon
                  color="red"
                  onClick={() => onDeleteTag(tag.id)}
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
  );
}
