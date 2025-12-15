import { Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

interface ClickableAlbumCellProps {
  album: null | string | undefined;
  artist: string;
}

interface ClickableArtistCellProps {
  artist: string;
}

export function ClickableAlbumCell({ album, artist }: ClickableAlbumCellProps) {
  const navigate = useNavigate();

  if (!album) {
    return (
      <Text className="text-gray-600" lineClamp={1} size="sm">
        -
      </Text>
    );
  }

  return (
    <Text
      className="text-gray-600 cursor-pointer hover:underline hover:text-orange-5"
      lineClamp={1}
      onClick={(e) => {
        e.stopPropagation();
        navigate({ params: { album, artist }, to: "/albums/$artist/$album" });
      }}
      size="sm"
    >
      {album}
    </Text>
  );
}

export function ClickableArtistCell({ artist }: ClickableArtistCellProps) {
  const navigate = useNavigate();

  return (
    <Text
      className="cursor-pointer hover:underline hover:text-orange-5"
      lineClamp={1}
      onClick={(e) => {
        e.stopPropagation();
        navigate({ params: { artist }, to: "/artists/$artist" });
      }}
      size="sm"
    >
      {artist}
    </Text>
  );
}
