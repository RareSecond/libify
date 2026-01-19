import { Text } from "@mantine/core";
import { ColumnDef } from "@tanstack/react-table";

import { TrackDto } from "../data/api";

// Audio feature column configuration
const AUDIO_FEATURE_COLUMNS: Array<{
  header: string;
  id: keyof TrackDto;
  isPercent: boolean;
  size: number;
}> = [
  { header: "BPM", id: "tempo", isPercent: false, size: 60 },
  { header: "Energy", id: "energy", isPercent: true, size: 70 },
  { header: "Dance", id: "danceability", isPercent: true, size: 70 },
  { header: "Mood", id: "valence", isPercent: true, size: 70 },
  { header: "Acoustic", id: "acousticness", isPercent: true, size: 70 },
  { header: "Instrumental", id: "instrumentalness", isPercent: true, size: 90 },
  { header: "Speech", id: "speechiness", isPercent: true, size: 70 },
  { header: "Live", id: "liveness", isPercent: true, size: 60 },
];

const formatAudioFeature = (value: unknown, isPercent: boolean): string => {
  if (value == null) return "-";
  const num = value as number;
  return isPercent ? `${Math.round(num * 100)}%` : String(Math.round(num));
};

export function getAudioFeatureColumns(): ColumnDef<TrackDto>[] {
  return AUDIO_FEATURE_COLUMNS.map(({ header, id, isPercent, size }) => ({
    accessorKey: id,
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <Text className="text-center text-gray-600" size="sm">
        {formatAudioFeature(getValue(), isPercent)}
      </Text>
    ),
    header,
    id,
    size,
  }));
}
