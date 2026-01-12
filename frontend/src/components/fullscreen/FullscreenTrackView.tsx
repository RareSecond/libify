import { Image, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

import { InlineTagEditor } from "@/components/InlineTagEditor";
import { RatingSelector } from "@/components/RatingSelector";
import { TrackDto } from "@/data/api";

interface FullscreenTrackViewProps {
  libraryTrack: TrackDto;
  onLibraryTrackUpdate: () => Promise<void>;
  onRating?: (rating: number) => void;
}

export function FullscreenTrackView({
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
      <Stack align="center" className="mt-2" gap="xs">
        <RatingSelector
          onRatingChange={onRating}
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
    </>
  );
}
