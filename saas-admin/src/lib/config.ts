const DEFAULT_API_BASE_URL = "http://localhost:5019";

const normalizeBaseUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_API_BASE_URL;

  // Remove trailing slashes
  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (!withoutTrailingSlash) return DEFAULT_API_BASE_URL;

  // If the URL ends with /api (case-insensitive), strip it because we append routes ourselves.
  const withoutApiSuffix = withoutTrailingSlash.replace(/\/api$/i, "");
  return withoutApiSuffix || DEFAULT_API_BASE_URL;
};

export const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw) return DEFAULT_API_BASE_URL;
  return normalizeBaseUrl(raw);
};

export { DEFAULT_API_BASE_URL };

