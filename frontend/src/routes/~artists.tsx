import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/artists")({ component: ArtistsLayout });

function ArtistsLayout() {
  return <Outlet />;
}
