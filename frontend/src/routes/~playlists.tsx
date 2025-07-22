import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PageTitle } from "../components/PageTitle";
import { SmartPlaylists } from "../components/SmartPlaylists";

export const Route = createFileRoute("/playlists")({
  component: PlaylistsLayout,
});

function PlaylistsLayout() {
  return <Outlet />;
}

export const PlaylistsPage = () => {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Smart Playlists" />
      <SmartPlaylists />
    </div>
  );
};
