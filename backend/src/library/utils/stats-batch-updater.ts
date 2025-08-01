export class StatsBatchUpdater {
  private albumsToUpdate = new Set<string>();
  private artistsToUpdate = new Set<string>();
  private tracksToUpdate = new Set<string>();

  addAlbum(albumId: string): void {
    this.albumsToUpdate.add(albumId);
  }

  addArtist(artistId: string): void {
    this.artistsToUpdate.add(artistId);
  }

  addTrack(trackId: string): void {
    this.tracksToUpdate.add(trackId);
  }

  clear(): void {
    this.tracksToUpdate.clear();
    this.albumsToUpdate.clear();
    this.artistsToUpdate.clear();
  }

  getUpdateSummary(): {
    albumIds: string[];
    artistIds: string[];
    totalUpdates: number;
    trackIds: string[];
  } {
    return {
      albumIds: Array.from(this.albumsToUpdate),
      artistIds: Array.from(this.artistsToUpdate),
      totalUpdates:
        this.tracksToUpdate.size +
        this.albumsToUpdate.size +
        this.artistsToUpdate.size,
      trackIds: Array.from(this.tracksToUpdate),
    };
  }
}
