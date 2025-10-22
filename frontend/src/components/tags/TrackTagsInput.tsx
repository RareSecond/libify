import { Badge, Group, TagsInput } from "@mantine/core";

import { TagDto } from "../../data/api";

interface TrackTagsInputProps {
  allTags: TagDto[];
  onChange: (values: string[]) => void;
  selectedTags: string[];
}

export function TrackTagsInput({
  allTags,
  onChange,
  selectedTags,
}: TrackTagsInputProps) {
  return (
    <TagsInput
      clearable
      data={allTags.map((tag) => tag.name)}
      label="Track Tags"
      onChange={onChange}
      placeholder="Add tags to this track"
      renderOption={({ option }) => {
        const tag = allTags.find((t) => t.name === option.value);
        return (
          <Group gap="xs">
            <Badge color={tag?.color || "gray"} size="sm">
              {option.value}
            </Badge>
          </Group>
        );
      }}
      value={selectedTags}
    />
  );
}
