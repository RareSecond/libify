import { Button, Card, Container, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  ListMusic,
  Music2,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/welcome")({ component: WelcomePage });

interface PainPoint {
  description: string;
  gradient: string;
  icon: typeof ListMusic;
  title: string;
}

const painPoints: PainPoint[] = [
  {
    description:
      "Find your favorite tracks instantly with smart organization and search",
    gradient: "from-orange-500 to-red-500",
    icon: ListMusic,
    title: "Tired of scrolling through 5,000 liked songs?",
  },
  {
    description:
      "Create smart playlists with rules that keep your music organized for you",
    gradient: "from-orange-500 to-amber-500",
    icon: Target,
    title: "Want playlists that update automatically?",
  },
  {
    description:
      "Rate your tracks, create collections, and build your perfect library",
    gradient: "from-amber-500 to-yellow-500",
    icon: Star,
    title: "Wish you could rate and organize your music?",
  },
  {
    description:
      "Track your history, discover patterns, and explore your music journey",
    gradient: "from-orange-400 to-pink-500",
    icon: Sparkles,
    title: "Looking for deeper insights into your listening?",
  },
];

const features = [
  { icon: Zap, text: "Lightning-fast search" },
  { icon: Music2, text: "Smart playlists" },
  { icon: BarChart3, text: "Advanced analytics" },
];

function WelcomePage() {
  const handleConnectSpotify = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/spotify`;
  };

  return (
    <div className="min-h-screen bg-dark-9 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-orange-500 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-orange-600 rounded-full opacity-10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400 rounded-full opacity-5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Container className="py-20 md:py-32" size="lg">
          <Stack align="center" gap="xl">
            {/* Hero Section */}
            <div className="text-center max-w-4xl space-y-8 animate-in fade-in duration-700">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-20">
                <Sparkles className="text-orange-400" size={16} />
                <Text className="text-orange-300 text-sm font-medium">
                  Your music library, supercharged
                </Text>
              </div>

              {/* Main Headline */}
              <Title className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent animate-gradient">
                  Take Control
                </span>
                <br />
                <span className="text-dark-0">of Your Music</span>
              </Title>

              {/* Subheadline */}
              <Text className="text-dark-1 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
                Stop fighting with Spotify's limitations. Organize, search, and
                enjoy your library the way it was meant to be.
              </Text>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-6 border border-dark-4"
                    >
                      <Icon className="text-orange-400" size={18} />
                      <Text className="text-dark-1 text-sm font-medium">
                        {feature.text}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-6 py-8 animate-in fade-in duration-700 delay-200">
              <Button
                className="shadow-2xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-shadow duration-300"
                gradient={{ deg: 135, from: "orange.5", to: "orange.7" }}
                onClick={handleConnectSpotify}
                size="xl"
                style={{ fontSize: '1.125rem' }}
                variant="gradient"
              >
                <Music2 className="mr-2" size={24} />
                Connect Spotify & Get Started
              </Button>
              <div className="flex items-center justify-center gap-6 text-dark-2 text-sm">
                <span className="flex items-center gap-1">
                  ✓ Get started free
                </span>
                <span className="flex items-center gap-1">
                  ✓ Secure OAuth
                </span>
                <span className="flex items-center gap-1">✓ Easy setup</span>
              </div>
            </div>

            {/* Pain Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl pt-16">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <Card
                    key={index}
                    className="bg-dark-7 bg-opacity-50 backdrop-blur-sm border border-dark-4 hover:border-orange-500 hover:bg-dark-6 transition-all duration-300 p-8 group hover:scale-105 transform hover:shadow-2xl hover:shadow-orange-500/10"
                    shadow="sm"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <Stack gap="lg">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-4 rounded-2xl bg-gradient-to-br ${point.gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 group-hover:scale-110 transform flex items-center justify-center`}
                        >
                          <Icon
                            className="text-orange-400"
                            size={32}
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="flex-1">
                          <Text className="text-xl font-bold text-dark-0 mb-3 leading-snug">
                            {point.title}
                          </Text>
                          <Text className="text-dark-2 leading-relaxed">
                            {point.description}
                          </Text>
                        </div>
                      </div>
                    </Stack>
                  </Card>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="text-center pt-16 space-y-4 animate-in fade-in duration-700 delay-400">
              <Text className="text-dark-0 text-2xl font-bold">
                Ready to transform your music library?
              </Text>
              <Button
                className="shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-shadow duration-300"
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
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-400 {
          animation-delay: 400ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}
