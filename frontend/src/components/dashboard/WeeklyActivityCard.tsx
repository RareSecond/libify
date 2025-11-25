import { Card, Group, Stack, Text } from "@mantine/core";
import { Activity, Disc, Play, Star } from "lucide-react";

interface WeeklyActivityCardProps {
  totalPlaysThisWeek: number;
  tracksAddedThisWeek: number;
  tracksRatedThisWeek: number;
}

export function WeeklyActivityCard({
  totalPlaysThisWeek,
  tracksAddedThisWeek,
  tracksRatedThisWeek,
}: WeeklyActivityCardProps) {
  const stats = [
    { icon: Play, label: "plays", value: totalPlaysThisWeek },
    { icon: Star, label: "rated", value: tracksRatedThisWeek },
    { icon: Disc, label: "added", value: tracksAddedThisWeek },
  ];

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 h-full"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group gap="xs">
          <Activity className="text-orange-5" size={20} />
          <Text className="text-dark-0 font-semibold" size="lg">
            This Week
          </Text>
        </Group>

        <Stack gap="sm">
          {stats.map((stat) => (
            <Group gap="sm" key={stat.label}>
              <stat.icon className="text-orange-5" size={18} />
              <Text className="text-dark-0" size="sm">
                <span className="font-semibold">{stat.value}</span>{" "}
                <span className="text-dark-2">{stat.label}</span>
              </Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
