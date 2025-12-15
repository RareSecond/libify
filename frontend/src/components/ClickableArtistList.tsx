import { Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

interface Artist {
  name: string;
}

interface ClickableArtistListProps {
  artists: Artist[];
  className?: string;
  size?: "lg" | "md" | "sm" | "xl" | "xs";
}

export function ClickableArtistList({
  artists,
  className,
  size = "sm",
}: ClickableArtistListProps) {
  const navigate = useNavigate();

  return (
    <Text className={className} lineClamp={1} size={size}>
      {artists.map((artist, index) => (
        <span key={artist.name}>
          <Text
            className="cursor-pointer hover:underline hover:text-orange-5"
            component="span"
            inherit
            onClick={(e) => {
              e.stopPropagation();
              navigate({
                params: { artist: artist.name },
                to: "/artists/$artist",
              });
            }}
          >
            {artist.name}
          </Text>
          {index < artists.length - 1 && ", "}
        </span>
      ))}
    </Text>
  );
}
