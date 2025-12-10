import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageTitle } from "../components/PageTitle";
import { PlaylistsOverview } from "../components/PlaylistsOverview";

const playlistsSearchSchema = z.object({
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(24),
  search: z.string().optional().default(""),
  sortBy: z
    .enum(["name", "trackCount", "totalPlayCount", "avgRating", "lastPlayed"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const Route = createFileRoute("/playlists/")({
  component: PlaylistsIndexPage,
  validateSearch: playlistsSearchSchema,
});

function PlaylistsIndexPage() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Playlists" />
      <PlaylistsOverview />
    </div>
  );
}
