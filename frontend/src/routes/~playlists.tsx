import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/playlists")({
  component: PlaylistsLayout,
});

function PlaylistsLayout() {
  return <Outlet />;
}
