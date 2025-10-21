import { Group } from "@mantine/core";
import { Star } from "lucide-react";
import { useState } from "react";

import { useLibraryControllerUpdateTrackRating } from "../data/api";

interface RatingSelectorProps {
  onRatingChange?: () => void;
  rating: null | number;
  trackId: string;
}

export function RatingSelector({
  onRatingChange,
  rating,
  trackId,
}: RatingSelectorProps) {
  const [hoveredRating, setHoveredRating] = useState<null | number>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRatingMutation = useLibraryControllerUpdateTrackRating();

  const handleRatingClick = async (e: React.MouseEvent, newRating: number) => {
    e.stopPropagation();
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateRatingMutation.mutateAsync({
        data: { rating: newRating },
        trackId,
      });
      onRatingChange?.();
    } catch {
      // Silently handle errors
    } finally {
      setIsUpdating(false);
    }
  };

  const displayRating = hoveredRating ?? rating ?? 0;

  return (
    <Group gap={0} onMouseLeave={() => setHoveredRating(null)} wrap="nowrap">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const leftHalfValue = starIndex - 0.5;
        const fullValue = starIndex;

        const fillType =
          displayRating >= fullValue
            ? "full"
            : displayRating >= leftHalfValue
              ? "half"
              : "empty";

        return (
          <div
            className={`relative h-4 w-4 ${isUpdating ? "cursor-default" : "cursor-pointer"}`}
            key={starIndex}
            style={{ marginLeft: starIndex > 1 ? -4 : 0 }}
          >
            {/* Left half click area */}
            <div
              className="absolute left-0 top-0 z-[2] h-full w-1/2"
              onClick={(e) =>
                !isUpdating && handleRatingClick(e, leftHalfValue)
              }
              onMouseEnter={() =>
                !isUpdating && setHoveredRating(leftHalfValue)
              }
            />
            {/* Right half click area */}
            <div
              className="absolute right-0 top-0 z-[2] h-full w-1/2"
              onClick={(e) => !isUpdating && handleRatingClick(e, fullValue)}
              onMouseEnter={() => !isUpdating && setHoveredRating(fullValue)}
            />
            {/* Star visual */}
            <div className="relative h-full w-full">
              {/* Background star (empty) */}
              <Star
                className="absolute left-0.5 top-0.5"
                color="gray"
                fill="transparent"
                size={12}
              />
              {/* Foreground star (filled) */}
              {fillType !== "empty" && (
                <div
                  className={`absolute left-0 top-0 h-full overflow-hidden ${fillType === "half" ? "w-1/2" : "w-full"}`}
                >
                  <Star
                    className="absolute left-0.5 top-0.5"
                    color="gold"
                    fill="gold"
                    size={12}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Group>
  );
}
