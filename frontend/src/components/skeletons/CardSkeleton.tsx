import { Card, Group, Skeleton, Stack } from "@mantine/core";

export function CardSkeleton() {
  return (
    <Card
      className="h-full p-4 bg-gradient-to-br from-dark-7 to-dark-8 border-dark-5 animate-pulse"
      radius="md"
      shadow="md"
      withBorder
    >
      <Card.Section className="mb-4">
        <Skeleton className="h-[200px] w-full" radius={0} />
      </Card.Section>

      <Stack gap="sm">
        <div>
          <Skeleton className="h-5 w-3/4 mb-2" radius="sm" />
          <Skeleton className="h-4 w-1/2" radius="sm" />
        </div>

        <Group gap="md">
          <Skeleton className="h-4 w-12" radius="sm" />
          <Skeleton className="h-4 w-12" radius="sm" />
          <Skeleton className="h-4 w-16 ml-auto" radius="sm" />
        </Group>

        <Skeleton className="h-3 w-full" radius="sm" />
      </Stack>
    </Card>
  );
}

export function CardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </>
  );
}
