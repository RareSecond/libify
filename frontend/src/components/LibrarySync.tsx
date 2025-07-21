import { Button, Card, Group, Progress, Stack, Text, Badge, Alert } from "@mantine/core";
import { RefreshCw, Music, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

interface SyncStatus {
  totalTracks: number;
  lastSync: string | null;
}

interface SyncResult {
  message: string;
  result: {
    totalTracks: number;
    newTracks: number;
    updatedTracks: number;
    errors: string[];
  };
}

export function LibrarySync() {
  const [syncProgress, setSyncProgress] = useState<number | null>(null);

  // Query for sync status
  const { data: syncStatus, refetch: refetchStatus } = useQuery<SyncStatus>({
    queryKey: ['library-sync-status'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/library/sync/status`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
  });

  // Mutation for syncing library
  const syncLibraryMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      setSyncProgress(0);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/library/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync library');
      }
      return response.json();
    },
    onSuccess: () => {
      setSyncProgress(100);
      refetchStatus();
      setTimeout(() => setSyncProgress(null), 2000);
    },
    onError: () => {
      setSyncProgress(null);
    },
  });

  const formatLastSync = (lastSync: string | null) => {
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
        <Group justify="space-between" align="center">
          <div>
            <Text size="lg" fw={500}>Library Sync</Text>
            <Text size="sm" color="dimmed">
              Keep your Spotify library in sync
            </Text>
          </div>
          <Badge
            leftSection={<Music size={14} />}
            size="lg"
            variant="light"
            color="blue"
          >
            {syncStatus?.totalTracks || 0} tracks
          </Badge>
        </Group>

        {syncStatus && (
          <Group gap="xs">
            <Text size="sm" color="dimmed">Last synced:</Text>
            <Text size="sm" fw={500}>
              {formatLastSync(syncStatus.lastSync)}
            </Text>
          </Group>
        )}

        {syncProgress !== null && (
          <Progress
            value={syncProgress}
            animated
            striped={syncProgress < 100}
            color="green"
          />
        )}

        {syncLibraryMutation.isError && (
          <Alert
            icon={<AlertCircle size={16} />}
            title="Sync Failed"
            color="red"
            variant="light"
          >
            {syncLibraryMutation.error?.message || 'An error occurred while syncing'}
          </Alert>
        )}

        {syncLibraryMutation.isSuccess && syncLibraryMutation.data && (
          <Alert
            icon={<CheckCircle size={16} />}
            title="Sync Complete"
            color="green"
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
                <Text size="sm" color="red">
                  • {syncLibraryMutation.data.result.errors.length} errors occurred
                </Text>
              )}
            </Stack>
          </Alert>
        )}

        <Button
          leftSection={<RefreshCw size={16} />}
          onClick={() => syncLibraryMutation.mutate()}
          loading={syncLibraryMutation.isPending}
          disabled={syncProgress !== null && syncProgress < 100}
          fullWidth
        >
          {syncLibraryMutation.isPending ? 'Syncing...' : 'Sync Now'}
        </Button>
      </Stack>
    </Card>
  );
}