import { useState } from "react";

interface PlayContext {
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist";
  search?: string;
}

export function useShuffleManager() {
  const [isShuffled, setIsShuffled] = useState(false);
  const [originalTrackList, setOriginalTrackList] = useState<string[]>([]);

  const shuffleArray = (array: string[]): string[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const toggleShuffle = async (
    currentTrackList: string[],
    currentTrackIndex: number,
    currentContext: null | PlayContext,
    setCurrentTrackList: (tracks: string[]) => void,
    setCurrentTrackIndex: (index: number) => void,
    fetchAllTracksForContext: () => Promise<string[]>,
  ) => {
    if (!currentTrackList.length) return;

    if (isShuffled) {
      const currentTrackUri = currentTrackList[currentTrackIndex];
      const newIndex = originalTrackList.indexOf(currentTrackUri);
      setCurrentTrackList(originalTrackList);
      setCurrentTrackIndex(newIndex >= 0 ? newIndex : 0);
      setIsShuffled(false);
    } else {
      let tracksToShuffle = currentTrackList;

      if (currentContext && currentContext.contextType) {
        const allTracks = await fetchAllTracksForContext();

        if (allTracks.length > currentTrackList.length) {
          tracksToShuffle = allTracks;
          setOriginalTrackList(allTracks);
        } else {
          setOriginalTrackList(currentTrackList);
        }
      } else {
        setOriginalTrackList(currentTrackList);
      }

      const currentTrackUri = currentTrackList[currentTrackIndex];
      const remainingTracks = tracksToShuffle.filter(
        (uri) => uri !== currentTrackUri,
      );
      const shuffledRemaining = shuffleArray(remainingTracks);
      const shuffledList = [currentTrackUri, ...shuffledRemaining];

      setCurrentTrackList(shuffledList);
      setCurrentTrackIndex(0);
      setIsShuffled(true);
    }
  };

  return {
    isShuffled,
    originalTrackList,
    setIsShuffled,
    setOriginalTrackList,
    toggleShuffle,
  };
}
