import { Button, Grid, Paper, Stack, Text, Title } from "@mantine/core";
import { Brain, Coffee, Dumbbell, Smile, Sparkles } from "lucide-react";

interface QuickPlaylistSectionProps {
  isCreating: boolean;
  onCreatePreset: (
    preset: "CHILL" | "DEEP_CUTS" | "FEEL_GOOD" | "FOCUS" | "GYM",
  ) => void;
}

export function QuickPlaylistSection({
  isCreating,
  onCreatePreset,
}: QuickPlaylistSectionProps) {
  const presets = [
    {
      color: "red",
      description: "High energy, fast tempo",
      icon: Dumbbell,
      name: "Gym Workout",
      preset: "GYM" as const,
    },
    {
      color: "blue",
      description: "Low energy, slow tempo",
      icon: Coffee,
      name: "Chill Vibes",
      preset: "CHILL" as const,
    },
    {
      color: "violet",
      description: "Instrumental, low speechiness",
      icon: Brain,
      name: "Focus Mode",
      preset: "FOCUS" as const,
    },
    {
      color: "yellow",
      description: "High valence, upbeat mood",
      icon: Smile,
      name: "Feel Good",
      preset: "FEEL_GOOD" as const,
    },
    {
      color: "grape",
      description: "Rarely played tracks",
      icon: Sparkles,
      name: "Deep Cuts",
      preset: "DEEP_CUTS" as const,
    },
  ];

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
      <Stack gap="md">
        <div>
          <Title className="text-dark-0" order={4}>
            Quick Create Playlists
          </Title>
          <Text className="text-dark-2" size="sm">
            One-click smart playlists based on your library
          </Text>
        </div>

        <Grid>
          {presets.map((preset) => (
            <Grid.Col key={preset.preset} span={{ base: 6, md: 2.4, sm: 4 }}>
              <Button
                className="h-auto py-4"
                color={preset.color}
                disabled={isCreating}
                fullWidth
                loading={isCreating}
                onClick={() => onCreatePreset(preset.preset)}
                variant="light"
              >
                <Stack align="center" gap={4}>
                  <preset.icon size={24} />
                  <Text className="font-medium" size="sm">
                    {preset.name}
                  </Text>
                  <Text className="text-dark-2" size="xs">
                    {preset.description}
                  </Text>
                </Stack>
              </Button>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
}
