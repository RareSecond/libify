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
      // Guard against out-of-range index
      let newIndex = 0;
      if (
        currentTrackIndex >= 0 &&
        currentTrackIndex < currentTrackList.length
      ) {
        const currentTrackUri = currentTrackList[currentTrackIndex];
        const foundIndex = originalTrackList.indexOf(currentTrackUri);
        newIndex = foundIndex >= 0 ? foundIndex : 0;
      }

      setCurrentTrackList(originalTrackList);
      setCurrentTrackIndex(newIndex);
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

      // Guard against out-of-range index
      let shuffledList: string[];
      if (
        currentTrackIndex >= 0 &&
        currentTrackIndex < currentTrackList.length
      ) {
        const currentTrackUri = currentTrackList[currentTrackIndex];
        const remainingTracks = tracksToShuffle.filter(
          (uri) => uri !== currentTrackUri,
        );
        const shuffledRemaining = shuffleArray(remainingTracks);
        shuffledList = [currentTrackUri, ...shuffledRemaining];
      } else {
        // If index is invalid, just shuffle all tracks
        shuffledList = shuffleArray(tracksToShuffle);
      }

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
