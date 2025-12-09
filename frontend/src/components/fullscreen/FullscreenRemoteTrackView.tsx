import { FullscreenSpotifyTrackView } from "./FullscreenSpotifyTrackView";

interface FullscreenRemoteTrackViewProps {
  onNext: () => void;
  onPrevious: () => void;
  remoteTrack: RemoteTrack;
}

interface RemoteTrack {
  album: { images: string[]; name: string };
  artists: { name: string }[];
  name: string;
}

export function FullscreenRemoteTrackView({
  onNext,
  onPrevious,
  remoteTrack,
}: FullscreenRemoteTrackViewProps) {
  return (
    <FullscreenSpotifyTrackView
      currentTrackIndex={0}
      onNext={onNext}
      onPrevious={onPrevious}
      track={{
        album: {
          images: remoteTrack.album.images.map((url) => ({ url })),
          name: remoteTrack.album.name,
        },
        artists: remoteTrack.artists.map((a) => ({ name: a.name })),
        name: remoteTrack.name,
      }}
    />
  );
}
