import { Group, Progress, Text } from "@mantine/core";
import { Loader2 } from "lucide-react";

import { SyncProgress } from "@/hooks/useSyncProgress";

interface SyncProgressViewProps {
  progress?: SyncProgress;
}

export function SyncProgressView({ progress }: SyncProgressViewProps) {
  const progressPercentage = progress?.percentage ?? 0;
  const progressMessage = progress?.message ?? "Syncing library...";

  return (
    <div className="bg-dark-7 border border-dark-5 rounded-md p-4">
      <Group className="mb-3" justify="space-between">
        <Group gap="xs">
          <Loader2 className="text-orange-5 animate-spin" size={18} />
          <Text className="text-dark-0 font-medium" size="sm">
            {progressMessage}
          </Text>
        </Group>
        <Text className="text-dark-2" size="sm">
          {Math.round(progressPercentage)}%
        </Text>
      </Group>
      <Progress
        color="orange"
        radius="xl"
        size="md"
        value={progressPercentage}
      />
    </div>
  );
}
