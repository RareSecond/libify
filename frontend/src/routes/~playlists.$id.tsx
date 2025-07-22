import { createFileRoute } from "@tanstack/react-router";

import { PageTitle } from "../components/PageTitle";
import { PlaylistTracks } from "../components/PlaylistTracks";

export const Route = createFileRoute("/playlists/$id")({
  component: PlaylistTracksPage,
});

function PlaylistTracksPage() {
  const { id } = Route.useParams();

  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Playlist Tracks" />
      <PlaylistTracks playlistId={id} />
    </div>
  );
}
