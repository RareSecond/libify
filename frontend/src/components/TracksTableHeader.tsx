import { Table } from "@mantine/core";
import { flexRender, Header } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TrackDto } from "../data/api";

interface TracksTableHeaderProps {
  draggedColumn: null | string;
  headers: Header<TrackDto, unknown>[];
  onDragEnd: () => void;
  onDragEnter: (e: React.DragEvent, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, columnId: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onSortChange?: (columnId: string) => void;
}

export function TracksTableHeader({
  draggedColumn,
  headers,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDragStart,
  onDrop,
  onSortChange,
}: TracksTableHeaderProps) {
  return (
    <Table.Thead>
      <Table.Tr>
        {headers.map((header) => {
          const canSort = header.column.getCanSort();
          const isSorted = header.column.getIsSorted();
          const columnId = header.column.id;

          // Hide certain columns on mobile
          const hiddenOnMobile = [
            "duration",
            "lastPlayedAt",
            "sources",
          ].includes(columnId);

          return (
            <Table.Th
              className={`relative select-none transition-opacity duration-200 ${draggedColumn ? "cursor-grabbing" : "cursor-grab"} ${hiddenOnMobile ? "hidden md:table-cell" : ""}`}
              draggable
              key={header.id}
              onDragEnd={onDragEnd}
              onDragEnter={(e) => onDragEnter(e, header.column.id)}
              onDragOver={onDragOver}
              onDragStart={(e) => onDragStart(e, header.column.id)}
              onDrop={onDrop}
              // eslint-disable-next-line react/forbid-component-props
              style={{
                opacity: draggedColumn === header.column.id ? 0.5 : 1,
                width: header.getSize(),
              }}
            >
              <div
                className={`flex items-center gap-1 text-xs md:text-sm ${canSort ? "cursor-pointer" : ""}`}
                onClick={(e) => {
                  if (canSort && onSortChange) {
                    e.stopPropagation();
                    onSortChange(header.column.id);
                  }
                }}
                onDragStart={(e) => e.stopPropagation()}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
                {canSort && (
                  <span className="text-dark-2">
                    {isSorted === "desc" ? (
                      <ArrowDown size={12} />
                    ) : isSorted === "asc" ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </span>
                )}
              </div>
            </Table.Th>
          );
        })}
      </Table.Tr>
    </Table.Thead>
  );
}
