import { Button, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  ListMusic,
  PartyPopper,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";

import { SEED_PLAYLISTS } from "@/constants/seedPlaylists";

interface OnboardingWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLAYLIST_ICONS: Record<string, typeof Star> = {
  "Highly Rated": Star,
  "My Favorites": Sparkles,
  "Recently Added": RefreshCw,
};

export function OnboardingWelcomeModal({
  isOpen,
  onClose,
}: OnboardingWelcomeModalProps) {
  return (
    <Modal
      centered
      onClose={onClose}
      opened={isOpen}
      size="lg"
      withCloseButton={false}
    >
      <Stack align="center" className="py-4" gap="lg">
        {/* Celebration header */}
        <div className="p-4 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10">
          <PartyPopper className="text-orange-5" size={48} />
        </div>

        <div className="text-center">
          <Text className="text-2xl font-bold text-white mb-2">
            You're all set!
          </Text>
          <Text className="text-dark-1 max-w-md">
            Based on your ratings, we've created{" "}
            <span className="text-orange-5 font-medium">
              {SEED_PLAYLISTS.length} smart playlists
            </span>{" "}
            to help you organize your music.
          </Text>
        </div>

        {/* Playlist cards */}
        <Stack className="w-full" gap="sm">
          {SEED_PLAYLISTS.map((playlist) => {
            const Icon = PLAYLIST_ICONS[playlist.name] || ListMusic;
            return (
              <div
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-6 border border-dark-5"
                key={playlist.name}
              >
                <ThemeIcon
                  className="bg-orange-500/10"
                  color="orange"
                  radius="md"
                  size="lg"
                  variant="light"
                >
                  <Icon size={18} />
                </ThemeIcon>
                <div className="flex-1 min-w-0">
                  <Text className="font-medium text-white">
                    {playlist.name}
                  </Text>
                  <Text className="text-sm text-dark-2 truncate">
                    {playlist.description}
                  </Text>
                </div>
              </div>
            );
          })}
        </Stack>

        {/* Explanation */}
        <div className="bg-dark-7 rounded-lg p-4 w-full">
          <div className="flex items-start gap-3">
            <RefreshCw
              className="text-orange-5 mt-0.5 flex-shrink-0"
              size={18}
            />
            <Text className="text-sm text-dark-1">
              <span className="font-medium text-white">Smart playlists</span>{" "}
              automatically update as you rate more tracks. The more you rate,
              the better your playlists become.
            </Text>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="bg-gradient-to-r from-orange-6 to-orange-7 hover:from-orange-5 hover:to-orange-6 border-none shadow-lg shadow-orange-9/30"
          fullWidth
          onClick={onClose}
          size="lg"
        >
          Explore Your Playlists
        </Button>
      </Stack>
    </Modal>
  );
}
