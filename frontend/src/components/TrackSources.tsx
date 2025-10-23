import { Badge, Group, Tooltip } from "@mantine/core";
import { Album, Heart, List, Music } from "lucide-react";

import { TrackSourceDto } from "../data/api";

interface TrackSourcesProps {
  sources: TrackSourceDto[];
}

const getSourceIcon = (sourceType: string) => {
  switch (sourceType) {
    case "ALBUM":
      return <Album className="h-3 w-3" />;
    case "ARTIST_TOP_TRACKS":
      return <Music className="h-3 w-3" />;
    case "LIKED_SONGS":
      return <Heart className="h-3 w-3" />;
    case "PLAYLIST":
      return <List className="h-3 w-3" />;
    default:
      return <Music className="h-3 w-3" />;
  }
};

const getSourceLabel = (source: TrackSourceDto): string => {
  if (source.sourceType === "LIKED_SONGS") {
    return "Liked Songs";
  }
  return source.sourceName || source.sourceType;
};

const getSourceColor = (sourceType: string): string => {
  switch (sourceType) {
    case "ALBUM":
      return "green";
    case "ARTIST_TOP_TRACKS":
      return "purple";
    case "LIKED_SONGS":
      return "pink";
    case "PLAYLIST":
      return "blue";
    default:
      return "gray";
  }
};

export function TrackSources({ sources }: TrackSourcesProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Sort sources: LIKED_SONGS first, then alphabetically
  const sortedSources = [...sources].sort((a, b) => {
    if (a.sourceType === "LIKED_SONGS") return -1;
    if (b.sourceType === "LIKED_SONGS") return 1;
    return getSourceLabel(a).localeCompare(getSourceLabel(b));
  });

  // Show first 3 sources directly, rest in tooltip
  const visibleSources = sortedSources.slice(0, 3);
  const hiddenSources = sortedSources.slice(3);

  return (
    <Group gap="xs" wrap="nowrap">
      {visibleSources.map((source) => (
        <Tooltip key={source.id} label={getSourceLabel(source)}>
          <Badge
            color={getSourceColor(source.sourceType)}
            leftSection={getSourceIcon(source.sourceType)}
            size="sm"
            variant="light"
          >
            {getSourceLabel(source)}
          </Badge>
        </Tooltip>
      ))}
      {hiddenSources.length > 0 && (
        <Tooltip
          label={
            <div>
              {hiddenSources.map((source) => (
                <div key={source.id}>{getSourceLabel(source)}</div>
              ))}
            </div>
          }
        >
          <Badge color="gray" size="sm" variant="outline">
            +{hiddenSources.length}
          </Badge>
        </Tooltip>
      )}
    </Group>
  );
}
