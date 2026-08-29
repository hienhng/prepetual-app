import assert from "node:assert/strict";
import test from "node:test";

import { KATEX_FORMATTING_RULES, getKatexFormattingIssue } from "./math-format.js";

test("keeps LaTeX backslashes intact in the runtime prompt", () => {
  assert.match(KATEX_FORMATTING_RULES, /\\sqrt\{x\}/u);
  assert.match(KATEX_FORMATTING_RULES, /\\frac\{m\}\{V\}/u);
  assert.match(KATEX_FORMATTING_RULES, /\$\\\\frac\{1\}\{2\}\$/u);
});

test("accepts properly delimited KaTeX in generated quiz text", () => {
  assert.equal(getKatexFormattingIssue(String.raw`What is $\rho = \frac{m}{V}$?`), null);
  assert.equal(
    getKatexFormattingIssue(String.raw`Water has $c = 4200\,\mathrm{J/(kg\cdot K)}$.`),
    null,
  );
});

test("rejects raw Unicode and formulas outside delimiters", () => {
  assert.match(getKatexFormattingIssue("Use Q=mcΔT to calculate the energy.") ?? "", /Unicode|formula/u);
  assert.match(getKatexFormattingIssue("Find x^2 when x = 4.") ?? "", /bare|formula/u);
  assert.match(getKatexFormattingIssue("A 50 kg object moves at 2 m/s.") ?? "", /unit|formula/u);
});

test("rejects lost and JSON-corrupted LaTeX backslashes", () => {
  assert.match(getKatexFormattingIssue("Compute $sqrt{x}$.") ?? "", /backslash/u);
  assert.match(getKatexFormattingIssue("Compute $\u000crac{1}{2}$.") ?? "", /control character/u);
});

test("does not flag ordinary non-mathematical prose", () => {
  assert.equal(getKatexFormattingIssue("Which process transfers thermal energy through a fluid?"), null);
  assert.equal(getKatexFormattingIssue("Compare the input/output behavior of the system."), null);
});
