/**
 * Safely encode a string for use as a URL path parameter.
 *
 * This handles edge cases where strings contain literal '%' characters
 * that aren't part of valid percent-encoding (e.g., "100%", "50% Off").
 * These would cause "malformed URI sequence" errors when TanStack Router
 * tries to decode them.
 *
 * @param value - The string to encode for URL use
 * @returns A safely encoded string
 */
export const safeEncodeParam = (value: string): string => {
  // First, try to decode - if it succeeds, the string might already be encoded
  // or it might just not contain any % characters
  try {
    const decoded = decodeURIComponent(value);
    // If decoding changed the value, it was encoded - return original
    // If decoding didn't change it, it's a plain string - also safe to use
    if (decoded !== value) {
      return value;
    }
    return value;
  } catch {
    // decodeURIComponent failed, meaning the string contains invalid
    // percent sequences (e.g., "100%" where % isn't followed by hex).
    // We need to encode these % characters properly.
    // Replace standalone % with %25 (encoded %)
    return value.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
  }
};
