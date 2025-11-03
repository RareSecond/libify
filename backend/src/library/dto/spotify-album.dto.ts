export interface SpotifyAlbumData {
  album_type: string;
  artists: Array<{
    external_urls: { spotify: string };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }>;
  available_markets: string[];
  copyrights?: Array<{
    text: string;
    type: string;
  }>;
  external_ids?: {
    ean?: string;
    isrc?: string;
    upc?: string;
  };
  external_urls: { spotify: string };
  genres?: string[];
  href: string;
  id: string;
  images: Array<{
    height: number;
    url: string;
    width: number;
  }>;
  label?: string;
  name: string;
  popularity?: number;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  tracks?: {
    href: string;
    items: SpotifyAlbumTrack[];
    limit: number;
    next: null | string;
    offset: number;
    previous: null | string;
    total: number;
  };
  type: string;
  uri: string;
}

export interface SpotifyAlbumsPaginatedResponse {
  href: string;
  items: SpotifySavedAlbum[];
  limit: number;
  next: null | string;
  offset: number;
  previous: null | string;
  total: number;
}

export interface SpotifyAlbumTrack {
  artists: Array<{
    external_urls: { spotify: string };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }>;
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: { spotify: string };
  href: string;
  id: string;
  is_local: boolean;
  linked_from?: {
    id: string;
    uri: string;
  };
  name: string;
  preview_url: null | string;
  track_number: number;
  type: string;
  uri: string;
}

export interface SpotifySavedAlbum {
  added_at: string;
  album: SpotifyAlbumData;
}
