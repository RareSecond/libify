import { Card, Stack, Text } from "@mantine/core";
import { ListMusic, Sparkles, Star, Target } from "lucide-react";

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

export function PainPointsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-6xl pt-8 sm:pt-16 px-4">
      {painPoints.map((point, index) => {
        const Icon = point.icon;
        const animDelay = `${index * 100}ms`;

        return (
          <Card
            className="bg-dark-7 bg-opacity-50 backdrop-blur-sm border border-dark-4 hover:border-orange-500 hover:bg-dark-6 transition-all duration-300 p-4 sm:p-6 lg:p-8 group hover:scale-105 transform hover:shadow-2xl hover:shadow-orange-500/10"
            key={index}
            shadow="sm"
            /* eslint-disable-next-line react/forbid-component-props */
            style={{ animationDelay: animDelay }}
          >
            <Stack gap="lg">
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${point.gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 group-hover:scale-110 transform flex items-center justify-center flex-shrink-0`}
                >
                  <Icon
                    className="text-orange-400"
                    size={28}
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="text-lg sm:text-xl font-bold text-dark-0 mb-2 sm:mb-3 leading-snug">
                    {point.title}
                  </Text>
                  <Text className="text-dark-2 text-sm sm:text-base leading-relaxed">
                    {point.description}
                  </Text>
                </div>
              </div>
            </Stack>
          </Card>
        );
      })}
    </div>
  );
}
