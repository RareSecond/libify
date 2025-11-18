import Axios, { AxiosError, AxiosRequestConfig } from "axios";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
}); // use your own URL here or environment variable

/**
 * Encodes path segments in a URL to handle special characters like #, &, etc.
 * Only encodes the path segments, not query parameters or the protocol/host.
 * Normalizes already-encoded segments to avoid double-encoding.
 * Note: Does NOT treat # as a fragment delimiter since path parameters may contain #
 */
const encodeUrlPathSegments = (url: string): string => {
  // Split into protocol/host (if present), path, and query string
  const protocolMatch = url.match(/^(https?:\/\/[^/?]+)/);
  const prefix = protocolMatch ? protocolMatch[1] : "";
  const urlWithoutProtocol = protocolMatch ? url.slice(prefix.length) : url;

  // Split path from query string (only split on ?)
  const queryIndex = urlWithoutProtocol.indexOf("?");
  const pathPart =
    queryIndex === -1
      ? urlWithoutProtocol
      : urlWithoutProtocol.slice(0, queryIndex);
  const querySuffix =
    queryIndex === -1 ? "" : urlWithoutProtocol.slice(queryIndex);

  // If no path, return as-is
  if (!pathPart) return url;

  // Split path into segments, decode then re-encode each to normalize
  const segments = pathPart.split("/").map((segment) => {
    // Preserve empty segments (like leading/trailing slashes)
    if (segment === "") return segment;
    // Decode first (handles already-encoded segments), then re-encode
    try {
      return encodeURIComponent(decodeURIComponent(segment));
    } catch {
      // If decoding fails, encode as-is
      return encodeURIComponent(segment);
    }
  });

  return prefix + segments.join("/") + querySuffix;
};

// add a second `options` argument here if you want to pass extra options to each generated query
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source();

  // Encode path segments in the URL to handle special characters
  const encodedConfig = {
    ...config,
    url: config.url ? encodeUrlPathSegments(config.url) : config.url,
  };

  const promise = AXIOS_INSTANCE({
    ...encodedConfig,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error - this is a workaround to allow the promise to be cancelled
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export type BodyType<BodyData> = BodyData;

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this
export type ErrorType<Error> = AxiosError<Error>;
