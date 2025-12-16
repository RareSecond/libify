import { Container } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { PageTitle } from "../components/PageTitle";
import { SmartPlaylists } from "../components/SmartPlaylists";

export const Route = createFileRoute("/smart-playlists/")({
  component: SmartPlaylistsIndexPage,
});

function SmartPlaylistsIndexPage() {
  return (
    <Container className="py-8" fluid>
      <PageTitle title="Smart Playlists" />
      <SmartPlaylists />
    </Container>
  );
}
