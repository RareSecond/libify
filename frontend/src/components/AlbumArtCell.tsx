import { Box, Center, Group } from "@mantine/core";
import { Music, Volume2 } from "lucide-react";

interface AlbumArtCellProps {
  album?: string;
  albumArt?: string;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  title: string;
}

export function AlbumArtCell({
  album,
  albumArt,
  isCurrentTrack,
  isPlaying,
  title,
}: AlbumArtCellProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      {albumArt ? (
        <Box className="h-9 w-9 rounded overflow-hidden relative">
          <img
            alt={album || title}
            className="h-9 w-9 object-cover"
            loading="lazy"
            src={albumArt}
          />
          {isCurrentTrack && isPlaying && (
            <Center className="absolute inset-0 bg-black/60 text-white">
              <Volume2 size={20} />
            </Center>
          )}
        </Box>
      ) : (
        <Center className="h-9 w-9 rounded bg-gray-200">
          {isCurrentTrack && isPlaying ? (
            <Volume2 size={18} />
          ) : (
            <Music color="gray" size={18} />
          )}
        </Center>
      )}
    </Group>
  );
}
