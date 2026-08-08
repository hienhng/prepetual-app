export const PUBLIC_FEED_CACHE_CONTROL =
  "public, max-age=60, s-maxage=60, stale-while-revalidate=300";

type CacheableResponse = {
  set(field: string, value: string): unknown;
};

export function setPublicFeedCacheHeaders(res: CacheableResponse): void {
  res.set("Cache-Control", PUBLIC_FEED_CACHE_CONTROL);
}
