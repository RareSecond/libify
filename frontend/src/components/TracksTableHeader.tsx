import { Table } from "@mantine/core";
import { flexRender, Header, Table as ReactTable } from "@tanstack/react-table";
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
  table: ReactTable<TrackDto>;
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
  table,
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

          const isResizing =
            table.getState().columnSizingInfo.isResizingColumn ===
            header.column.id;

          return (
            <Table.Th
              className={`relative select-none transition-opacity duration-200 ${hiddenOnMobile ? "hidden md:table-cell" : ""}`}
              key={header.id}
              onDragEnter={(e) => onDragEnter(e, header.column.id)}
              onDragOver={onDragOver}
              onDrop={onDrop}
              // eslint-disable-next-line react/forbid-component-props
              style={{
                opacity: draggedColumn === header.column.id ? 0.5 : 1,
                width: header.getSize(),
              }}
            >
              <div
                className={`flex items-center gap-1 text-xs md:text-sm pr-2 ${draggedColumn ? "cursor-grabbing" : "cursor-grab"} ${canSort ? "hover:text-orange-5" : ""}`}
                draggable
                onClick={(e) => {
                  if (canSort && onSortChange) {
                    e.stopPropagation();
                    onSortChange(header.column.id);
                  }
                }}
                onDragEnd={onDragEnd}
                onDragStart={(e) => onDragStart(e, header.column.id)}
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
              {header.column.getCanResize() && (
                <div
                  className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none bg-transparent hover:bg-orange-5 ${
                    isResizing ? "bg-orange-5" : ""
                  }`}
                  onDoubleClick={() => header.column.resetSize()}
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                />
              )}
            </Table.Th>
          );
        })}
      </Table.Tr>
    </Table.Thead>
  );
}
