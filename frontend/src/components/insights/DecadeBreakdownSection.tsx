import { BarChart } from "@mantine/charts";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { ListMusic } from "lucide-react";

interface DecadeBreakdownSectionProps {
  decadeDistribution: DecadeDistribution[];
  onCreateDecadePlaylist: (decade: string) => void;
}

interface DecadeDistribution {
  count: number;
  decade: string;
  percentage: number;
}

export function DecadeBreakdownSection({
  decadeDistribution,
  onCreateDecadePlaylist,
}: DecadeBreakdownSectionProps) {
  if (decadeDistribution.length === 0) {
    return (
      <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
        <Title className="text-dark-0 mb-4" order={4}>
          Decades
        </Title>
        <Text className="text-dark-2" size="sm">
          No release date data available yet.
        </Text>
      </Paper>
    );
  }

  const chartData = decadeDistribution.map((d) => ({
    count: d.count,
    decade: d.decade,
  }));

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
      <Title className="text-dark-0 mb-4" order={4}>
        Decades
      </Title>

      <BarChart
        className="h-[200px]"
        data={chartData}
        dataKey="decade"
        gridColor="var(--mantine-color-dark-5)"
        series={[{ color: "grape.6", name: "count" }]}
        tickLine="none"
        withLegend={false}
      />

      <Stack className="mt-6" gap="xs">
        <Text className="text-dark-2" size="sm">
          Create a throwback playlist:
        </Text>
        <Group gap="xs">
          {decadeDistribution
            .filter((d) => d.count >= 10)
            .slice(0, 5)
            .map((d) => (
              <Button
                key={d.decade}
                leftSection={<ListMusic size={14} />}
                onClick={() => onCreateDecadePlaylist(d.decade)}
                size="xs"
                variant="light"
              >
                {d.decade}
              </Button>
            ))}
        </Group>
      </Stack>
    </Paper>
  );
}
