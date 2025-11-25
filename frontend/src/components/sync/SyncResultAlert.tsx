import { Alert, Stack, Text } from "@mantine/core";
import { CheckCircle } from "lucide-react";

import { SyncResult } from "@/hooks/useSyncProgress";

interface SyncResultAlertProps {
  result: SyncResult;
}

export function SyncResultAlert({ result }: SyncResultAlertProps) {
  return (
    <Alert
      color="green"
      icon={<CheckCircle size={16} />}
      title="Sync Complete"
      variant="light"
    >
      <Stack gap="xs">
        <Text size="sm">
          Synced {result.totalTracks} tracks and {result.totalAlbums} albums
        </Text>
        {result.newTracks > 0 && (
          <Text size="sm">• {result.newTracks} new tracks added</Text>
        )}
        {result.updatedTracks > 0 && (
          <Text size="sm">• {result.updatedTracks} tracks updated</Text>
        )}
        {result.newAlbums > 0 && (
          <Text size="sm">• {result.newAlbums} new albums added</Text>
        )}
        {result.updatedAlbums > 0 && (
          <Text size="sm">• {result.updatedAlbums} albums updated</Text>
        )}
        {result.errors?.length > 0 && (
          <Text color="red" size="sm">
            • {result.errors.length} errors occurred
          </Text>
        )}
      </Stack>
    </Alert>
  );
}
