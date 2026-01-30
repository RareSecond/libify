import { BarChart, ChartTooltipProps } from "@mantine/charts";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { ListMusic } from "lucide-react";

interface YearBreakdownSectionProps {
  onCreateYearPlaylist: (decade: string) => void;
  yearDistribution: YearDistribution[];
}

interface YearDistribution {
  count: number;
  percentage: number;
  year: number;
}

export function YearBreakdownSection({
  onCreateYearPlaylist,
  yearDistribution,
}: YearBreakdownSectionProps) {
  if (yearDistribution.length === 0) {
    return (
      <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
        <Title className="text-dark-0 mb-4" order={4}>
          Release Years
        </Title>
        <Text className="text-dark-2" size="sm">
          No release date data available yet.
        </Text>
      </Paper>
    );
  }

  const chartData = yearDistribution.map((d) => ({
    count: d.count,
    year: String(d.year),
  }));

  const playlistYears = yearDistribution
    .filter((d) => d.count >= 10)
    .slice(-5)
    .reverse();

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
      <Title className="text-dark-0 mb-4" order={4}>
        Release Years
      </Title>

      <BarChart
        className="h-[200px]"
        data={chartData}
        dataKey="year"
        gridAxis="none"
        series={[{ color: "violet.6", name: "count" }]}
        tickLine="none"
        tooltipProps={{
          content: ({ label, payload }) => YearTooltip({ label, payload }),
        }}
        withLegend={false}
      />

      {playlistYears.length > 0 && (
        <Stack className="mt-6" gap="xs">
          <Text className="text-dark-2" size="sm">
            Create a throwback playlist:
          </Text>
          <Group gap="xs">
            {playlistYears.map((d) => {
              const decade = `${Math.floor(d.year / 10) * 10}s`;
              return (
                <Button
                  key={d.year}
                  leftSection={<ListMusic size={14} />}
                  onClick={() => onCreateYearPlaylist(decade)}
                  size="xs"
                  variant="light"
                >
                  {d.year}
                </Button>
              );
            })}
          </Group>
        </Stack>
      )}
    </Paper>
  );
}

function YearTooltip({ label, payload }: ChartTooltipProps) {
  if (!payload?.length) return null;

  return (
    <Paper className="bg-dark-6 border border-dark-4 px-3 py-2" radius="sm">
      <Text className="text-dark-0 font-medium" size="sm">
        {label}
      </Text>
      <Text className="text-dark-2" size="xs">
        {Number(payload[0].value).toLocaleString()} tracks
      </Text>
    </Paper>
  );
}
