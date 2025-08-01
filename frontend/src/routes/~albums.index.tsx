import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AlbumsOverview } from "../components/AlbumsOverview";
import { PageTitle } from "../components/PageTitle";

const albumsSearchSchema = z.object({
  genres: z.array(z.string()).optional().default([]),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(24),
  search: z.string().optional().default(""),
  sortBy: z
    .enum([
      "name",
      "artist",
      "trackCount",
      "totalPlayCount",
      "avgRating",
      "lastPlayed",
    ])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const Route = createFileRoute("/albums/")({
  component: AlbumsIndexPage,
  validateSearch: albumsSearchSchema,
});

function AlbumsIndexPage() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Albums" />
      <AlbumsOverview />
    </div>
  );
}
