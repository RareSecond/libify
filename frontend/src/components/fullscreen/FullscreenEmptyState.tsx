import { Center, Stack, Text } from "@mantine/core";

import { FullscreenHeader } from "./FullscreenHeader";

interface FullscreenEmptyStateProps {
  onClose: () => void;
}

export function FullscreenEmptyState({ onClose }: FullscreenEmptyStateProps) {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col py-4">
      <FullscreenHeader onClose={onClose} />
      <Center className="flex-1">
        <Stack align="center" gap="md">
          <Text className="text-dark-2" size="xl">
            No track is currently playing
          </Text>
          <Text className="text-dark-3" size="sm">
            Start playing something to see it in fullscreen mode
          </Text>
        </Stack>
      </Center>
    </div>
  );
}
