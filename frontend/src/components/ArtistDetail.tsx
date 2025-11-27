import { Center, Loader, Text } from "@mantine/core";

import { useLibraryControllerGetArtistTracks } from "../data/api";
import { TracksTable } from "./TracksTable";

interface ArtistDetailProps {
  artist: string;
}

export function ArtistDetail({ artist }: ArtistDetailProps) {
  const { data, error, isLoading } =
    useLibraryControllerGetArtistTracks(artist);

  if (isLoading) {
    return (
      <Center className="h-[400px]">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading artist tracks: {error.message}
        </Text>
      </Center>
    );
  }

  const tracks = data?.tracks || [];
  // Use the actual database artistId from track data for playback context
  const artistId = tracks[0]?.artistId;

  if (tracks.length === 0) {
    return (
      <Center className="h-[400px]">
        <Text className="text-lg text-gray-600">
          No tracks found for this artist
        </Text>
      </Center>
    );
  }

  return (
    <TracksTable contextId={artistId} contextType="artist" tracks={tracks} />
  );
}
