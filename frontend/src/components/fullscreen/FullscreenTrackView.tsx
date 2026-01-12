import { Image, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

import { InlineTagEditor } from "@/components/InlineTagEditor";
import { RatingSelector } from "@/components/RatingSelector";
import { TrackDto } from "@/data/api";

interface FullscreenTrackViewProps {
  isOnboarding?: boolean;
  libraryTrack: TrackDto;
  onLibraryTrackUpdate: () => Promise<void>;
  onRating?: (rating: number) => void;
}

export function FullscreenTrackView({
  isOnboarding,
  libraryTrack,
  onLibraryTrackUpdate,
  onRating,
}: FullscreenTrackViewProps) {
  const navigate = useNavigate();

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
        <Text
          className="text-dark-1 text-base md:text-xl text-center cursor-pointer hover:underline hover:text-orange-5"
          onClick={() =>
            navigate({
              params: { artist: libraryTrack.artist },
              to: "/artists/$artist",
            })
          }
        >
          {libraryTrack.artist}
        </Text>
        {libraryTrack.album && (
          <Text
            className="text-dark-2 text-sm md:text-lg text-center cursor-pointer hover:underline hover:text-orange-5"
            onClick={() =>
              navigate({
                params: {
                  album: libraryTrack.album!,
                  artist: libraryTrack.artist,
                },
                to: "/albums/$artist/$album",
              })
            }
          >
            {libraryTrack.album}
          </Text>
        )}
      </Stack>

      {/* Rating Stars */}
      <Stack
        align="center"
        className={`mt-3 ${isOnboarding ? "bg-dark-6 rounded-xl px-6 py-4 border-2 border-orange-5/50 shadow-lg shadow-orange-5/10" : ""}`}
        gap="xs"
      >
        {isOnboarding && (
          <Text className="text-orange-4 font-medium text-sm md:text-base mb-1">
            How do you feel about this track?
          </Text>
        )}
        <RatingSelector
          onRatingChange={onRating}
          rating={libraryTrack.rating ?? null}
          size="xl"
          trackId={libraryTrack.id}
        />
        {isOnboarding && (
          <Text className="text-dark-2 text-xs md:text-sm mt-1">
            Click a star to rate and continue
          </Text>
        )}
      </Stack>

      {/* Tags - hidden during onboarding to keep focus on rating */}
      {!isOnboarding && (
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
      )}
    </>
  );
}
