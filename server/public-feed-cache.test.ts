import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_FEED_CACHE_CONTROL,
  setPublicFeedCacheHeaders,
} from "./public-feed-cache.js";

test("caches the public feed in browsers and Vercel's shared edge cache", () => {
  const headers = new Map<string, string>();

  setPublicFeedCacheHeaders({
    set(field, value) {
      headers.set(field.toLowerCase(), value);
    },
  });

  assert.equal(headers.get("cache-control"), PUBLIC_FEED_CACHE_CONTROL);
  assert.match(PUBLIC_FEED_CACHE_CONTROL, /(?:^|, )max-age=60(?:,|$)/);
  assert.match(PUBLIC_FEED_CACHE_CONTROL, /(?:^|, )s-maxage=60(?:,|$)/);
  assert.match(
    PUBLIC_FEED_CACHE_CONTROL,
    /(?:^|, )stale-while-revalidate=300(?:,|$)/,
  );
});
