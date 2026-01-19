import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { z } from "zod";

import { PageTitle } from "../components/PageTitle";
import { RatingReminderBanner } from "../components/RatingReminderBanner";
import { TrackList } from "../components/TrackList";
import { isRatingReminderDismissed } from "../lib/ratingReminder";
import { sortOrderSchema, trackSortBySchema } from "../utils/trackSortSchema";

const tracksSearchSchema = z.object({
  genres: z.array(z.string()).optional().default([]),
  page: z.coerce.number().min(1).optional().catch(1),
  pageSize: z.coerce.number().min(1).max(100).optional().catch(20),
  search: z.string().optional(),
  showRatingReminder: z.boolean().optional(),
  sortBy: trackSortBySchema.optional().catch("addedAt"),
  sortOrder: sortOrderSchema.optional().catch("desc"),
});

export const Route = createFileRoute("/tracks")({
  component: TracksPage,
  validateSearch: (search) => tracksSearchSchema.parse(search),
});

function TracksPage() {
  const { showRatingReminder } = useSearch({ from: "/tracks" });
  const [isDismissed, setIsDismissed] = useState(isRatingReminderDismissed());

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const shouldShowBanner = showRatingReminder && !isDismissed;

  return (
    <div>
      {shouldShowBanner && <RatingReminderBanner onDismiss={handleDismiss} />}
      <div className="max-w-7xl mx-auto p-2 md:p-4">
        <PageTitle title="My Library" />
        <TrackList />
      </div>
    </div>
  );
}
