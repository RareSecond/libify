import {
  Badge,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Tag } from "lucide-react";

export interface TagItem {
  count: number;
  id?: string;
  info?: string; // color hex
  name: string;
}

interface TagOverviewCardProps {
  percentageTagged: number;
  taggedTracks: number;
  topTags: TagItem[];
  totalTags: number;
  totalTracks: number;
}

export function TagOverviewCard({
  percentageTagged,
  taggedTracks,
  topTags,
  totalTags,
  totalTracks,
}: TagOverviewCardProps) {
  const navigate = useNavigate();

  const handleManageTags = () => {
    navigate({ search: { genres: [] }, to: "/tracks" });
  };

  if (totalTags === 0) {
    return (
      <Card
        className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
        padding="lg"
        radius="md"
        shadow="md"
        withBorder
      >
        <Stack gap="md">
          <Group gap="xs">
            <Tag color="var(--color-orange-5)" size={20} />
            <Title className="text-dark-0" order={3}>
              Tag Your Music
            </Title>
          </Group>

          <Text className="text-dark-1" size="sm">
            Organize your library by creating custom tags. Group tracks by mood,
            genre, activity, or any category you like.
          </Text>

          <Button
            className="bg-orange-6 hover:bg-orange-7"
            fullWidth
            leftSection={<Plus size={18} />}
            onClick={handleManageTags}
            size="md"
          >
            Create Your First Tag
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group align="center" gap="xs" justify="space-between">
          <Group gap="xs">
            <Tag color="var(--color-orange-5)" size={20} />
            <Title className="text-dark-0" order={3}>
              Tags
            </Title>
          </Group>
          <Text className="text-orange-5 font-semibold" size="xl">
            {totalTags}
          </Text>
        </Group>

        <div>
          <Group className="mb-2" gap="xs" justify="space-between">
            <Text className="text-dark-3" size="xs">
              Tagged Tracks
            </Text>
            <Text className="text-dark-1 font-semibold" size="sm">
              {taggedTracks.toLocaleString()} / {totalTracks.toLocaleString()}
            </Text>
          </Group>
          <Progress
            className="h-2"
            color="orange"
            radius="md"
            size="sm"
            value={percentageTagged}
          />
        </div>

        {topTags.length > 0 && (
          <Stack gap="xs">
            <Text className="text-dark-3" size="xs">
              Most Used Tags
            </Text>
            <Stack gap="xs">
              {topTags.map((tag, index) => (
                <Group
                  className="p-2 rounded-md bg-dark-6 border border-dark-5"
                  gap="xs"
                  justify="space-between"
                  key={tag.id || `tag-${index}`}
                  wrap="nowrap"
                >
                  <Group gap="xs" wrap="nowrap">
                    {tag.info && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        // eslint-disable-next-line react/forbid-dom-props
                        style={{ backgroundColor: tag.info }}
                      />
                    )}
                    <Text className="text-dark-0" lineClamp={1} size="sm">
                      {tag.name}
                    </Text>
                  </Group>
                  <Badge color="orange" size="sm" variant="light">
                    {tag.count}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Stack>
        )}

        <Button
          className="bg-dark-6 hover:bg-dark-5 border-dark-5"
          fullWidth
          onClick={handleManageTags}
          size="sm"
          variant="outline"
        >
          Manage Tags
        </Button>
      </Stack>
    </Card>
  );
}
