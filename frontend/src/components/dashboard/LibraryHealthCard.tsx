import { Button, Card, Group, Progress, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Star, Tag } from "lucide-react";

interface LibraryHealthCardProps {
  averageRating: number;
  percentageRated: number;
  percentageTagged: number;
  ratedTracks: number;
  taggedTracks: number;
  totalTracks: number;
  unratedTracks: number;
}

export function LibraryHealthCard({
  averageRating,
  percentageRated,
  percentageTagged,
  ratedTracks,
  taggedTracks,
  totalTracks,
  unratedTracks,
}: LibraryHealthCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="lg">
        <Group gap="xs">
          <Heart className="text-orange-5" size={20} />
          <Text className="text-dark-0 font-semibold" size="lg">
            Library Health
          </Text>
        </Group>

        <Stack gap="md">
          {/* Rating Progress */}
          <div>
            <Group className="mb-1.5" justify="space-between">
              <Group gap="xs">
                <Star className="text-orange-5" size={16} />
                <Text className="text-dark-1" size="sm">
                  Rated
                </Text>
              </Group>
              <Text className="text-dark-2" size="xs">
                {ratedTracks.toLocaleString()} of {totalTracks.toLocaleString()}{" "}
                tracks
                {averageRating > 0 && ` · ${averageRating.toFixed(1)} avg`}
              </Text>
            </Group>
            <Group align="center" gap="sm">
              <Progress
                className="flex-1"
                color="orange"
                radius="xl"
                size="lg"
                value={percentageRated}
              />
              <Text
                className="text-dark-0 font-semibold w-12 text-right"
                size="sm"
              >
                {Math.round(percentageRated)}%
              </Text>
            </Group>
            {unratedTracks > 0 && (
              <Button
                className="mt-3"
                color="orange"
                onClick={() =>
                  navigate({ search: { genres: [] }, to: "/tracks" })
                }
                size="xs"
                variant="light"
              >
                Rate {unratedTracks.toLocaleString()} unrated tracks
              </Button>
            )}
          </div>

          {/* Tagging Progress */}
          <div>
            <Group className="mb-1.5" justify="space-between">
              <Group gap="xs">
                <Tag className="text-orange-5" size={16} />
                <Text className="text-dark-1" size="sm">
                  Tagged
                </Text>
              </Group>
              <Text className="text-dark-2" size="xs">
                {taggedTracks.toLocaleString()} of{" "}
                {totalTracks.toLocaleString()} tracks
              </Text>
            </Group>
            <Group align="center" gap="sm">
              <Progress
                className="flex-1"
                color="orange"
                radius="xl"
                size="lg"
                value={percentageTagged}
              />
              <Text
                className="text-dark-0 font-semibold w-12 text-right"
                size="sm"
              >
                {Math.round(percentageTagged)}%
              </Text>
            </Group>
            {totalTracks - taggedTracks > 0 && (
              <Button
                className="mt-3"
                color="orange"
                onClick={() =>
                  navigate({ search: { genres: [] }, to: "/tracks" })
                }
                size="xs"
                variant="light"
              >
                Manage tags
              </Button>
            )}
          </div>
        </Stack>
      </Stack>
    </Card>
  );
}
