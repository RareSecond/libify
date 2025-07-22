import { createFileRoute } from "@tanstack/react-router";

import { ArtistDetail } from "../components/ArtistDetail";
import { PageTitle } from "../components/PageTitle";

export const Route = createFileRoute("/artists/$artist")({
  component: ArtistDetailPage,
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
