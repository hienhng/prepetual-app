import assert from "node:assert/strict";
import test from "node:test";

import {
  getFailedGenerationPayloads,
  inspectAiJsonCompletion,
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

test("inspects valid AI JSON completions without exposing response content", () => {
  assert.deepEqual(
    inspectAiJsonCompletion({
      choices: [{
        finish_reason: "stop",
        message: { content: '{"explanation":"Correct"}' },
      }],
    }),
    {
      result: { explanation: "Correct" },
      retryReason: null,
      finishReason: "stop",
      contentLength: 25,
    },
  );
});

test("marks empty, truncated, and malformed completions for retry", () => {
  assert.deepEqual(
    inspectAiJsonCompletion({
      choices: [{ finish_reason: "stop", message: { content: "" } }],
    }),
    { result: null, retryReason: "empty", finishReason: "stop", contentLength: 0 },
  );
  assert.deepEqual(
    inspectAiJsonCompletion({
      choices: [{
        finish_reason: "length",
        message: { content: '{"explanation":"partial but parseable"}' },
      }],
    }),
    { result: null, retryReason: "truncated", finishReason: "length", contentLength: 39 },
  );
  assert.deepEqual(
    inspectAiJsonCompletion({
      choices: [{ finish_reason: "stop", message: { content: "not JSON" } }],
    }),
    { result: null, retryReason: "invalid_json", finishReason: "stop", contentLength: 8 },
  );
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
  const providerValidationError = {
    status: 400,
    code: "json_validate_failed",
    error: {
      message: "Failed to validate JSON. Please adjust your prompt.",
      failed_generation: "",
    },
  };
  assert.equal(isJsonResponseFormatError(providerValidationError), true);
  assert.equal(recoverFailedGenerationJson(providerValidationError), null);
  assert.equal(isJsonResponseFormatError({
    status: 400,
    message: "response_format is not supported",
  }), true);
  assert.equal(isJsonResponseFormatError({ status: 429, message: "rate limited" }), false);
});
