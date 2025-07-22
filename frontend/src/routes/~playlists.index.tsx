import { createFileRoute } from '@tanstack/react-router';

import { PageTitle } from '../components/PageTitle';
import { SmartPlaylists } from '../components/SmartPlaylists';

export const Route = createFileRoute('/playlists/')({
  component: PlaylistsIndexPage,
});

function PlaylistsIndexPage() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title="Smart Playlists" />
      <SmartPlaylists />
    </div>
  );
}