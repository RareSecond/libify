import { Badge, Loader, Text } from "@mantine/core";

import { TrackDto } from "@/data/api";

import { FullscreenRemoteTrackView } from "./FullscreenRemoteTrackView";
import { FullscreenSpotifyTrackView } from "./FullscreenSpotifyTrackView";
import { FullscreenTrackView } from "./FullscreenTrackView";

const SHORTCUTS_TEXT =
  "1-5 = Full Stars · Shift+1-5 = Half Stars · Space = Play/Pause · N = Next · P = Previous · Esc = Back";

interface FullscreenContentProps {
  currentTrack?: null | SpotifyTrack;
  isLoading: boolean;
  isOnboarding: boolean;
  isRemotePlayback: boolean;
  libraryTrack?: null | TrackDto;
  onLibraryTrackUpdate: () => Promise<void>;
  onRating?: (rating: number) => void;
  remoteDevice?: null | { name: string };
  remoteTrack?: null | RemoteTrack;
}

interface RemoteTrack {
  album: { images: string[]; name: string };
  artists: { name: string }[];
  name: string;
}

interface SpotifyTrack {
  album: { images: Array<{ url: string }>; name: string };
  artists: Array<{ name: string }>;
  id?: string;
  linked_from?: { id: string };
  name: string;
}

export function FullscreenContent({
  currentTrack,
  isLoading,
  isOnboarding,
  isRemotePlayback,
  libraryTrack,
  onLibraryTrackUpdate,
  onRating,
  remoteDevice,
  remoteTrack,
}: FullscreenContentProps) {
  return (
    <div className="flex-1 flex flex-col items-center px-4 md:px-8 pb-4 gap-2 min-h-0">
      {remoteDevice && !isOnboarding && (
        <Badge color="blue" size="lg" variant="light">
          Playing on {remoteDevice.name}
        </Badge>
      )}
      <Text className="text-dark-3 text-center text-xs md:text-sm hidden md:block">
        <strong>Shortcuts:</strong> {SHORTCUTS_TEXT}
      </Text>
      {isLoading && !isOnboarding ? (
        <Loader color="orange" size="xl" />
      ) : libraryTrack ? (
        <FullscreenTrackView
          libraryTrack={libraryTrack}
          onLibraryTrackUpdate={onLibraryTrackUpdate}
          onRating={onRating}
        />
      ) : currentTrack ? (
        <FullscreenSpotifyTrackView track={currentTrack} />
      ) : isRemotePlayback && remoteTrack ? (
        <FullscreenRemoteTrackView remoteTrack={remoteTrack} />
      ) : null}
    </div>
  );
}
