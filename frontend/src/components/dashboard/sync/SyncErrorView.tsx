import { Button, Group, Text } from "@mantine/core";
import { X } from "lucide-react";

interface SyncErrorViewProps {
  error?: string;
  onRetry: () => void;
}

export function SyncErrorView({ error, onRetry }: SyncErrorViewProps) {
  return (
    <div className="bg-dark-7 border border-red-900/50 rounded-md p-4">
      <Group justify="space-between">
        <Group gap="sm">
          <div className="p-2 bg-red-500/20 rounded-full">
            <X className="text-red-500" size={18} />
          </div>
          <div>
            <Text className="text-dark-0 font-medium" size="sm">
              Sync failed
            </Text>
            {error && (
              <Text className="text-dark-2" size="xs">
                {error}
              </Text>
            )}
          </div>
        </Group>
        <Button color="orange" onClick={onRetry} size="xs" variant="light">
          Try again
        </Button>
      </Group>
    </div>
  );
}
