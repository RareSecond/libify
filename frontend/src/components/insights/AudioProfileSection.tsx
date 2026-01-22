import {
  Grid,
  Group,
  Paper,
  RingProgress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Activity, Smile, Timer } from "lucide-react";

interface AudioProfile {
  averageEnergy: number;
  averageTempo: number;
  averageValence: number;
  energyDistribution: { high: number; low: number; medium: number };
  tempoDistribution: { fast: number; medium: number; slow: number };
  valenceDistribution: { high: number; low: number; medium: number };
}

interface AudioProfileSectionProps {
  audioProfile: AudioProfile;
}

export function AudioProfileSection({
  audioProfile,
}: AudioProfileSectionProps) {
  const {
    averageEnergy,
    averageTempo,
    averageValence,
    energyDistribution,
    tempoDistribution,
    valenceDistribution,
  } = audioProfile;

  const energyTotal =
    energyDistribution.low +
    energyDistribution.medium +
    energyDistribution.high;
  const valenceTotal =
    valenceDistribution.low +
    valenceDistribution.medium +
    valenceDistribution.high;
  const tempoTotal =
    tempoDistribution.slow + tempoDistribution.medium + tempoDistribution.fast;

  const getEnergyLabel = (energy: number) => {
    if (energy < 0.33) return "Chill";
    if (energy < 0.66) return "Moderate";
    return "High Energy";
  };

  const getValenceLabel = (valence: number) => {
    if (valence < 0.33) return "Melancholic";
    if (valence < 0.66) return "Neutral";
    return "Upbeat";
  };

  const getTempoLabel = (tempo: number) => {
    if (tempo < 100) return "Slow";
    if (tempo < 130) return "Medium";
    return "Fast";
  };

  if (energyTotal === 0) {
    return (
      <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
        <Title className="text-dark-0 mb-4" order={4}>
          Audio Profile
        </Title>
        <Text className="text-dark-2" size="sm">
          No audio features data available yet. Audio feature enrichment happens
          in the background.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
      <Title className="text-dark-0 mb-4" order={4}>
        Audio Profile
      </Title>

      <Grid>
        {/* Energy */}
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack align="center" gap="xs">
            <RingProgress
              label={
                <Group gap={4} justify="center">
                  <Activity className="text-orange-5" size={20} />
                </Group>
              }
              roundCaps
              sections={[
                {
                  color: "blue",
                  tooltip: `Low: ${energyDistribution.low}`,
                  value:
                    energyTotal > 0
                      ? (energyDistribution.low / energyTotal) * 100
                      : 0,
                },
                {
                  color: "yellow",
                  tooltip: `Medium: ${energyDistribution.medium}`,
                  value:
                    energyTotal > 0
                      ? (energyDistribution.medium / energyTotal) * 100
                      : 0,
                },
                {
                  color: "orange",
                  tooltip: `High: ${energyDistribution.high}`,
                  value:
                    energyTotal > 0
                      ? (energyDistribution.high / energyTotal) * 100
                      : 0,
                },
              ]}
              size={120}
              thickness={12}
            />
            <Text className="font-medium" size="sm">
              Energy
            </Text>
            <Text className="text-dark-2" size="xs">
              Avg: {Math.round(averageEnergy * 100)}% (
              {getEnergyLabel(averageEnergy)})
            </Text>
          </Stack>
        </Grid.Col>

        {/* Valence (Mood) */}
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack align="center" gap="xs">
            <RingProgress
              label={
                <Group gap={4} justify="center">
                  <Smile className="text-green-5" size={20} />
                </Group>
              }
              roundCaps
              sections={[
                {
                  color: "grape",
                  tooltip: `Sad: ${valenceDistribution.low}`,
                  value:
                    valenceTotal > 0
                      ? (valenceDistribution.low / valenceTotal) * 100
                      : 0,
                },
                {
                  color: "teal",
                  tooltip: `Neutral: ${valenceDistribution.medium}`,
                  value:
                    valenceTotal > 0
                      ? (valenceDistribution.medium / valenceTotal) * 100
                      : 0,
                },
                {
                  color: "green",
                  tooltip: `Happy: ${valenceDistribution.high}`,
                  value:
                    valenceTotal > 0
                      ? (valenceDistribution.high / valenceTotal) * 100
                      : 0,
                },
              ]}
              size={120}
              thickness={12}
            />
            <Text className="font-medium" size="sm">
              Mood
            </Text>
            <Text className="text-dark-2" size="xs">
              Avg: {Math.round(averageValence * 100)}% (
              {getValenceLabel(averageValence)})
            </Text>
          </Stack>
        </Grid.Col>

        {/* Tempo */}
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack align="center" gap="xs">
            <RingProgress
              label={
                <Group gap={4} justify="center">
                  <Timer className="text-violet-5" size={20} />
                </Group>
              }
              roundCaps
              sections={[
                {
                  color: "cyan",
                  tooltip: `Slow: ${tempoDistribution.slow}`,
                  value:
                    tempoTotal > 0
                      ? (tempoDistribution.slow / tempoTotal) * 100
                      : 0,
                },
                {
                  color: "indigo",
                  tooltip: `Medium: ${tempoDistribution.medium}`,
                  value:
                    tempoTotal > 0
                      ? (tempoDistribution.medium / tempoTotal) * 100
                      : 0,
                },
                {
                  color: "violet",
                  tooltip: `Fast: ${tempoDistribution.fast}`,
                  value:
                    tempoTotal > 0
                      ? (tempoDistribution.fast / tempoTotal) * 100
                      : 0,
                },
              ]}
              size={120}
              thickness={12}
            />
            <Text className="font-medium" size="sm">
              Tempo
            </Text>
            <Text className="text-dark-2" size="xs">
              Avg: {Math.round(averageTempo)} BPM ({getTempoLabel(averageTempo)}
              )
            </Text>
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
