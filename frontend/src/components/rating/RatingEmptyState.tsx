import { Button, Center, Stack, Text, Title } from "@mantine/core";

interface RatingEmptyStateProps {
  onClose: () => void;
}

export function RatingEmptyState({ onClose }: RatingEmptyStateProps) {
  return (
    <Center className="h-[80vh]">
      <Stack align="center" gap="xl">
        <Title className="text-5xl" order={1}>
          🎉
        </Title>
        <Title className="text-3xl text-dark-1" order={2}>
          No Unrated Tracks!
        </Title>
        <Text className="text-dark-2 text-xl">
          All your tracks have been rated. Great job!
        </Text>
        <Button color="orange" onClick={onClose} size="lg">
          Back to Dashboard
        </Button>
      </Stack>
    </Center>
  );
}
