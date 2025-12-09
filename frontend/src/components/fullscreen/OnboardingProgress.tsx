import { Progress, Text } from "@mantine/core";

interface OnboardingProgressProps {
  currentIndex: number;
  totalTracks: number;
}

export function OnboardingProgress({
  currentIndex,
  totalTracks,
}: OnboardingProgressProps) {
  const rawPercent =
    totalTracks > 0 ? ((currentIndex + 1) / totalTracks) * 100 : 0;
  const progressPercent = Number.isFinite(rawPercent)
    ? Math.min(100, Math.max(0, rawPercent))
    : 0;

  return (
    <div className="px-4 md:px-8 py-2">
      <div className="flex items-center justify-between mb-2">
        <Text className="text-sm text-dark-1">
          Track {currentIndex + 1} of {totalTracks}
        </Text>
        <Text className="text-sm text-dark-1">
          {Math.round(progressPercent)}%
        </Text>
      </div>
      <Progress color="orange" size="sm" value={progressPercent} />
    </div>
  );
}
