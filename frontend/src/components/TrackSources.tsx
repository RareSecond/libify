import { Group, Tooltip } from "@mantine/core";
import { Album, Heart, List, Music } from "lucide-react";
import { ReactNode } from "react";

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

const SOURCE_COLORS: Record<string, string> = {
  ALBUM: "text-green-400",
  ARTIST_TOP_TRACKS: "text-purple-400",
  LIKED_SONGS: "text-pink-400",
  PLAYLIST: "text-blue-400",
};

const SOURCE_BG_COLORS: Record<string, string> = {
  ALBUM: "bg-green-400/15",
  ARTIST_TOP_TRACKS: "bg-purple-400/15",
  LIKED_SONGS: "bg-pink-400/15",
  PLAYLIST: "bg-blue-400/15",
};

interface SourceGroup {
  count: number;
  icon: ReactNode;
  names: string[];
  sourceType: string;
}

export function TrackSources({ sources }: TrackSourcesProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const grouped = groupSources(sources);

  return (
    <Group gap={6} wrap="nowrap">
      {grouped.map((group) => (
        <Tooltip key={group.sourceType} label={group.names.join(", ")}>
          <div
            className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 ${SOURCE_BG_COLORS[group.sourceType] || "bg-gray-400/15"} ${SOURCE_COLORS[group.sourceType] || "text-gray-400"}`}
          >
            {group.icon}
            {group.count > 1 && (
              <span className="text-[10px] font-medium leading-none">
                {group.count}
              </span>
            )}
          </div>
        </Tooltip>
      ))}
    </Group>
  );
}

function groupSources(sources: TrackSourceDto[]): SourceGroup[] {
  const groups = new Map<string, SourceGroup>();

  for (const source of sources) {
    const existing = groups.get(source.sourceType);
    if (existing) {
      existing.count++;
      existing.names.push(getSourceLabel(source));
    } else {
      groups.set(source.sourceType, {
        count: 1,
        icon: getSourceIcon(source.sourceType),
        names: [getSourceLabel(source)],
        sourceType: source.sourceType,
      });
    }
  }

  // Sort: LIKED_SONGS first, then alphabetically by type
  return [...groups.values()].sort((a, b) => {
    if (a.sourceType === "LIKED_SONGS") return -1;
    if (b.sourceType === "LIKED_SONGS") return 1;
    return a.sourceType.localeCompare(b.sourceType);
  });
}
