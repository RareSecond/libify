import { Button, Text } from "@mantine/core";
import { CheckCircle, Music, Star } from "lucide-react";

interface OnboardingRatingPromptProps {
  onSkip: () => void;
  onStartRating: () => void;
  trackCount: number;
}

export function OnboardingRatingPrompt({
  onSkip,
  onStartRating,
  trackCount,
}: OnboardingRatingPromptProps) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Success icon */}
      <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="text-green-500" size={32} />
      </div>

      {/* Success message */}
      <Text className="text-xl font-bold mb-2 text-white">
        Nice! We synced {trackCount} of your recent tracks.
      </Text>

      <Text className="text-gray-400 mb-6">
        Ready to unlock your first smart playlist?
        <br />
        Rate just 3 tracks — it takes 30 seconds.
      </Text>

      {/* Feature preview */}
      <div className="bg-dark-6 rounded-lg p-4 mb-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-900/30 rounded-lg flex items-center justify-center">
            <Star className="text-orange-500" size={20} />
          </div>
          <div className="text-left">
            <Text className="font-semibold text-sm text-white">
              Smart Playlists
            </Text>
            <Text className="text-xs text-gray-400">
              Auto-updating playlists based on your rules
            </Text>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-400 text-left">
          <Music className="flex-shrink-0 mt-0.5" size={14} />
          <span>
            "My Favorites", "Highly Rated", and more will be created for you
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button
          className="w-full"
          leftSection={<Star size={18} />}
          onClick={onStartRating}
          size="lg"
        >
          Start Rating
        </Button>
        <Button className="w-full" onClick={onSkip} size="sm" variant="subtle">
          I'll do this later
        </Button>
      </div>
    </div>
  );
}
