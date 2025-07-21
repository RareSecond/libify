import { createFileRoute } from '@tanstack/react-router';

import { PageTitle } from '../components/PageTitle';
import { TrackList } from '../components/TrackList';

export const Route = createFileRoute('/tracks')({
  component: TracksPage,
});

function TracksPage() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="My Library" />
      <TrackList />
    </div>
  );
}