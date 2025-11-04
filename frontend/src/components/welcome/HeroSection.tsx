import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { Music2, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onConnectSpotify: () => void;
}

export function HeroSection({ onConnectSpotify }: HeroSectionProps) {
  return (
    <Container className="relative z-20" size="xl">
      <Stack align="center" gap="xl">
        <div className="text-center max-w-6xl space-y-6 md:space-y-12 animate-in fade-in duration-700">
          {/* Badge with glow */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 shadow-lg shadow-orange-500/20 backdrop-blur-sm">
            <Sparkles className="text-orange-400 animate-pulse" size={18} />
            <Text className="text-orange-300 text-sm font-semibold tracking-wide">
              The Smart Way to Manage Your Spotify
            </Text>
          </div>

          {/* Main Headline - Balanced Size */}
          <div className="relative py-4 md:py-8">
            <Title className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tight">
              <div className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent blur-3xl opacity-60">
                  Your Music,
                </span>
                <span className="relative bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent animate-gradient drop-shadow-2xl">
                  Your Music,
                </span>
              </div>
              <br />
              <div className="relative inline-block mt-2 md:mt-4">
                <span className="absolute inset-0 text-white blur-2xl opacity-40">
                  Supercharged
                </span>
                <span className="relative text-white drop-shadow-2xl">
                  Supercharged
                </span>
              </div>
            </Title>

            {/* Massive decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500 rounded-full opacity-20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-400 rounded-full opacity-20 blur-[100px] animate-pulse delay-1000" />
          </div>

          {/* Subheadline */}
          <Text className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-4xl mx-auto leading-relaxed font-bold px-4">
            Stop scrolling endlessly through playlists.{" "}
            <span className="text-orange-400 font-black underline decoration-orange-500/30 decoration-2 md:decoration-4 underline-offset-4 md:underline-offset-8">
              Organize, rate, and discover
            </span>{" "}
            your music like never before.
          </Text>

          {/* CTA - Moved to Hero */}
          <div className="pt-4 md:pt-8 px-4">
            <Button
              className="shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow duration-300 w-full sm:w-auto"
              gradient={{ deg: 135, from: "orange.5", to: "orange.7" }}
              onClick={onConnectSpotify}
              size="xl"
              variant="gradient"
            >
              <Music2 className="mr-2 sm:mr-3" size={24} />
              <span className="text-base sm:text-lg">
                Connect Spotify & Get Started
              </span>
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-dark-1 text-xs sm:text-sm mt-6">
              <span className="flex items-center gap-1">
                ✓ Get started free
              </span>
              <span className="flex items-center gap-1">✓ Secure OAuth</span>
              <span className="flex items-center gap-1">✓ Easy setup</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 lg:gap-12 pt-6 md:pt-12 text-center px-4">
            <div className="bg-dark-7/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl px-6 sm:px-8 py-4 sm:py-6">
              <Text className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                5,000+
              </Text>
              <Text className="text-dark-1 text-xs sm:text-sm mt-2 font-semibold">
                Tracks Organized
              </Text>
            </div>
            <div className="bg-dark-7/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl px-6 sm:px-8 py-4 sm:py-6">
              <Text className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                Instant
              </Text>
              <Text className="text-dark-1 text-xs sm:text-sm mt-2 font-semibold">
                Search Results
              </Text>
            </div>
            <div className="bg-dark-7/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl px-6 sm:px-8 py-4 sm:py-6">
              <Text className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                Smart
              </Text>
              <Text className="text-dark-1 text-xs sm:text-sm mt-2 font-semibold">
                Auto-Updating
              </Text>
            </div>
          </div>
        </div>
      </Stack>
    </Container>
  );
}
