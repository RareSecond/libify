import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageTitle } from "../components/PageTitle";
import { PlaylistDetail } from "../components/PlaylistDetail";

const playlistDetailSearchSchema = z.object({
  page: z.number().min(1).optional().catch(1),
  pageSize: z.number().min(1).max(100).optional().catch(20),
  sortBy: z
    .enum([
      "title",
      "artist",
      "album",
      "addedAt",
      "lastPlayedAt",
      "totalPlayCount",
      "rating",
      "duration",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().catch("desc"),
});

export const Route = createFileRoute("/playlists/$id")({
  component: PlaylistDetailPage,
  validateSearch: (search) => playlistDetailSearchSchema.parse(search),
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
