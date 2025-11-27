import { Button, Container, Stack, Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Disc3,
  Heart,
  Music,
  Music2,
  PlayCircle,
  Star,
  Zap,
} from "lucide-react";

import { DashboardMockup } from "@/components/welcome/DashboardMockup";
import { FloatingAlbums } from "@/components/welcome/FloatingAlbums";
import { HeroSection } from "@/components/welcome/HeroSection";
import { PainPointsGrid } from "@/components/welcome/PainPointsGrid";
import { trackSignupStarted } from "@/lib/posthog";

export const Route = createFileRoute("/welcome")({ component: WelcomePage });

const features = [
  { icon: Zap, text: "Lightning-fast search" },
  { icon: Music2, text: "Smart playlists" },
  { icon: BarChart3, text: "Advanced analytics" },
];

function WelcomePage() {
  const handleConnectSpotify = () => {
    trackSignupStarted();
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/spotify`;
  };

  return (
    <div className="min-h-screen bg-dark-9 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-orange-500 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-orange-600 rounded-full opacity-10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400 rounded-full opacity-5 blur-3xl" />

        {/* Floating Music Icons */}
        <div className="absolute top-20 left-[10%] text-orange-500 opacity-20 animate-float">
          <Music size={40} />
        </div>
        <div className="absolute top-40 right-[15%] text-orange-400 opacity-20 animate-float-delayed">
          <Disc3 size={50} />
        </div>
        <div className="absolute bottom-32 left-[20%] text-orange-300 opacity-20 animate-float">
          <Heart size={35} />
        </div>
        <div className="absolute top-[60%] right-[10%] text-orange-500 opacity-20 animate-float-delayed">
          <PlayCircle size={45} />
        </div>
        <div className="absolute bottom-[20%] right-[25%] text-orange-400 opacity-20 animate-float">
          <Star size={30} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section - Full Width with Distinct Background */}
        <div className="relative min-h-[600px] md:min-h-screen flex items-center justify-center overflow-hidden py-16 md:py-0">
          {/* Hero specific background - much brighter */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-dark-8 to-dark-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
          </div>

          {/* Massive Decorative Grid Pattern */}
          <div className="absolute inset-0 opacity-10 grid-pattern" />

          {/* Floating Album Cover Representations */}
          <FloatingAlbums />

          <HeroSection onConnectSpotify={handleConnectSpotify} />

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
            <div className="flex flex-col items-center gap-2 text-orange-400 opacity-60">
              <Text className="text-xs font-semibold">Scroll to explore</Text>
              <div className="w-6 h-10 border-2 border-orange-400 rounded-full flex items-start justify-center pt-2">
                <div className="w-1 h-2 bg-orange-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the page */}
        <Container className="py-20" size="lg">
          <Stack align="center" gap="xl">
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 pb-12">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    className="group flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-dark-6 to-dark-7 border border-dark-4 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/10"
                    key={idx}
                  >
                    <div className="p-1.5 bg-orange-500/10 rounded-full group-hover:bg-orange-500/20 transition-colors">
                      <Icon
                        className="text-orange-400 group-hover:text-orange-300 transition-colors"
                        size={20}
                      />
                    </div>
                    <Text className="text-dark-1 font-semibold group-hover:text-dark-0 transition-colors">
                      {feature.text}
                    </Text>
                  </div>
                );
              })}
            </div>

            {/* Pain Points Grid */}
            <PainPointsGrid />

            {/* Dashboard Preview Mockup */}
            <DashboardMockup />

            {/* Bottom CTA */}
            <div className="text-center pt-8 sm:pt-16 space-y-4 animate-in fade-in duration-700 delay-400 px-4">
              <Text className="text-dark-0 text-xl sm:text-2xl font-bold">
                Ready to transform your music library?
              </Text>
              <Button
                className="shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-shadow duration-300 w-full sm:w-auto"
                gradient={{ deg: 135, from: "orange.5", to: "orange.7" }}
                onClick={handleConnectSpotify}
                size="lg"
                variant="gradient"
              >
                Get Started Now
              </Button>
            </div>
          </Stack>
        </Container>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 3s;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-400 {
          animation-delay: 400ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
        .grid-pattern {
          background-image: linear-gradient(rgba(253, 126, 20, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(253, 126, 20, 0.3) 1px, transparent 1px);
          background-size: 80px 80px;
        }
      `}</style>
    </div>
  );
}
