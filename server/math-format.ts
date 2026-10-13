import katex from "katex";

export const KATEX_FORMATTING_RULES = String.raw`MATHEMATICAL CONTENT AND KATEX (MANDATORY):
- Wrap every mathematical expression, formula, equation, variable used mathematically, and unit expression in $...$ for inline math or $$...$$ for display math.
- Use KaTeX commands rather than Unicode lookalikes: $x^2$, $x_i$, $\sqrt{x}$, $\pi$, $\pm$, $\infty$, $\Delta T$, and $\rho = \frac{m}{V}$.
- Format units inside math with \mathrm and explicit spacing, for example $c = 4200\,\mathrm{J/(kg\cdot K)}$.
- Never emit bare LaTeX commands, bare ^ or _, raw Unicode superscripts/subscripts, or raw symbols such as √, ×, ÷, ±, ≈, ≤, ≥, ∞, Δ, or ρ outside math delimiters.
- Keep ordinary prose outside math delimiters. Do not wrap an entire sentence in $...$.
- In the raw JSON response, escape every LaTeX backslash as a JSON backslash. For example, emit "$\\frac{1}{2}$" in JSON so the parsed text becomes "$\frac{1}{2}$".
- Ensure every delimiter is balanced and every expression is valid KaTeX.`;

const UNICODE_MATH_OUTSIDE_DELIMITERS = /[¹²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉√∑∫≈≠≤≥±∞×÷·°∆Δπρ]/u;
const BARE_LATEX_COMMAND = /\\(?:frac|dfrac|tfrac|sqrt|pi|rho|Delta|theta|lambda|mu|sigma|sum|prod|int|cdot|times|div|pm|approx|neq|leq|geq|infty|mathrm|text|left|right)\b/u;
const BROKEN_COMMAND_INSIDE_MATH = /(?:^|[^\\A-Za-z])(?:sqrt|[dt]?frac|mathrm|cdot|infty|Delta|rho)\s*(?:\{|\b)/u;
const BARE_FORMULA = /(?:\b[A-Za-z]\w*\s*=\s*[^,.;!?]+)|(?:\b(?:\d+(?:\.\d+)?|[A-Za-z])\s*[-+*/]\s*(?:\d+(?:\.\d+)?|[A-Za-z])\b)|(?:\b[A-Za-z]\w*\s*\^\s*[-+]?\d+)/u;
const BARE_NUMBER_WITH_UNIT = /\b\d+(?:[.,]\d+)?\s*(?:kg|cm|mm|km|mol|Hz|Pa|J|N|W|V|A|K|g|m|s|L)(?:\b|(?=\/))/u;
const BARE_COMPOUND_UNIT = /\b(?:kg|cm|mm|km|mol|Hz|Pa|J|N|W|V|A|K|g|m|s|L)\s*\/\s*\(?(?:kg|cm|mm|km|mol|Hz|Pa|J|N|W|V|A|K|g|m|s|L)\b/u;

function stripDelimitedMath(value: string): { outside: string; math: string[]; balanced: boolean } {
  const math: string[] = [];
  let outside = "";
  let index = 0;

  while (index < value.length) {
    if (value.startsWith("$$", index)) {
      const end = value.indexOf("$$", index + 2);
      if (end < 0) return { outside: value, math, balanced: false };
      math.push(value.slice(index + 2, end));
      outside += " ";
      index = end + 2;
      continue;
    }
    if (value[index] === "$" && value[index - 1] !== "\\") {
      const end = value.indexOf("$", index + 1);
      if (end < 0) return { outside: value, math, balanced: false };
      math.push(value.slice(index + 1, end));
      outside += " ";
      index = end + 1;
      continue;
    }
    outside += value[index];
    index += 1;
  }

  return { outside, math, balanced: true };
}

/** Returns why generated text would render poorly instead of guessing a repair. */
export function getKatexFormattingIssue(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(value)) {
    return "contains a control character produced by an unescaped JSON/LaTeX backslash";
  }

  const parsed = stripDelimitedMath(value);
  if (!parsed.balanced) return "contains unbalanced dollar math delimiters";
  if (UNICODE_MATH_OUTSIDE_DELIMITERS.test(parsed.outside)) {
    return "contains a Unicode math symbol outside delimiters";
  }
  if (BARE_LATEX_COMMAND.test(parsed.outside)) return "contains a bare LaTeX command";
  if (/[\^_]/u.test(parsed.outside)) return "contains a bare superscript or subscript marker";
  if (BARE_FORMULA.test(parsed.outside)) return "contains a formula outside math delimiters";
  if (BARE_NUMBER_WITH_UNIT.test(parsed.outside) || BARE_COMPOUND_UNIT.test(parsed.outside)) {
    return "contains a unit expression outside math delimiters";
  }
  if (parsed.math.some((expression) => BROKEN_COMMAND_INSIDE_MATH.test(expression))) {
    return "contains a LaTeX command whose backslash was lost";
  }

  for (const expression of parsed.math) {
    try {
      katex.renderToString(expression, { throwOnError: true, strict: "ignore" });
    } catch {
      return "contains an expression that cannot render in KaTeX";
    }
  }

  return null;
}
