import { useContext } from "react";

import { SpotifyPlayerContext } from "@/contexts/SpotifyPlayerContextDef";

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error(
      "useSpotifyPlayer must be used within a SpotifyPlayerProvider",
    );
  }
  return context;
}
