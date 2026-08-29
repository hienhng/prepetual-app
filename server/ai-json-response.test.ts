import assert from "node:assert/strict";
import test from "node:test";

import {
  getFailedGenerationPayloads,
  isJsonResponseFormatError,
  parseAiJsonObject,
  recoverFailedGenerationJson,
} from "./ai-json-response.js";

test("parses fenced and prose-wrapped AI JSON objects", () => {
  assert.deepEqual(
    parseAiJsonObject("```json\n{\"explanation\":\"Correct\"}\n```"),
    { explanation: "Correct" },
  );
  assert.deepEqual(
    parseAiJsonObject("Here is the result: {\"explanation\":\"Correct\"}"),
    { explanation: "Correct" },
  );
});

test("rejects empty responses and non-object JSON", () => {
  assert.throws(() => parseAiJsonObject(""), /empty/);
  assert.throws(() => parseAiJsonObject("[1, 2]"), /object/);
});

test("recovers JSON from nested provider failed_generation fields", () => {
  const error = {
    error: {
      failed_generation: "```json\n{\"explanation\":\"Recovered\"}\n```",
    },
  };

  assert.deepEqual(getFailedGenerationPayloads(error), [
    "```json\n{\"explanation\":\"Recovered\"}\n```",
  ]);
  assert.deepEqual(recoverFailedGenerationJson(error), { explanation: "Recovered" });
});

test("recognizes provider JSON validation failures that need a plain-mode retry", () => {
  assert.equal(isJsonResponseFormatError({
    status: 400,
    code: "json_validate_failed",
    error: { message: "Failed to validate JSON" },
  }), true);
  assert.equal(isJsonResponseFormatError({
    status: 400,
    message: "response_format is not supported",
  }), true);
  assert.equal(isJsonResponseFormatError({ status: 429, message: "rate limited" }), false);
});
