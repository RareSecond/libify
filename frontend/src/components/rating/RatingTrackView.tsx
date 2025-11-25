import { Button, Group, Image, Stack, Text, Title } from "@mantine/core";

import { InlineTagEditor } from "@/components/InlineTagEditor";
import { RatingSelector } from "@/components/RatingSelector";
import { TrackDto } from "@/data/api";
import { useTrackRatingMutation } from "@/hooks/useTrackRatingMutation";

interface RatingTrackViewProps {
  currentTrackIndex: number;
  libraryTrack: TrackDto;
  onLibraryTrackUpdate: () => Promise<void>;
  onMouseRating: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  updateRatingMutation: ReturnType<typeof useTrackRatingMutation>;
}

export function RatingTrackView({
  currentTrackIndex,
  libraryTrack,
  onLibraryTrackUpdate,
  onMouseRating,
  onPrevious,
  onSkip,
  updateRatingMutation,
}: RatingTrackViewProps) {
  return (
    <>
      {/* Album Art - flex to fill remaining space */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        <Image
          alt={libraryTrack.album || "Album"}
          className="max-w-full max-h-full object-contain border-4 border-dark-5 shadow-2xl rounded-lg"
          src={libraryTrack.albumArt}
        />
      </div>

      {/* Track Info */}
      <Stack align="center" className="mt-2" gap={4}>
        <Title className="text-xl md:text-3xl font-bold text-center" order={1}>
          {libraryTrack.title}
        </Title>
        <Text className="text-dark-1 text-base md:text-xl text-center">
          {libraryTrack.artist}
        </Text>
        {libraryTrack.album && (
          <Text className="text-dark-2 text-sm md:text-lg text-center">
            {libraryTrack.album}
          </Text>
        )}
      </Stack>

      {/* Rating Stars */}
      <Stack align="center" className="mt-2" gap="xs">
        <Text className="text-dark-1 font-bold uppercase tracking-wider text-sm md:text-lg">
          Rate This Track
        </Text>
        <RatingSelector
          externalMutation={updateRatingMutation}
          onRatingChange={onMouseRating}
          rating={libraryTrack.rating ?? null}
          size="xl"
          trackId={libraryTrack.id}
        />
      </Stack>

      {/* Tags */}
      <Stack align="center" className="mt-1" gap="xs">
        <Text className="text-dark-1 font-semibold uppercase tracking-wide text-xs md:text-sm">
          Tags
        </Text>
        <InlineTagEditor
          onTagsChange={onLibraryTrackUpdate}
          trackId={libraryTrack.id}
          trackTags={libraryTrack.tags}
        />
      </Stack>

      {/* Controls */}
      <Group className="mt-3" gap="md" justify="center">
        <Button
          color="gray"
          disabled={currentTrackIndex === 0}
          onClick={onPrevious}
          size="sm"
          variant="light"
        >
          Previous (P)
        </Button>
        <Button color="orange" onClick={onSkip} size="sm">
          Skip (N)
        </Button>
      </Group>
    </>
  );
}
