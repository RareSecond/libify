import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ArtistsOverview } from '../components/ArtistsOverview';
import { PageTitle } from '../components/PageTitle';

const artistsSearchSchema = z.object({
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(24),
  search: z.string().optional().default(''),
  sortBy: z.enum(['name', 'trackCount', 'albumCount', 'totalPlayCount', 'avgRating', 'lastPlayed']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const Route = createFileRoute('/artists/')({
  component: ArtistsPage,
  validateSearch: artistsSearchSchema,
});

function ArtistsPage() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Artists" />
      <ArtistsOverview />
    </div>
  );
}