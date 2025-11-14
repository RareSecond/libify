import { Box, Center, Group, Text } from "@mantine/core";
import { ColumnDef } from "@tanstack/react-table";
import { Music, Volume2 } from "lucide-react";
import { useMemo } from "react";

import { InlineTagEditor } from "../components/InlineTagEditor";
import { RatingSelector } from "../components/RatingSelector";
import { TrackSources } from "../components/TrackSources";
import { TrackDto } from "../data/api";
import { formatTime } from "../utils/format";

const formatDate = (date: null | string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

interface UseTracksTableColumnsOptions {
  currentTrack?: { id?: string };
  isPlaying: boolean;
  onRatingChange?: () => void;
  onRefetch?: () => void;
}

export function useTracksTableColumns({
  currentTrack,
  isPlaying,
  onRatingChange,
  onRefetch,
}: UseTracksTableColumnsOptions) {
  return useMemo<ColumnDef<TrackDto>[]>(
    () => [
      {
        cell: ({ row }) => {
          const isCurrentTrack = currentTrack?.id === row.original.spotifyId;
          return (
            <Group gap="xs" wrap="nowrap">
              {row.original.albumArt ? (
                <Box className="h-9 w-9 rounded overflow-hidden relative">
                  <img
                    alt={row.original.album || row.original.title}
                    className="h-9 w-9 object-cover"
                    loading="lazy"
                    src={row.original.albumArt}
                  />
                  {isCurrentTrack && isPlaying && (
                    <Center className="absolute inset-0 bg-black/60 text-white">
                      <Volume2 size={20} />
                    </Center>
                  )}
                </Box>
              ) : (
                <Center className="h-9 w-9 rounded bg-gray-200">
                  {isCurrentTrack && isPlaying ? (
                    <Volume2 size={18} />
                  ) : (
                    <Music color="gray" size={18} />
                  )}
                </Center>
              )}
            </Group>
          );
        },
        enableSorting: false,
        header: "",
        id: "albumArt",
        size: 50,
      },
      {
        accessorKey: "title",
        cell: ({ getValue, row }) => {
          const isCurrentTrack = currentTrack?.id === row.original.spotifyId;
          return (
            <Text
              className={`font-medium ${isCurrentTrack && isPlaying ? "text-blue-600" : ""}`}
              lineClamp={1}
              size="sm"
            >
              {getValue() as string}
            </Text>
          );
        },
        header: "Title",
        id: "title",
        size: 200,
      },
      {
        accessorKey: "artist",
        cell: ({ getValue }) => (
          <Text lineClamp={1} size="sm">
            {getValue() as string}
          </Text>
        ),
        header: "Artist",
        id: "artist",
        size: 150,
      },
      {
        accessorKey: "album",
        cell: ({ getValue }) => (
          <Text className="text-gray-600" lineClamp={1} size="sm">
            {(getValue() as string) || "-"}
          </Text>
        ),
        header: "Album",
        id: "album",
        size: 150,
      },
      {
        accessorKey: "duration",
        cell: ({ getValue }) => (
          <Text className="text-gray-600" size="sm">
            {formatTime(getValue() as number)}
          </Text>
        ),
        header: "Duration",
        id: "duration",
        size: 80,
      },
      {
        accessorKey: "totalPlayCount",
        cell: ({ getValue }) => (
          <Text className="text-center" size="sm">
            {getValue() as number}
          </Text>
        ),
        header: "Plays",
        id: "totalPlayCount",
        size: 60,
      },
      {
        accessorKey: "lastPlayedAt",
        cell: ({ getValue }) => (
          <Text className="text-gray-600" size="xs">
            {formatDate(getValue() as string | undefined)}
          </Text>
        ),
        header: "Last Played",
        id: "lastPlayedAt",
        size: 100,
      },
      {
        accessorKey: "rating",
        cell: ({ row }) => (
          <RatingSelector
            onRatingChange={onRatingChange}
            rating={row.original.rating ?? null}
            trackId={row.original.id}
          />
        ),
        header: "Rating",
        id: "rating",
        size: 120,
      },
      {
        accessorKey: "tags",
        cell: ({ row }) => (
          <InlineTagEditor
            onTagsChange={onRefetch}
            trackId={row.original.id}
            trackTags={row.original.tags}
          />
        ),
        enableSorting: false,
        header: "Tags",
        id: "tags",
        size: 150,
      },
      {
        accessorKey: "sources",
        cell: ({ row }) => <TrackSources sources={row.original.sources} />,
        enableSorting: false,
        header: "Sources",
        id: "sources",
        size: 200,
      },
    ],
    [currentTrack?.id, isPlaying, onRatingChange, onRefetch],
  );
}
