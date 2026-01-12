import { Container } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { OnboardingWelcomeModal } from "../components/OnboardingWelcomeModal";
import { PageTitle } from "../components/PageTitle";
import { SmartPlaylists } from "../components/SmartPlaylists";

const searchSchema = z.object({ welcome: z.boolean().optional() });

export const Route = createFileRoute("/smart-playlists/")({
  component: SmartPlaylistsIndexPage,
  validateSearch: searchSchema,
});

function SmartPlaylistsIndexPage() {
  const navigate = useNavigate();
  const { welcome } = Route.useSearch();

  const handleCloseWelcome = () => {
    navigate({ search: {}, to: "/smart-playlists" });
  };

  return (
    <Container className="py-8" fluid>
      <PageTitle title="Smart Playlists" />
      <SmartPlaylists />
      <OnboardingWelcomeModal
        isOpen={welcome === true}
        onClose={handleCloseWelcome}
      />
    </Container>
  );
}
