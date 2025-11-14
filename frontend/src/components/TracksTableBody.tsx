import { Table } from "@mantine/core";
import { flexRender, Row } from "@tanstack/react-table";

import { TrackDto } from "../data/api";

interface TracksTableBodyProps {
  isPlaying: boolean;
  onPlayTrack: (title: string, spotifyId?: string) => void;
  originalSpotifyId?: string;
  rows: Row<TrackDto>[];
}

export function TracksTableBody({
  isPlaying,
  onPlayTrack,
  originalSpotifyId,
  rows,
}: TracksTableBodyProps) {
  return (
    <Table.Tbody>
      {rows.map((row) => {
        const isCurrentTrack = originalSpotifyId === row.original.spotifyId;
        return (
          <Table.Tr
            className={`cursor-pointer hover:bg-dark-6 transition-colors ${isCurrentTrack && isPlaying ? "bg-orange-9/20 border-l-2 border-l-orange-5" : ""}`}
            key={row.id}
            onClick={() =>
              onPlayTrack(row.original.title, row.original.spotifyId)
            }
          >
            {row.getVisibleCells().map((cell) => {
              const columnId = cell.column.id;
              const hiddenOnMobile = [
                "duration",
                "lastPlayedAt",
                "sources",
              ].includes(columnId);

              return (
                <Table.Td
                  className={hiddenOnMobile ? "hidden md:table-cell" : ""}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              );
            })}
          </Table.Tr>
        );
      })}
    </Table.Tbody>
  );
}
