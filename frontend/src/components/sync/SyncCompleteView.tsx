import { Button, Group, Stack, Text } from "@mantine/core";
import { CheckCircle, RefreshCw } from "lucide-react";

import { SyncJobStatus } from "@/hooks/useSyncProgress";

interface SyncCompleteViewProps {
  onStartNewSync: () => void;
  syncProgress: SyncJobStatus;
}

export function SyncCompleteView({
  onStartNewSync,
  syncProgress,
}: SyncCompleteViewProps) {
  const result = syncProgress.result;

  return (
    <Stack gap="md">
      <Group gap="sm">
        <div className="p-2 bg-green-500/20 rounded-full">
          <CheckCircle className="text-green-500" size={24} />
        </div>
        <div>
          <Text className="font-medium text-dark-0" size="lg">
            Sync Complete
          </Text>
          <Text className="text-dark-1" size="sm">
            Your library has been synchronized
          </Text>
        </div>
      </Group>

      {result && (
        <Stack gap="xs">
          <Group gap="lg">
            <div>
              <Text className="text-2xl font-bold text-dark-0">
                {result.totalTracks.toLocaleString()}
              </Text>
              <Text color="dimmed" size="xs">
                tracks synced
              </Text>
            </div>
            <div>
              <Text className="text-2xl font-bold text-dark-0">
                {result.totalAlbums.toLocaleString()}
              </Text>
              <Text color="dimmed" size="xs">
                albums synced
              </Text>
            </div>
            {result.totalPlaylists !== undefined &&
              result.totalPlaylists > 0 && (
                <div>
                  <Text className="text-2xl font-bold text-dark-0">
                    {result.totalPlaylists.toLocaleString()}
                  </Text>
                  <Text color="dimmed" size="xs">
                    playlists synced
                  </Text>
                </div>
              )}
          </Group>

          {(result.newTracks > 0 ||
            result.newAlbums > 0 ||
            result.updatedTracks > 0 ||
            result.updatedAlbums > 0) && (
            <Text color="dimmed" size="sm">
              {[
                result.newTracks > 0 && `${result.newTracks} new tracks`,
                result.newAlbums > 0 && `${result.newAlbums} new albums`,
                result.updatedTracks > 0 &&
                  `${result.updatedTracks} tracks updated`,
                result.updatedAlbums > 0 &&
                  `${result.updatedAlbums} albums updated`,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Text>
          )}

          {result.errors?.length > 0 && (
            <Text color="red" size="sm">
              {result.errors.length} errors occurred during sync
            </Text>
          )}
        </Stack>
      )}

      <Button
        color="gray"
        leftSection={<RefreshCw size={14} />}
        onClick={onStartNewSync}
        size="xs"
        variant="subtle"
      >
        Start new sync
      </Button>
    </Stack>
  );
}
