/**
 * Format duration from milliseconds to human-readable string
 */
export const formatDuration = (ms: number): string => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Format duration from milliseconds to detailed human-readable string (includes seconds)
 */
export const formatDurationDetailed = (ms: number): string => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

/**
 * Format date to localized string
 */
export const formatDate = (date: null | string | undefined): string => {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString();
};

/**
 * Format time from milliseconds to mm:ss format
 */
export const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Format relative time from a Date object
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

/**
 * Format last sync time as relative time string
 */
export const formatLastSync = (lastSync: null | string): string => {
  if (!lastSync) return "Never";
  return formatRelativeTime(new Date(lastSync));
};
