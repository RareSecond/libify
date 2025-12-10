import {
  Center,
  Group,
  Pagination,
  Paper,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { Search } from "lucide-react";
import { ReactNode } from "react";

import { BulkOperationFilterDto, TrackDto } from "../data/api";
import { useColumnVisibility } from "../hooks/useColumnVisibility";
import { BulkSelectionWrapper } from "./BulkSelectionWrapper";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { FiltersDrawer } from "./FiltersDrawer";
import { TracksTable } from "./TracksTable";

export interface PaginatedTracksResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  tracks: TrackDto[];
}

interface TracksTableWithControlsProps {
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist" | "smart_playlist";
  currentFilters?: Omit<
    BulkOperationFilterDto,
    "albumId" | "artistId" | "playlistId"
  >;
  data?: PaginatedTracksResponse;
  error?: Error | null;
  extraControls?: ReactNode;
  hidePageSize?: boolean;
  hideSearch?: boolean;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRatingChange?: () => void;
  onRefetch?: () => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (columnId: string) => void;
  page?: number;
  pageSize?: number;
  search?: string;
  showSelection?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function TracksTableWithControls({
  contextId,
  contextType,
  currentFilters = {},
  data,
  error,
  extraControls,
  hidePageSize = false,
  hideSearch = false,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onRatingChange,
  onRefetch,
  onSearchChange,
  onSortChange,
  page = 1,
  pageSize = 20,
  search = "",
  showSelection = false,
  sortBy,
  sortOrder,
}: TracksTableWithControlsProps) {
  const { columnVisibility, setColumnVisibility, toggleColumnVisibility } =
    useColumnVisibility();

  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-500">
          Error loading tracks: {error.message}
        </Text>
      </Center>
    );
  }

  return (
    <BulkSelectionWrapper
      contextId={contextId}
      contextType={contextType}
      currentFilters={currentFilters}
      enabled={showSelection}
      onRefetch={onRefetch}
      page={page}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      totalTracks={data?.total || 0}
      tracks={data?.tracks || []}
    >
      {(selection) => (
        <Paper
          className="p-2 md:p-4 bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
          radius="md"
          shadow="md"
          withBorder
        >
          {/* Desktop Controls */}
          {(!hideSearch || !hidePageSize || extraControls) && (
            <Group
              className="mb-3 md:mb-4 hidden md:flex"
              justify="space-between"
            >
              <Group>
                {!hideSearch && (
                  <TextInput
                    className="w-[300px]"
                    leftSection={<Search size={16} />}
                    onChange={(e) => onSearchChange?.(e.currentTarget.value)}
                    placeholder="Search tracks..."
                    value={search}
                  />
                )}
                {extraControls}
              </Group>

              <Group gap="sm">
                {!hidePageSize && (
                  <Select
                    className="w-[100px]"
                    data={["10", "20", "50", "100"]}
                    label="Page size"
                    onChange={(value) =>
                      onPageSizeChange?.(parseInt(value || "20"))
                    }
                    value={pageSize.toString()}
                  />
                )}
                <ColumnVisibilityMenu
                  columnVisibility={columnVisibility}
                  onToggle={toggleColumnVisibility}
                />
              </Group>
            </Group>
          )}

          {/* Mobile Controls */}
          <Group
            className="mb-2 md:hidden"
            justify="space-between"
            wrap="nowrap"
          >
            {!hideSearch && (
              <TextInput
                className="flex-1"
                leftSection={<Search size={16} />}
                onChange={(e) => onSearchChange?.(e.currentTarget.value)}
                placeholder="Search..."
                size="sm"
                value={search}
              />
            )}
            {!hidePageSize && (
              <FiltersDrawer
                onPageSizeChange={onPageSizeChange}
                pageSize={pageSize}
              >
                {extraControls}
              </FiltersDrawer>
            )}
          </Group>

          <Text className="mb-2 text-gray-600" size="xs md:sm">
            {data?.total || 0} tracks
          </Text>

          <TracksTable
            columnVisibility={columnVisibility}
            contextId={contextId}
            contextType={contextType}
            isAllOnPageSelected={selection.isAllOnPageSelected}
            isLoading={isLoading}
            isSomeOnPageSelected={selection.isSomeOnPageSelected}
            isTrackSelected={selection.isTrackSelected}
            onColumnVisibilityChange={setColumnVisibility}
            onRatingChange={onRatingChange}
            onRefetch={onRefetch}
            onSelectAllOnPage={selection.selectAllOnPage}
            onSortChange={onSortChange}
            onToggleTrack={selection.toggleTrack}
            page={page}
            pageSize={pageSize}
            search={search}
            showSelection={showSelection}
            sortBy={sortBy}
            sortOrder={sortOrder}
            tracks={data?.tracks || []}
          />

          {data && data.totalPages > 1 && (
            <Center className="mt-3 md:mt-6">
              <Pagination
                boundaries={1}
                onChange={(newPage) => onPageChange?.(newPage)}
                siblings={3}
                size="sm"
                total={data.totalPages}
                value={page}
              />
            </Center>
          )}
        </Paper>
      )}
    </BulkSelectionWrapper>
  );
}
