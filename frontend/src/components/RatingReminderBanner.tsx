import { Button, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Star, X } from "lucide-react";
import { useCallback } from "react";

import { dismissRatingReminder } from "@/lib/ratingReminder";

interface RatingReminderBannerProps {
  onDismiss: () => void;
}

export function RatingReminderBanner({ onDismiss }: RatingReminderBannerProps) {
  const navigate = useNavigate();

  const handleStartRating = useCallback(() => {
    navigate({ to: "/fullscreen" });
  }, [navigate]);

  const handleDismiss = useCallback(() => {
    dismissRatingReminder();
    onDismiss();
  }, [onDismiss]);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Star className="flex-shrink-0" size={20} />
        <Text className="text-sm font-medium">
          Unlock smart playlists by rating 3 tracks
        </Text>
      </div>
      <div className="flex items-center gap-2">
        <Button
          color="white"
          onClick={handleStartRating}
          size="xs"
          variant="white"
        >
          Start Rating
        </Button>
        <Button
          className="text-white hover:text-white/80"
          onClick={handleDismiss}
          size="xs"
          variant="subtle"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}
