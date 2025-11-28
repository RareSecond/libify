import { Badge, Button, Group, Image, Stack, Text, Title } from "@mantine/core";

interface FullscreenSpotifyTrackViewProps {
  currentTrackIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  track: SpotifyTrack;
}

interface SpotifyTrack {
  album: { images: Array<{ url: string }>; name: string };
  artists: Array<{ name: string }>;
  name: string;
}

export function FullscreenSpotifyTrackView({
  currentTrackIndex,
  onNext,
  onPrevious,
  track,
}: FullscreenSpotifyTrackViewProps) {
  const albumArt = track.album.images[0]?.url;
  const artistNames = track.artists.map((a) => a.name).join(", ");

  return (
    <>
      {/* Album Art - flex to fill remaining space */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        <Image
          alt={track.album.name}
          className="max-w-full max-h-full object-contain border-4 border-dark-5 shadow-2xl rounded-lg"
          src={albumArt}
        />
      </div>

      {/* Track Info */}
      <Stack align="center" className="mt-2" gap={4}>
        <Title className="text-xl md:text-3xl font-bold text-center" order={1}>
          {track.name}
        </Title>
        <Text className="text-dark-1 text-base md:text-xl text-center">
          {artistNames}
        </Text>
        <Text className="text-dark-2 text-sm md:text-lg text-center">
          {track.album.name}
        </Text>
      </Stack>

      {/* Not in library notice */}
      <Stack align="center" className="mt-4" gap="xs">
        <Badge color="gray" size="lg" variant="light">
          Not in your library
        </Badge>
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
        <Button color="orange" onClick={onNext} size="sm">
          Next (N)
        </Button>
      </Group>
    </>
  );
}
