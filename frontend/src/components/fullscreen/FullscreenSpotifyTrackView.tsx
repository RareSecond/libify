import { Badge, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

interface FullscreenSpotifyTrackViewProps {
  track: SpotifyTrack;
}

interface SpotifyTrack {
  album: { images: Array<{ url: string }>; name: string };
  artists: Array<{ name: string }>;
  name: string;
}

export function FullscreenSpotifyTrackView({
  track,
}: FullscreenSpotifyTrackViewProps) {
  const navigate = useNavigate();
  const albumArt = track.album.images[0]?.url;

  return (
    <>
      {/* Album Art - flex to fill remaining space */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        <img
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
          {track.artists.map((artist, index) => (
            <span key={artist.name}>
              <Text
                className="cursor-pointer hover:underline hover:text-orange-5"
                component="span"
                inherit
                onClick={() =>
                  navigate({
                    params: { artist: artist.name },
                    to: "/artists/$artist",
                  })
                }
              >
                {artist.name}
              </Text>
              {index < track.artists.length - 1 && ", "}
            </span>
          ))}
        </Text>
        <Text
          className="text-dark-2 text-sm md:text-lg text-center cursor-pointer hover:underline hover:text-orange-5"
          onClick={() =>
            navigate({
              params: {
                album: track.album.name,
                artist: track.artists[0]?.name ?? "",
              },
              to: "/albums/$artist/$album",
            })
          }
        >
          {track.album.name}
        </Text>
      </Stack>

      {/* Not in library notice */}
      <Stack align="center" className="mt-4" gap="xs">
        <Badge color="gray" size="lg" variant="light">
          Not in your library
        </Badge>
      </Stack>
    </>
  );
}
