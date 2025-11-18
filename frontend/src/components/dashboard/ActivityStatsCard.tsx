import { Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Activity, Disc, Music, Star } from "lucide-react";

interface ActivityStatsCardProps {
  totalPlaysThisWeek: number;
  tracksAddedThisWeek: number;
  tracksPlayedThisWeek: number;
  tracksRatedThisWeek: number;
}

export function ActivityStatsCard({
  totalPlaysThisWeek,
  tracksAddedThisWeek,
  tracksPlayedThisWeek,
  tracksRatedThisWeek,
}: ActivityStatsCardProps) {
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
          <Activity color="var(--color-orange-5)" size={20} />
          <Title className="text-dark-0" order={3}>
            This Week
          </Title>
        </Group>

        <SimpleGrid cols={2}>
          <div className="p-3 rounded-md bg-dark-6 border border-dark-5">
            <Group gap="xs" wrap="nowrap">
              <Disc className="text-orange-5 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <Text className="text-dark-3" lineClamp={1} size="xs">
                  Added
                </Text>
                <Text
                  className="text-dark-0 font-semibold"
                  lineClamp={1}
                  size="lg"
                >
                  {tracksAddedThisWeek}
                </Text>
              </div>
            </Group>
          </div>

          <div className="p-3 rounded-md bg-dark-6 border border-dark-5">
            <Group gap="xs" wrap="nowrap">
              <Music className="text-orange-5 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <Text className="text-dark-3" lineClamp={1} size="xs">
                  Played
                </Text>
                <Text
                  className="text-dark-0 font-semibold"
                  lineClamp={1}
                  size="lg"
                >
                  {totalPlaysThisWeek}
                </Text>
              </div>
            </Group>
          </div>

          <div className="p-3 rounded-md bg-dark-6 border border-dark-5">
            <Group gap="xs" wrap="nowrap">
              <Star className="text-orange-5 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <Text className="text-dark-3" lineClamp={1} size="xs">
                  Rated
                </Text>
                <Text
                  className="text-dark-0 font-semibold"
                  lineClamp={1}
                  size="lg"
                >
                  {tracksRatedThisWeek}
                </Text>
              </div>
            </Group>
          </div>

          <div className="p-3 rounded-md bg-dark-6 border border-dark-5">
            <Group gap="xs" wrap="nowrap">
              <Music className="text-orange-5 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <Text className="text-dark-3" lineClamp={1} size="xs">
                  Unique
                </Text>
                <Text
                  className="text-dark-0 font-semibold"
                  lineClamp={1}
                  size="lg"
                >
                  {tracksPlayedThisWeek}
                </Text>
              </div>
            </Group>
          </div>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
