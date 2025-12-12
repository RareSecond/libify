import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ArtistDetail } from "../components/ArtistDetail";
import { PageTitle } from "../components/PageTitle";

const artistDetailSearchSchema = z.object({
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

export const Route = createFileRoute("/artists/$artist")({
  component: ArtistDetailPage,
  validateSearch: (search) => artistDetailSearchSchema.parse(search),
});

function ArtistDetailPage() {
  const { artist } = Route.useParams();

  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title={artist} />
      <ArtistDetail artist={artist} />
    </div>
  );
}
