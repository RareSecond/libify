import { useEffect } from "react";

interface UseFullscreenKeyboardProps {
  isRatingPending: boolean;
  libraryTrack: null | undefined | { id: string };
  onClose: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onPrevious: () => void;
  onRating: (rating: number) => void;
}

export function useFullscreenKeyboard({
  isRatingPending,
  libraryTrack,
  onClose,
  onNext,
  onPlayPause,
  onPrevious,
  onRating,
}: UseFullscreenKeyboardProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const digitMatch = e.code.match(/^Digit([1-5])$/);
      if (digitMatch && libraryTrack && !isRatingPending) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        e.preventDefault();
        onRating(
          e.shiftKey ? parseInt(digitMatch[1]) - 0.5 : parseInt(digitMatch[1]),
        );
      }
      if (e.key === " ") {
        e.preventDefault();
        onPlayPause();
      }
      if (e.key === "n" || e.key === "ArrowRight") onNext();
      if (e.key === "p" || e.key === "ArrowLeft") onPrevious();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    libraryTrack,
    isRatingPending,
    onRating,
    onPlayPause,
    onNext,
    onPrevious,
    onClose,
  ]);
}
