import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchSupadataTranscript,
  parseSupadataTranscript,
  SupadataTranscriptError,
} from "./supadata.js";

test("parses plain-text transcript responses", () => {
  assert.deepEqual(
    parseSupadataTranscript({ content: "Hello   &amp; welcome" }),
    { text: "Hello & welcome", segmentCount: 1 },
  );
});

test("parses segmented transcript responses", () => {
  assert.deepEqual(
    parseSupadataTranscript({
      content: [{ text: "First line" }, { text: "second line" }],
    }),
    { text: "First line second line", segmentCount: 2 },
  );
});

test("requests native plain text without exposing the key in the URL", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestedKey = "";

  globalThis.fetch = async (input, init) => {
    requestedUrl = input.toString();
    requestedKey = new Headers(init?.headers).get("x-api-key") ?? "";
    return new Response(JSON.stringify({ content: "A valid transcript response" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await fetchSupadataTranscript(
      "https://www.youtube.com/watch?v=dB6pOolO7io",
      "secret-test-key",
    );
    const url = new URL(requestedUrl);

    assert.equal(url.searchParams.get("mode"), "native");
    assert.equal(url.searchParams.get("text"), "true");
    assert.equal(url.searchParams.has("apiKey"), false);
    assert.equal(requestedKey, "secret-test-key");
    assert.equal(result.text, "A valid transcript response");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves provider status codes on failures", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Free quota exhausted" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      fetchSupadataTranscript("https://youtu.be/dB6pOolO7io", "test-key"),
      (error: unknown) =>
        error instanceof SupadataTranscriptError && error.status === 429,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
