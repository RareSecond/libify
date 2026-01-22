import { Grid, Paper, Skeleton, Stack } from "@mantine/core";

export function InsightsPageSkeleton() {
  return (
    <Stack gap="xl">
      {/* Sync Status Skeleton */}
      <Paper className="bg-dark-7 border border-dark-5 p-4" radius="md">
        <Skeleton height={8} radius="xl" width="100%" />
      </Paper>

      {/* Overview Cards Skeleton */}
      <Grid>
        {[1, 2, 3, 4].map((i) => (
          <Grid.Col key={i} span={{ base: 6, md: 3 }}>
            <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
              <Skeleton circle className="mb-4" height={40} width={40} />
              <Skeleton className="mb-1" height={24} width="60%" />
              <Skeleton height={14} width="40%" />
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      {/* Main Content Grid Skeleton */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
            <Skeleton className="mb-4" height={20} width="40%" />
            <Skeleton height={200} radius="md" />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
            <Skeleton className="mb-4" height={20} width="40%" />
            <Skeleton height={200} radius="md" />
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Quick Playlists Skeleton */}
      <Paper className="bg-dark-7 border border-dark-5 p-6" radius="md">
        <Skeleton className="mb-4" height={20} width="30%" />
        <Grid>
          {[1, 2, 3, 4, 5].map((i) => (
            <Grid.Col key={i} span={{ base: 6, md: 2, sm: 4 }}>
              <Skeleton height={80} radius="md" />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}
