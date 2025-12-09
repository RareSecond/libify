import { Center, Loader } from "@mantine/core";

import { FullscreenHeader } from "./FullscreenHeader";

interface FullscreenLoadingStateProps {
  closeText?: string;
  onClose: () => void;
}

export function FullscreenLoadingState({
  closeText,
  onClose,
}: FullscreenLoadingStateProps) {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col py-4">
      <FullscreenHeader closeText={closeText} onClose={onClose} />
      <Center className="flex-1">
        <Loader color="orange" size="xl" />
      </Center>
    </div>
  );
}
