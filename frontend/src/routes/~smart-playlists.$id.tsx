import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageTitle } from "../components/PageTitle";
import { PlaylistTracks } from "../components/PlaylistTracks";
import { sortOrderSchema, trackSortBySchema } from "../utils/trackSortSchema";

const smartPlaylistSearchSchema = z.object({
  page: z.coerce.number().min(1).optional().catch(1),
  pageSize: z.coerce.number().min(1).max(100).optional().catch(20),
  sortBy: trackSortBySchema.optional(),
  sortOrder: sortOrderSchema.optional().catch("desc"),
});

export const Route = createFileRoute("/smart-playlists/$id")({
  component: SmartPlaylistTracksPage,
  validateSearch: (search) => smartPlaylistSearchSchema.parse(search),
});

function SmartPlaylistTracksPage() {
  const { id } = Route.useParams();

  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Playlist Tracks" />
      <PlaylistTracks playlistId={id} />
    </div>
  );
}
