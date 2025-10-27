import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageTitle } from "../components/PageTitle";
import { TrackList } from "../components/TrackList";

const tracksSearchSchema = z.object({
  genres: z.array(z.string()).optional().default([]),
  page: z.number().min(1).optional().catch(1),
  pageSize: z.number().min(1).max(100).optional().catch(20),
  search: z.string().optional(),
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
    .optional()
    .catch("addedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().catch("desc"),
});

export const Route = createFileRoute("/tracks")({
  component: TracksPage,
  validateSearch: (search) => tracksSearchSchema.parse(search),
});

function TracksPage() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="My Library" />
      <TrackList />
    </div>
  );
}
