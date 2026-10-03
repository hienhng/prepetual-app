export const POSITION_INDEPENDENT_EXPLANATION_RULE = `LEARNER-FACING EXPLANATION WORDING:
- In explanation and wrongAnswerExplanations, never identify an answer by its position, index, or choice label (for example, "option 2", "choice B", "the second answer", or "B").
- Refer to the answer by its substantive text, or explain the underlying fact directly. The explanation must remain accurate if the options are shuffled.`;

export const QUIZ_EXPLANATION_LANGUAGE_RULE = `EXPLANATION LANGUAGE:
- Write EVERY learner-facing explanation in the instructional language of the quiz question. Use QUIZ LANGUAGE CONTEXT only to clarify short or language-neutral stems.
- The quiz language overrides the source evidence language and these English instructions. Never switch to the interface language or default to English.
- For language-learning questions, use the language of the surrounding quiz instructions, preserving quoted foreign-language examples, proper names, formulas, and code.`;

export const OPTION_EXPLANATION_SCOPE_RULE = `PER-OPTION EXPLANATIONS:
- Each option explanation must explain ONLY the option associated with its index: why that exact statement or answer is correct or incorrect under the question stem.
- Do not discuss, compare with, list, or explain any other option, including other correct options or omitted choices. Keep any whole-submission summary separate from per-option explanations.`;
