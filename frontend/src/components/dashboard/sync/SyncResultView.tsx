import { Button, Group, Stack, Text } from "@mantine/core";
import { Check, RefreshCw } from "lucide-react";

import { SyncResult } from "@/hooks/useSyncProgress";

interface SyncResultViewProps {
  onDismiss: () => void;
  result: SyncResult;
}

export function SyncResultView({ onDismiss, result }: SyncResultViewProps) {
  return (
    <div className="bg-dark-7 border border-dark-5 rounded-md p-4">
      <Stack gap="md">
        <Group gap="sm">
          <div className="p-2 bg-green-500/20 rounded-full">
            <Check className="text-green-500" size={20} />
          </div>
          <div>
            <Text className="font-medium text-dark-0" size="md">
              Sync Complete
            </Text>
            <Text className="text-dark-2" size="xs">
              Your library has been synchronized
            </Text>
          </div>
        </Group>

        <Group gap="lg">
          <div>
            <Text className="text-xl font-bold text-dark-0">
              {result.totalTracks.toLocaleString()}
            </Text>
            <Text className="text-dark-3" size="xs">
              tracks synced
            </Text>
          </div>
          <div>
            <Text className="text-xl font-bold text-dark-0">
              {result.totalAlbums.toLocaleString()}
            </Text>
            <Text className="text-dark-3" size="xs">
              albums synced
            </Text>
          </div>
          {result.totalPlaylists !== undefined && result.totalPlaylists > 0 && (
            <div>
              <Text className="text-xl font-bold text-dark-0">
                {result.totalPlaylists.toLocaleString()}
              </Text>
              <Text className="text-dark-3" size="xs">
                playlists synced
              </Text>
            </div>
          )}
        </Group>

        {(result.newTracks > 0 ||
          result.newAlbums > 0 ||
          result.updatedTracks > 0 ||
          result.updatedAlbums > 0) && (
          <Text className="text-dark-2" size="sm">
            {[
              result.newTracks > 0 && `${result.newTracks} new tracks`,
              result.newAlbums > 0 && `${result.newAlbums} new albums`,
              result.updatedTracks > 0 &&
                `${result.updatedTracks} tracks updated`,
              result.updatedAlbums > 0 &&
                `${result.updatedAlbums} albums updated`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        )}

        {result.errors?.length > 0 && (
          <Text className="text-red-400" size="sm">
            {result.errors.length} errors occurred during sync
          </Text>
        )}

        <Button
          color="gray"
          leftSection={<RefreshCw size={14} />}
          onClick={onDismiss}
          size="xs"
          variant="subtle"
        >
          Done
        </Button>
      </Stack>
    </div>
  );
}
