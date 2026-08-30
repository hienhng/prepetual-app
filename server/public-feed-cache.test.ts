import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_FEED_CACHE_CONTROL,
  setPublicFeedCacheHeaders,
} from "./public-feed-cache.js";

test("does not cache the public feed so visibility changes appear immediately", () => {
  const headers = new Map<string, string>();

  setPublicFeedCacheHeaders({
    set(field, value) {
      headers.set(field.toLowerCase(), value);
    },
  });

  assert.equal(headers.get("cache-control"), PUBLIC_FEED_CACHE_CONTROL);
  assert.equal(PUBLIC_FEED_CACHE_CONTROL, "no-store");
});
