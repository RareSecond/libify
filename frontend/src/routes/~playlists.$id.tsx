import { createFileRoute } from "@tanstack/react-router";

import { PageTitle } from "../components/PageTitle";
import { PlaylistDetail } from "../components/PlaylistDetail";

export const Route = createFileRoute("/playlists/$id")({
  component: PlaylistDetailPage,
});

function PlaylistDetailPage() {
  const { id } = Route.useParams();

  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Playlist" />
      <PlaylistDetail playlistId={id} />
    </div>
  );
}
