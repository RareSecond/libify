import { ActionIcon, Group } from "@mantine/core";
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
  const [hoveredStar, setHoveredStar] = useState<null | number>(null);
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

  return (
    <Group gap={0} onMouseLeave={() => setHoveredStar(null)} wrap="nowrap">
      {[1, 2, 3, 4, 5].map((value) => (
        <ActionIcon
          disabled={isUpdating}
          key={value}
          onClick={(e) => handleRatingClick(e, value)}
          onMouseEnter={() => setHoveredStar(value)}
          size={16}
          style={{ marginLeft: value > 1 ? -4 : 0 }}
          variant="transparent"
        >
          <Star
            color={value <= (hoveredStar ?? rating ?? 0) ? "gold" : "gray"}
            fill={
              value <= (hoveredStar ?? rating ?? 0) ? "gold" : "transparent"
            }
            size={12}
          />
        </ActionIcon>
      ))}
    </Group>
  );
}
