import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

import { useLibraryControllerSyncLibrary } from "@/data/api";

interface SyncPromptCardProps {
  onSyncStarted?: () => void;
}

export function SyncPromptCard({ onSyncStarted }: SyncPromptCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const syncMutation = useLibraryControllerSyncLibrary();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncMutation.mutateAsync({ data: {} });
      notifications.show({
        color: "orange",
        message: "Your library is being synced in the background",
        title: "Sync started",
      });
      onSyncStarted?.();
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to start sync. Please try again.",
        title: "Sync failed",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card
      className="bg-gradient-to-br from-orange-9 to-dark-8 border-orange-7"
      padding="lg"
      radius="md"
      shadow="lg"
      withBorder
    >
      <Stack gap="md">
        <Group gap="xs">
          <AlertCircle color="var(--color-orange-5)" size={24} />
          <Title className="text-orange-4" order={3}>
            Sync Your Library
          </Title>
        </Group>

        <Text className="text-dark-1" size="sm">
          Your Spotify library hasn't been synced yet. Start your first sync to
          explore your music collection, rate tracks, and get personalized
          insights.
        </Text>

        <Button
          className="bg-orange-6 hover:bg-orange-7"
          fullWidth
          leftSection={<RefreshCw size={18} />}
          loading={isSyncing}
          onClick={handleSync}
          size="lg"
        >
          Start Sync
        </Button>
      </Stack>
    </Card>
  );
}
