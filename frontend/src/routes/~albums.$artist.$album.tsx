import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AlbumDetail } from "../components/AlbumDetail";
import { PageTitle } from "../components/PageTitle";
import { sortOrderSchema, trackSortBySchema } from "../utils/trackSortSchema";

const albumDetailSearchSchema = z.object({
  sortBy: trackSortBySchema.optional(),
  sortOrder: sortOrderSchema.optional().catch("desc"),
});

export const Route = createFileRoute("/albums/$artist/$album")({
  component: AlbumDetailPage,
  validateSearch: (search) => albumDetailSearchSchema.parse(search),
});

function AlbumDetailPage() {
  const { album, artist } = Route.useParams();

  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title={album} />
      <AlbumDetail album={album} artist={artist} />
    </div>
  );
}
