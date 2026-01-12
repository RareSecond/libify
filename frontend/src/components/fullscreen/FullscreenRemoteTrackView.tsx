import { FullscreenSpotifyTrackView } from "./FullscreenSpotifyTrackView";

interface FullscreenRemoteTrackViewProps {
  remoteTrack: RemoteTrack;
}

interface RemoteTrack {
  album: { images: string[]; name: string };
  artists: { name: string }[];
  name: string;
}

export function FullscreenRemoteTrackView({
  remoteTrack,
}: FullscreenRemoteTrackViewProps) {
  return (
    <FullscreenSpotifyTrackView
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
