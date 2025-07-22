import { createFileRoute } from '@tanstack/react-router';

import { AlbumDetail } from '../components/AlbumDetail';
import { PageTitle } from '../components/PageTitle';

export const Route = createFileRoute('/albums/$artist/$album')({
  component: AlbumDetailPage,
});

function AlbumDetailPage() {
  const { album, artist } = Route.useParams();
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      <PageTitle title={album} />
      <AlbumDetail album={album} artist={artist} />
    </div>
  );
}