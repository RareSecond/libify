import { Group, Paper, Progress, Text } from "@mantine/core";
import { AlertCircle } from "lucide-react";

interface SyncStatusSectionProps {
  totalTracks: number;
  tracksWithAudioFeatures: number;
  tracksWithGenres: number;
}

export function SyncStatusSection({
  totalTracks,
  tracksWithAudioFeatures,
  tracksWithGenres,
}: SyncStatusSectionProps) {
  const audioFeaturesPercent =
    totalTracks > 0
      ? Math.round((tracksWithAudioFeatures / totalTracks) * 100)
      : 0;
  const genresPercent =
    totalTracks > 0 ? Math.round((tracksWithGenres / totalTracks) * 100) : 0;

  const isFullyEnriched = audioFeaturesPercent >= 95 && genresPercent >= 95;

  if (isFullyEnriched) {
    return null;
  }

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-4" radius="md">
      <Group className="mb-2" gap="md">
        <AlertCircle className="text-orange-5" size={20} />
        <Text className="font-medium" size="sm">
          Library Enrichment Progress
        </Text>
      </Group>
      <div className="space-y-3">
        <div>
          <Group className="mb-1" justify="space-between">
            <Text className="text-dark-2" size="xs">
              Audio Features
            </Text>
            <Text className="text-dark-2" size="xs">
              {tracksWithAudioFeatures.toLocaleString()} /{" "}
              {totalTracks.toLocaleString()} ({audioFeaturesPercent}%)
            </Text>
          </Group>
          <Progress color="orange" size="sm" value={audioFeaturesPercent} />
        </div>
        <div>
          <Group className="mb-1" justify="space-between">
            <Text className="text-dark-2" size="xs">
              Genre Tags
            </Text>
            <Text className="text-dark-2" size="xs">
              {tracksWithGenres.toLocaleString()} /{" "}
              {totalTracks.toLocaleString()} ({genresPercent}%)
            </Text>
          </Group>
          <Progress color="grape" size="sm" value={genresPercent} />
        </div>
      </div>
    </Paper>
  );
}
