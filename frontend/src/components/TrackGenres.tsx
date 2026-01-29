import { Badge, Tooltip } from "@mantine/core";
import { Music } from "lucide-react";

interface TrackGenresProps {
  genres: null | string[];
}

export function TrackGenres({ genres }: TrackGenresProps) {
  if (!genres || genres.length === 0) {
    return <span className="text-xs text-gray-500">-</span>;
  }

  return (
    <Tooltip label={genres.join(", ")}>
      <Badge
        color="gray"
        leftSection={<Music className="h-2.5 w-2.5" />}
        size="sm"
        variant="light"
      >
        {genres.length}
      </Badge>
    </Tooltip>
  );
}
