import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/albums")({
  component: AlbumsLayout,
});

function AlbumsLayout() {
  return <Outlet />;
}
