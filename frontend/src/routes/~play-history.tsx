import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageTitle } from "../components/PageTitle";
import { PlayHistoryTable } from "../components/PlayHistoryTable";

const playHistorySearchSchema = z.object({
  page: z.number().min(1).optional().catch(1),
  pageSize: z.number().min(1).max(100).optional().catch(50),
  search: z.string().optional(),
  trackId: z.string().optional(),
});

export const Route = createFileRoute("/play-history")({
  component: PlayHistoryPage,
  validateSearch: (search) => playHistorySearchSchema.parse(search),
});

function PlayHistoryPage() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Play History" />
      <PlayHistoryTable />
    </div>
  );
}
