import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/smart-playlists")({
  component: SmartPlaylistsLayout,
});

function SmartPlaylistsLayout() {
  return <Outlet />;
}
