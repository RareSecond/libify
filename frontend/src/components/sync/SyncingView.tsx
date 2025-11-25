import { Progress, Text } from "@mantine/core";
import { Music } from "lucide-react";

interface SyncingViewProps {
  progress: SyncProgress;
}

interface SyncProgress {
  current?: number;
  message?: string;
  percentage?: number;
  phase?: string;
  total?: number;
}

export function SyncingView({ progress }: SyncingViewProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-center">
        <div className="p-4 bg-orange-100 rounded-full">
          <Music className="text-orange-600 animate-pulse" size={48} />
        </div>
      </div>

      <div className="space-y-2">
        <Text className="text-sm font-medium text-center">
          {progress.message || "Syncing your library..."}
        </Text>
        {progress.current != null &&
          progress.total != null &&
          progress.total > 0 && (
            <Text className="text-xs text-gray-600 text-center">
              {progress.current} / {progress.total} items
            </Text>
          )}
      </div>

      <Progress
        animated
        className="w-full"
        color="orange"
        radius="xl"
        size="lg"
        striped
        value={progress.percentage || 0}
      />

      {progress.phase && progress.phase !== "0" && (
        <Text className="text-xs text-gray-600 text-center">
          Phase: {progress.phase}
        </Text>
      )}
    </div>
  );
}
