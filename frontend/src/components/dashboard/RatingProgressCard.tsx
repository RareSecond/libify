import {
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Star } from "lucide-react";

interface RatingProgressCardProps {
  averageRating: number;
  percentageRated: number;
  ratedTracks: number;
  totalTracks: number;
  unratedTracks: number;
}

export function RatingProgressCard({
  averageRating,
  percentageRated,
  ratedTracks,
  totalTracks,
  unratedTracks,
}: RatingProgressCardProps) {
  const navigate = useNavigate();

  const handleStartRating = () => {
    navigate({ search: { genres: [] }, to: "/tracks" });
  };

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 h-full flex flex-col"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group align="center" gap="xs" justify="space-between">
          <Group gap="xs">
            <Star
              color="var(--color-orange-5)"
              fill="var(--color-orange-5)"
              size={20}
            />
            <Title className="text-dark-0" order={3}>
              Rating Progress
            </Title>
          </Group>
          <Text className="text-orange-5 font-semibold" size="xl">
            {percentageRated}%
          </Text>
        </Group>

        <Progress
          className="h-3"
          color="orange"
          radius="md"
          size="lg"
          value={percentageRated}
        />

        <Group className="text-dark-1" gap="xl" grow>
          <div>
            <Text className="text-dark-3" size="xs">
              Rated
            </Text>
            <Text className="text-dark-0 font-semibold" size="lg">
              {ratedTracks.toLocaleString()}
            </Text>
          </div>
          <div>
            <Text className="text-dark-3" size="xs">
              Unrated
            </Text>
            <Text className="text-dark-0 font-semibold" size="lg">
              {unratedTracks.toLocaleString()}
            </Text>
          </div>
          {averageRating > 0 && (
            <div>
              <Text className="text-dark-3" size="xs">
                Average
              </Text>
              <Text className="text-dark-0 font-semibold" size="lg">
                {averageRating.toFixed(1)}★
              </Text>
            </div>
          )}
        </Group>

        {unratedTracks > 0 && (
          <Button
            className="bg-orange-6 hover:bg-orange-7"
            fullWidth
            onClick={handleStartRating}
            size="md"
          >
            Rate {unratedTracks.toLocaleString()} Tracks
          </Button>
        )}

        {unratedTracks === 0 && totalTracks > 0 && (
          <Text className="text-center text-dark-2" size="sm">
            All tracks rated!
          </Text>
        )}
      </Stack>
    </Card>
  );
}
