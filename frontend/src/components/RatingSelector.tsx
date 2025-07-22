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
            key={starIndex}
            style={{
              cursor: isUpdating ? "default" : "pointer",
              height: 16,
              marginLeft: starIndex > 1 ? -4 : 0,
              position: "relative",
              width: 16,
            }}
          >
            {/* Left half click area */}
            <div
              onClick={(e) =>
                !isUpdating && handleRatingClick(e, leftHalfValue)
              }
              onMouseEnter={() =>
                !isUpdating && setHoveredRating(leftHalfValue)
              }
              style={{
                height: "100%",
                left: 0,
                position: "absolute",
                top: 0,
                width: "50%",
                zIndex: 2,
              }}
            />
            {/* Right half click area */}
            <div
              onClick={(e) => !isUpdating && handleRatingClick(e, fullValue)}
              onMouseEnter={() => !isUpdating && setHoveredRating(fullValue)}
              style={{
                height: "100%",
                position: "absolute",
                right: 0,
                top: 0,
                width: "50%",
                zIndex: 2,
              }}
            />
            {/* Star visual */}
            <div
              style={{ height: "100%", position: "relative", width: "100%" }}
            >
              {/* Background star (empty) */}
              <Star
                color="gray"
                fill="transparent"
                size={12}
                style={{ left: 2, position: "absolute", top: 2 }}
              />
              {/* Foreground star (filled) */}
              {fillType !== "empty" && (
                <div
                  style={{
                    height: "100%",
                    left: 0,
                    overflow: "hidden",
                    position: "absolute",
                    top: 0,
                    width: fillType === "half" ? "50%" : "100%",
                  }}
                >
                  <Star
                    color="gold"
                    fill="gold"
                    size={12}
                    style={{ left: 2, position: "absolute", top: 2 }}
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
