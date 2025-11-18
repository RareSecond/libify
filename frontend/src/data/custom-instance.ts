import Axios, { AxiosError, AxiosRequestConfig } from "axios";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
}); // use your own URL here or environment variable

/**
 * Encodes path segments in a URL to handle special characters like #, &, etc.
 * Only encodes the path segments, not query parameters or the protocol/host.
 */
const encodeUrlPathSegments = (url: string): string => {
  // If it's a full URL with protocol, split it
  const protocolMatch = url.match(/^(https?:\/\/[^/]+)(\/.*)?$/);
  if (protocolMatch) {
    const [, baseUrl, path] = protocolMatch;
    if (!path) return url;
    const segments = path
      .split("/")
      .map((segment) => encodeURIComponent(segment));
    return baseUrl + segments.join("/");
  }

  // Otherwise, it's a relative path - encode each segment
  const segments = url.split("/").map((segment) => {
    // Don't encode empty segments (like the leading slash)
    if (segment === "") return segment;
    // Don't encode if it's already encoded
    if (segment === decodeURIComponent(segment)) {
      return encodeURIComponent(segment);
    }
    return segment;
  });
  return segments.join("/");
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
