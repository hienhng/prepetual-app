import assert from "node:assert/strict";
import test from "node:test";
import { normalizeVisionTextResponse } from "./vision-text.js";

test("provider thinking never becomes PDF evidence and source equations remain exact", () => {
  const answer = "Câu 17. COP = Q_1/A; Q_2 = Q_1 + A.\nĐường kính d = 1,2 mm.";
  assert.equal(normalizeVisionTextResponse(`<think>Guess COP = Q_2/A, maybe diameter 12 mm.</think>\n${answer}`), answer);
  assert.equal(normalizeVisionTextResponse(`<think>Incomplete provider analysis`), "");
  assert.equal(normalizeVisionTextResponse(`\`\`\`text\n${answer}\n\`\`\``), answer);
});
