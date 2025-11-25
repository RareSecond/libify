import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { useLibraryControllerGetTracks } from "@/data/api";

export function RatingModeCard() {
  const navigate = useNavigate();

  const { data: unratedData } = useLibraryControllerGetTracks({
    page: 1,
    pageSize: 1,
    unratedOnly: true,
  });

  const unratedCount = unratedData?.total || 0;

  return (
    <Card className="border border-dark-5 bg-dark-8 p-6" shadow="sm">
      <Stack gap="md">
        <Group align="center" gap="sm">
          <Star className="text-orange-6" size={24} />
          <Text className="text-dark-0 font-semibold" size="lg">
            Rating Mode
          </Text>
        </Group>

        <Text className="text-dark-2" size="sm">
          {unratedCount > 0
            ? `You have ${unratedCount.toLocaleString()} unrated track${unratedCount === 1 ? "" : "s"}`
            : "All tracks rated!"}
        </Text>

        <Button
          color="orange"
          disabled={unratedCount === 0}
          fullWidth
          onClick={() => navigate({ to: "/rating" })}
          size="md"
        >
          {unratedCount > 0 ? "Start Rating" : "No Unrated Tracks"}
        </Button>

        <Text className="text-dark-3 text-center" size="xs">
          Rate tracks quickly with keyboard shortcuts
        </Text>
      </Stack>
    </Card>
  );
}
