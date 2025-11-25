import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { AlertCircle, RefreshCw } from "lucide-react";

interface SyncFailedViewProps {
  error?: string;
  onStartNewSync: () => void;
}

export function SyncFailedView({ error, onStartNewSync }: SyncFailedViewProps) {
  return (
    <Stack gap="md">
      <Group gap="sm">
        <div className="p-2 bg-red-500/20 rounded-full">
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <div>
          <Text className="font-medium text-dark-0" size="lg">
            Sync Failed
          </Text>
          <Text className="text-dark-1" size="sm">
            Something went wrong during synchronization
          </Text>
        </div>
      </Group>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      <Button
        color="orange"
        leftSection={<RefreshCw size={16} />}
        onClick={onStartNewSync}
        variant="light"
      >
        Try again
      </Button>
    </Stack>
  );
}
