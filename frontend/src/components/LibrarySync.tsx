import { Alert, Badge, Button, Card, Group, Progress, Stack, Text } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Music, RefreshCw } from "lucide-react";
import { useState } from "react";

interface SyncResult {
  message: string;
  result: {
    errors: string[];
    newTracks: number;
    totalTracks: number;
    updatedTracks: number;
  };
}

interface SyncStatus {
  lastSync: null | string;
  totalTracks: number;
}

export function LibrarySync() {
  const [syncProgress, setSyncProgress] = useState<null | number>(null);

  // Query for sync status
  const { data: syncStatus, refetch: refetchStatus } = useQuery<SyncStatus>({
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/library/sync/status`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
    queryKey: ['library-sync-status'],
  });

  // Mutation for syncing library
  const syncLibraryMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      setSyncProgress(0);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/library/sync`, {
        credentials: 'include',
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync library');
      }
      return response.json();
    },
    onError: () => {
      setSyncProgress(null);
    },
    onSuccess: () => {
      setSyncProgress(100);
      refetchStatus();
      setTimeout(() => setSyncProgress(null), 2000);
    },
  });

  const formatLastSync = (lastSync: null | string) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <Card padding="lg" radius="md" shadow="sm" withBorder>
      <Stack gap="md">
        <Group align="center" justify="space-between">
          <div>
            <Text fw={500} size="lg">Library Sync</Text>
            <Text color="dimmed" size="sm">
              Keep your Spotify library in sync
            </Text>
          </div>
          <Badge
            color="blue"
            leftSection={<Music size={14} />}
            size="lg"
            variant="light"
          >
            {syncStatus?.totalTracks || 0} tracks
          </Badge>
        </Group>

        {syncStatus && (
          <Group gap="xs">
            <Text color="dimmed" size="sm">Last synced:</Text>
            <Text fw={500} size="sm">
              {formatLastSync(syncStatus.lastSync)}
            </Text>
          </Group>
        )}

        {syncProgress !== null && (
          <Progress
            animated
            color="green"
            striped={syncProgress < 100}
            value={syncProgress}
          />
        )}

        {syncLibraryMutation.isError && (
          <Alert
            color="red"
            icon={<AlertCircle size={16} />}
            title="Sync Failed"
            variant="light"
          >
            {syncLibraryMutation.error?.message || 'An error occurred while syncing'}
          </Alert>
        )}

        {syncLibraryMutation.isSuccess && syncLibraryMutation.data && (
          <Alert
            color="green"
            icon={<CheckCircle size={16} />}
            title="Sync Complete"
            variant="light"
          >
            <Stack gap="xs">
              <Text size="sm">
                Synced {syncLibraryMutation.data.result.totalTracks} tracks
              </Text>
              {syncLibraryMutation.data.result.newTracks > 0 && (
                <Text size="sm">
                  • {syncLibraryMutation.data.result.newTracks} new tracks added
                </Text>
              )}
              {syncLibraryMutation.data.result.updatedTracks > 0 && (
                <Text size="sm">
                  • {syncLibraryMutation.data.result.updatedTracks} tracks updated
                </Text>
              )}
              {syncLibraryMutation.data.result.errors.length > 0 && (
                <Text color="red" size="sm">
                  • {syncLibraryMutation.data.result.errors.length} errors occurred
                </Text>
              )}
            </Stack>
          </Alert>
        )}

        <Button
          disabled={syncProgress !== null && syncProgress < 100}
          fullWidth
          leftSection={<RefreshCw size={16} />}
          loading={syncLibraryMutation.isPending}
          onClick={() => syncLibraryMutation.mutate()}
        >
          {syncLibraryMutation.isPending ? 'Syncing...' : 'Sync Now'}
        </Button>
      </Stack>
    </Card>
  );
}