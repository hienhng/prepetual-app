import assert from "node:assert/strict";
import test from "node:test";

import { POSITION_INDEPENDENT_EXPLANATION_RULE } from "./explanation-guidance.js";

test("requires explanations to survive option shuffling", () => {
  assert.match(POSITION_INDEPENDENT_EXPLANATION_RULE, /never identify an answer by its position/i);
  assert.match(POSITION_INDEPENDENT_EXPLANATION_RULE, /option 2/i);
  assert.match(POSITION_INDEPENDENT_EXPLANATION_RULE, /substantive text/i);
  assert.match(POSITION_INDEPENDENT_EXPLANATION_RULE, /options are shuffled/i);
});
