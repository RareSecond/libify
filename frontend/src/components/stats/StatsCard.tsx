import { Card, Group, Stack, Text } from "@mantine/core";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatsCardProps {
  color?: string;
  icon: LucideIcon;
  label: string;
  trend?: { label: string; value: number };
  value: ReactNode;
}

export function StatsCard({
  color = "orange",
  icon: Icon,
  label,
  trend,
  value,
}: StatsCardProps) {
  return (
    <Card
      className="relative overflow-hidden bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 hover:border-dark-4 transition-all duration-300 hover:scale-[1.02]"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      {/* Background icon decoration */}
      <div className="absolute -right-4 -top-4 opacity-5">
        <Icon size={120} />
      </div>

      <Stack gap="xs">
        <Group justify="space-between">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br from-${color}-6 to-${color}-8 bg-opacity-20`}
          >
            <Icon color={`var(--color-${color}-5)`} size={24} />
          </div>
          {trend && (
            <Text
              className={`font-medium ${trend.value >= 0 ? "text-green-500" : "text-red-500"}`}
              size="sm"
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </Text>
          )}
        </Group>

        <div>
          <Text className="text-3xl font-bold text-dark-0">{value}</Text>
          <Text className="text-dark-1" size="sm">
            {label}
          </Text>
          {trend && (
            <Text className="text-dark-1" size="xs">
              {trend.label}
            </Text>
          )}
        </div>
      </Stack>
    </Card>
  );
}
