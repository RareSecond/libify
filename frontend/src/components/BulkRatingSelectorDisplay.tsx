import { Group } from "@mantine/core";
import { Star } from "lucide-react";
import { useState } from "react";

interface BulkRatingSelectorDisplayProps {
  onRatingChange: (rating: number) => void;
  rating: null | number;
  size?: "lg" | "md" | "sm" | "xl";
}

/**
 * A display-only rating selector for bulk operations
 * Unlike RatingSelector, this doesn't trigger API calls - just updates local state
 */
export function BulkRatingSelectorDisplay({
  onRatingChange,
  rating,
  size = "sm",
}: BulkRatingSelectorDisplayProps) {
  const [hoveredRating, setHoveredRating] = useState<null | number>(null);

  const handleRatingClick = (e: React.MouseEvent, newRating: number) => {
    e.stopPropagation();
    onRatingChange(newRating);
  };

  const displayRating = hoveredRating ?? rating ?? 0;

  // Size configurations
  const sizeConfig = {
    lg: { containerSize: 24, iconSize: 20, offset: -6 },
    md: { containerSize: 18, iconSize: 16, offset: -5 },
    sm: { containerSize: 16, iconSize: 12, offset: -4 },
    xl: { containerSize: 48, iconSize: 40, offset: -12 },
  };

  const { containerSize, iconSize, offset } = sizeConfig[size];

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
            className="relative cursor-pointer"
            key={starIndex}
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              height: containerSize,
              marginLeft: starIndex > 1 ? offset : 0,
              width: containerSize,
            }}
          >
            {/* Left half click area */}
            <div
              className="absolute left-0 top-0 z-[2] h-full w-1/2"
              onClick={(e) => handleRatingClick(e, leftHalfValue)}
              onMouseEnter={() => setHoveredRating(leftHalfValue)}
            />
            {/* Right half click area */}
            <div
              className="absolute right-0 top-0 z-[2] h-full w-1/2"
              onClick={(e) => handleRatingClick(e, fullValue)}
              onMouseEnter={() => setHoveredRating(fullValue)}
            />
            {/* Star visual */}
            <div className="relative h-full w-full">
              {/* Background star (empty) */}
              <Star
                className="absolute left-0.5 top-0.5"
                color="var(--color-dark-3)"
                fill="transparent"
                size={iconSize}
              />
              {/* Foreground star (filled) */}
              {fillType !== "empty" && (
                <div
                  className={`absolute left-0 top-0 h-full overflow-hidden ${fillType === "half" ? "w-1/2" : "w-full"}`}
                >
                  <Star
                    className="absolute left-0.5 top-0.5"
                    color="var(--color-orange-5)"
                    fill="var(--color-orange-5)"
                    size={iconSize}
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
