interface PlayContext {
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist";
  search?: string;
}

export function useSpotifyAPI() {
  const getAccessToken = async (): Promise<string> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/token`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.accessToken;
  };

  const fetchAllTracksForContext = async (
    currentContext: null | PlayContext,
    currentTrackList: string[],
  ): Promise<string[]> => {
    if (!currentContext || !currentContext.contextType) {
      return currentTrackList;
    }

    try {
      let allTracks: string[] = [];
      const baseUrl = `${import.meta.env.VITE_API_URL}/library`;

      switch (currentContext.contextType) {
        case "album": {
          if (currentContext.contextId) {
            const [artist, album] = currentContext.contextId.split("|");
            if (!artist || !album) {
              return currentTrackList;
            }

            const url = `${baseUrl}/albums/${encodeURIComponent(artist)}/${encodeURIComponent(album)}/tracks`;
            const response = await fetch(url, { credentials: "include" });

            if (!response.ok) {
              return currentTrackList;
            }

            const data = await response.json();
            allTracks = Array.isArray(data)
              ? data
                  .filter((track: { spotifyId?: string }) => track.spotifyId)
                  .map(
                    (track: { spotifyId: string }) =>
                      `spotify:track:${track.spotifyId}`,
                  )
              : [];
          }
          break;
        }

        case "artist": {
          if (currentContext.contextId) {
            const url = `${baseUrl}/artists/${encodeURIComponent(currentContext.contextId)}/tracks`;
            const response = await fetch(url, { credentials: "include" });

            if (!response.ok) {
              return currentTrackList;
            }

            const data = await response.json();
            allTracks = Array.isArray(data)
              ? data
                  .filter((track: { spotifyId?: string }) => track.spotifyId)
                  .map(
                    (track: { spotifyId: string }) =>
                      `spotify:track:${track.spotifyId}`,
                  )
              : [];
          }
          break;
        }

        case "library": {
          const searchParams = new URLSearchParams({
            page: "1",
            pageSize: "1000",
            sortBy: "addedAt",
            sortOrder: "desc",
          });

          if (currentContext.search) {
            searchParams.append("search", currentContext.search);
          }

          const response = await fetch(
            `${baseUrl}/tracks?${searchParams.toString()}`,
            { credentials: "include" },
          );

          if (!response.ok) {
            return currentTrackList;
          }

          const data = await response.json();
          allTracks = data.tracks
            .filter((track: { spotifyId?: string }) => track.spotifyId)
            .map(
              (track: { spotifyId: string }) =>
                `spotify:track:${track.spotifyId}`,
            );
          break;
        }
      }

      return allTracks.length > 0 ? allTracks : currentTrackList;
    } catch {
      return currentTrackList;
    }
  };

  return { fetchAllTracksForContext, getAccessToken };
}
