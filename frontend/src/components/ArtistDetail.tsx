import { Center, Loader, Text } from '@mantine/core';

import { useLibraryControllerGetArtistTracks } from '../data/api';
import { TracksTable } from './TracksTable';

interface ArtistDetailProps {
  artist: string;
}

export function ArtistDetail({ artist }: ArtistDetailProps) {
  const { data: tracks, error, isLoading } = useLibraryControllerGetArtistTracks(artist);

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h={400}>
        <Text c="red">Error loading artist tracks: {error.message}</Text>
      </Center>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <Center h={400}>
        <Text c="dimmed" size="lg">
          No tracks found for this artist
        </Text>
      </Center>
    );
  }

  return <TracksTable tracks={tracks} />;
}