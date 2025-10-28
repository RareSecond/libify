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

import { TrackDto } from "../data/api";
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
  contextType?: "album" | "artist" | "library" | "playlist";
  data?: PaginatedTracksResponse;
  error?: Error | null;
  extraControls?: ReactNode;
  hidePageSize?: boolean;
  hideSearch?: boolean;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefetch?: () => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (columnId: string) => void;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function TracksTableWithControls({
  contextId,
  contextType,
  data,
  error,
  extraControls,
  hidePageSize = false,
  hideSearch = false,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onRefetch,
  onSearchChange,
  onSortChange,
  page = 1,
  pageSize = 20,
  search = "",
  sortBy,
  sortOrder,
}: TracksTableWithControlsProps) {
  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading tracks: {error.message}
        </Text>
      </Center>
    );
  }

  return (
    <Paper className="p-4" radius="md" shadow="xs">
      {(!hideSearch || !hidePageSize || extraControls) && (
        <Group className="mb-2" justify="space-between">
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

          {!hidePageSize && (
            <Select
              className="w-[100px]"
              data={["10", "20", "50", "100"]}
              label="Page size"
              onChange={(value) => onPageSizeChange?.(parseInt(value || "20"))}
              value={pageSize.toString()}
            />
          )}
        </Group>
      )}

      <Text className="mb-2 text-gray-600" size="sm">
        {data?.total || 0} tracks
      </Text>

      <TracksTable
        contextId={contextId}
        contextType={contextType}
        isLoading={isLoading}
        onRefetch={onRefetch}
        onSortChange={onSortChange}
        page={page}
        pageSize={pageSize}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        tracks={data?.tracks || []}
      />

      {data && data.totalPages > 1 && (
        <Center className="mt-6">
          <Pagination
            boundaries={1}
            onChange={(newPage) => onPageChange?.(newPage)}
            siblings={1}
            total={data.totalPages}
            value={page}
          />
        </Center>
      )}
    </Paper>
  );
}
