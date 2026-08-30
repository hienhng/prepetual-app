export const PUBLIC_FEED_CACHE_CONTROL =
  "no-store";

type CacheableResponse = {
  set(field: string, value: string): unknown;
};

export function setPublicFeedCacheHeaders(res: CacheableResponse): void {
  res.set("Cache-Control", PUBLIC_FEED_CACHE_CONTROL);
}
