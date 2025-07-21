import { Container, Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { LibrarySync } from "@/components/LibrarySync";
import { PageTitle } from "@/components/PageTitle";
import { UserProfile } from "@/components/UserProfile";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <Container className="py-8" size="lg">
      <Stack gap="xl">
        <PageTitle title="Dashboard" />
        <Stack className="w-full max-w-2xl mx-auto" gap="lg">
          <UserProfile />
          <LibrarySync />
        </Stack>
      </Stack>
    </Container>
  );
}
