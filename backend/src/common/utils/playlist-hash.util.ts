import { createHash } from "crypto";

/**
 * Calculate a SHA256 hash of track IDs for change detection.
 * Track IDs are sorted before hashing to ensure consistent results
 * regardless of query order.
 */
export function hashTrackIds(trackIds: string[]): string {
  const sortedIds = [...trackIds].sort();
  return createHash("sha256").update(sortedIds.join("|")).digest("hex");
}
