import { Checkbox, Text } from "@mantine/core";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { AlbumArtCell } from "../components/AlbumArtCell";
import {
  ClickableAlbumCell,
  ClickableArtistCell,
} from "../components/ClickableTableCells";
import { InlineTagEditor } from "../components/InlineTagEditor";
import { RatingSelector } from "../components/RatingSelector";
import { TrackGenres } from "../components/TrackGenres";
import { TrackSources } from "../components/TrackSources";
import { TrackDto } from "../data/api";
import { getAudioFeatureColumns } from "../utils/audioFeatureColumns";
import { formatTime } from "../utils/format";

const formatDate = (date: null | string | undefined) =>
  date ? new Date(date).toLocaleDateString() : "-";

const dateColumn = (
  id: string,
  header: string,
  key: keyof TrackDto,
): ColumnDef<TrackDto> => ({
  accessorKey: key,
  cell: ({ getValue }) => (
    <Text className="text-gray-600" size="xs">
      {formatDate(getValue() as string | undefined)}
    </Text>
  ),
  header,
  id,
  size: 100,
});

const staticColumns: ColumnDef<TrackDto>[] = [
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
  dateColumn("lastPlayedAt", "Last Played", "lastPlayedAt"),
  dateColumn("addedAt", "Added", "addedAt"),
  dateColumn("releaseDate", "Released", "releaseDate"),
];

const endColumns: ColumnDef<TrackDto>[] = [
  {
    accessorKey: "sources",
    cell: ({ row }) => <TrackSources sources={row.original.sources} />,
    enableSorting: false,
    header: "Sources",
    id: "sources",
    size: 120,
  },
  {
    accessorKey: "artistGenres",
    cell: ({ row }) => <TrackGenres genres={row.original.artistGenres} />,
    enableSorting: false,
    header: "Genres",
    id: "genres",
    size: 80,
  },
  ...getAudioFeatureColumns(),
];

interface UseTracksTableColumnsOptions {
  currentTrack?: { id?: string };
  isAllOnPageSelected?: boolean;
  isPlaying: boolean;
  isSomeOnPageSelected?: boolean;
  isTrackSelected?: (trackId: string) => boolean;
  onRatingChange?: () => void;
  onRefetch?: () => void;
  onSelectAllOnPage?: () => void;
  onToggleTrack?: (trackId: string) => void;
  showSelection?: boolean;
}

export function useTracksTableColumns({
  currentTrack,
  isAllOnPageSelected,
  isPlaying,
  isSomeOnPageSelected,
  isTrackSelected,
  onRatingChange,
  onRefetch,
  onSelectAllOnPage,
  onToggleTrack,
  showSelection = false,
}: UseTracksTableColumnsOptions) {
  return useMemo<ColumnDef<TrackDto>[]>(() => {
    const columns: ColumnDef<TrackDto>[] = [];

    if (
      showSelection &&
      onToggleTrack &&
      onSelectAllOnPage &&
      isTrackSelected
    ) {
      columns.push({
        cell: ({ row }) => (
          <Checkbox
            checked={isTrackSelected(row.original.id)}
            onChange={() => onToggleTrack(row.original.id)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={isAllOnPageSelected}
            indeterminate={isSomeOnPageSelected}
            onChange={onSelectAllOnPage}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        id: "select",
        size: 40,
      });
    }

    columns.push(
      {
        cell: ({ row }) => (
          <AlbumArtCell
            album={row.original.album}
            albumArt={row.original.albumArt}
            isCurrentTrack={currentTrack?.id === row.original.spotifyId}
            isPlaying={isPlaying}
            title={row.original.title}
          />
        ),
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
              className={`font-medium ${isCurrentTrack && isPlaying ? "text-orange-5" : ""}`}
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
          <ClickableArtistCell artist={getValue() as string} />
        ),
        header: "Artist",
        id: "artist",
        size: 150,
      },
      {
        accessorKey: "album",
        cell: ({ getValue, row }) => (
          <ClickableAlbumCell
            album={getValue() as string}
            artist={row.original.artist}
          />
        ),
        header: "Album",
        id: "album",
        size: 150,
      },
      ...staticColumns,
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
        size: 80,
      },
      ...endColumns,
    );

    return columns;
  }, [
    currentTrack?.id,
    isAllOnPageSelected,
    isPlaying,
    isSomeOnPageSelected,
    isTrackSelected,
    onRatingChange,
    onRefetch,
    onSelectAllOnPage,
    onToggleTrack,
    showSelection,
  ]);
}
