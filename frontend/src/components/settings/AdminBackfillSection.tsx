import {
  Alert,
  Button,
  Card,
  Group,
  Progress,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  Database,
  type LucideIcon,
  Music,
  RefreshCw,
  Shield,
} from "lucide-react";

import {
  type BackfillStatus,
  useAllBackfills,
  useAudioFeaturesBackfill,
  useBackfillStatus,
  useGenreBackfill,
} from "@/hooks/useAdminBackfill";

export function AdminBackfillSection() {
  const { data: status, error, isLoading, refetch } = useBackfillStatus();
  const audioFeaturesMutation = useAudioFeaturesBackfill();
  const genreMutation = useGenreBackfill();
  const allBackfillsMutation = useAllBackfills();

  const isAnyMutationLoading =
    audioFeaturesMutation.isPending ||
    genreMutation.isPending ||
    allBackfillsMutation.isPending;

  // If there's a 403 error, user is not an admin - don't show the section
  if (error && isAxiosError(error) && error.response?.status === 403) {
    return null;
  }

  // Show error state for non-403 errors
  if (error) {
    return (
      <Card
        className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
        padding="lg"
        radius="md"
        shadow="md"
        withBorder
      >
        <Stack gap="md">
          <Group gap="xs">
            <Shield className="text-orange-5" size={20} />
            <Text className="text-dark-0 font-semibold" size="lg">
              Admin: Data Backfill
            </Text>
          </Group>
          <Alert color="red" icon={<AlertTriangle size={18} />} variant="light">
            <Text size="sm">
              Failed to load backfill status. Please try again.
            </Text>
          </Alert>
          <Button
            color="orange"
            leftSection={<RefreshCw size={14} />}
            onClick={() => refetch()}
            variant="light"
          >
            Retry
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      className="bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5"
      padding="lg"
      radius="md"
      shadow="md"
      withBorder
    >
      <Stack gap="md">
        <Group gap="xs" justify="space-between">
          <Group gap="xs">
            <Shield className="text-orange-5" size={20} />
            <Text className="text-dark-0 font-semibold" size="lg">
              Admin: Data Backfill
            </Text>
          </Group>
          <Button
            color="gray"
            leftSection={<RefreshCw size={14} />}
            onClick={() => refetch()}
            size="xs"
            variant="subtle"
          >
            Refresh
          </Button>
        </Group>

        <Text className="text-dark-2" size="sm">
          Backfill audio features and genres for existing tracks. These
          operations run in the background and may take a while for large
          libraries.
        </Text>

        <Stack gap="sm">
          <ProgressCard
            icon={Music}
            isLoading={isLoading}
            status={status?.audioFeatures}
            title="Audio Features (tempo, energy, etc.)"
          />
          <ProgressCard
            icon={Database}
            isLoading={isLoading}
            status={status?.genres}
            title="Genres (from Last.fm)"
          />
        </Stack>

        <Alert color="orange" variant="light">
          <Text size="xs">
            <strong>Note:</strong> Genre backfill is rate-limited to 5
            requests/second. Audio features use the ReccoBeats API in batches of
            40 tracks.
          </Text>
        </Alert>

        <Group gap="sm">
          <Button
            color="orange"
            disabled={status?.audioFeatures.pending === 0}
            leftSection={<Music size={16} />}
            loading={audioFeaturesMutation.isPending}
            onClick={() => audioFeaturesMutation.mutate()}
            variant="light"
          >
            Backfill Audio Features
          </Button>
          <Button
            color="orange"
            disabled={status?.genres.pending === 0}
            leftSection={<Database size={16} />}
            loading={genreMutation.isPending}
            onClick={() => genreMutation.mutate()}
            variant="light"
          >
            Backfill Genres
          </Button>
        </Group>

        <Button
          color="orange"
          disabled={
            isAnyMutationLoading ||
            (status?.audioFeatures.pending === 0 &&
              status?.genres.pending === 0)
          }
          fullWidth
          loading={allBackfillsMutation.isPending}
          onClick={() => allBackfillsMutation.mutate()}
        >
          Backfill All
        </Button>
      </Stack>
    </Card>
  );
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    error instanceof AxiosError || (error as AxiosError)?.isAxiosError === true
  );
}

function ProgressCard({
  icon: Icon,
  isLoading,
  status,
  title,
}: {
  icon: LucideIcon;
  isLoading: boolean;
  status?: BackfillStatus;
  title: string;
}) {
  if (isLoading) return <Skeleton height={80} radius="md" />;
  if (!status) return null;

  const isComplete = status.pending === 0;
  const colorClass = isComplete ? "text-green-5" : "text-orange-5";

  return (
    <div className="bg-dark-6 rounded-md p-3">
      <Group className="mb-1" gap="xs">
        <Icon className={colorClass} size={16} />
        <Text className="text-dark-1 font-medium" size="sm">
          {title}
        </Text>
      </Group>
      <Progress
        className="mb-1"
        color={isComplete ? "green" : "orange"}
        size="sm"
        value={status.percentComplete}
      />
      <Group gap="xs" justify="space-between">
        <Text className="text-dark-3" size="xs">
          {status.completed.toLocaleString()} / {status.total.toLocaleString()}{" "}
          tracks
        </Text>
        <Text className={`${colorClass} font-medium`} size="xs">
          {isComplete
            ? "Complete"
            : `${status.pending.toLocaleString()} pending`}
        </Text>
      </Group>
    </div>
  );
}
