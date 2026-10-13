import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "../shared/schema.js";
import { createSubmittedAnswerExplainer } from "./submitted-answer-feedback.js";
import { UnverifiedAnswerError } from "./verified-feedback.js";

const question: Question = { id: "q1", type: "multiple_choice", question: "Which number is even?",
  options: ["2", "3"], correctAnswer: "2" };

test("selection energy regression: reviewer findings repair explanations before caching", async t => {
  const warnings: any[] = [];
  t.mock.method(console, "warn", (...args: any[]) => warnings.push(args));
  const energy: Question = { id: "energy", type: "selection", question: "Select ALL the examples that store energy:",
    options: ["A wooden table", "A battery", "Food", "A stretched rubber band"],
    correctAnswer: '["A battery","Food","A stretched rubber band"]' };
  const rejected = { verified: true, explanation: "The intended stores are chemical and elastic stores.",
    wrongExplanation: "A wooden table contains no stored energy.", optionExplanations: {
      "0": "A wooden table contains no stored energy.", "1": "A battery stores chemical energy.",
      "2": "Food stores chemical energy.", "3": "Stretching a rubber band stores elastic potential energy." } };
  const corrected = { ...rejected, wrongExplanation: "The exercise asks for its intended examples of usable energy stores.",
    optionExplanations: { ...rejected.optionExplanations,
      "0": "An ordinary table is not presented as an energy-storage device in this elementary exercise; this does not mean its wood has no chemical or internal energy." } };
  const prompts: string[] = [];
  const evidence = { sourceText: "An elementary lesson uses batteries and food as chemical stores, and stretched rubber bands as elastic stores.",
    quizLanguageContext: "Energy concepts", images: ["source-image"] };
  const explain = createSubmittedAnswerExplainer(async (prompt, images) => {
    prompts.push(prompt);
    assert.deepEqual(images, ["source-image"]);
    if (prompts.length === 1) return rejected;
    if (prompts.length === 2) {
      assert.match(prompt, /Assess the saved answer and explanation quality SEPARATELY/);
      return { answerCorrect: true, feedbackConsistent: false, reason: "The table explanation makes an overbroad no-energy claim.",
        feedbackIssues: [{ field: "optionExplanations.A wooden table", reason: "Qualify the statement to the classroom exercise; wood has chemical and internal energy." }] };
    }
    if (prompts.length === 3) {
      assert.match(prompt, /REVIEW CORRECTION REQUIREMENT/);
      assert.match(prompt, /overbroad no-energy claim/);
      assert.match(prompt, /"isCorrect":false/);
      assert.match(prompt, /"optionExplanationIndexes":\[0,1,2,3\]/);
      assert.match(prompt, /SOURCE EVIDENCE:\nAn elementary lesson/);
      return { ...corrected, correctAnswer: '["A wooden table"]' };
    }
    assert.match(prompt, /^Review these explanations/);
    assert.match(prompt, /does not mean its wood has no chemical or internal energy/);
    assert.doesNotMatch(prompt, /A wooden table contains no stored energy/);
    return { answerCorrect: true, feedbackConsistent: true, reason: "", feedbackIssues: [] };
  });
  const [a, b] = await Promise.all([explain(energy, '["A wooden table"]', evidence), explain(energy, '["A wooden table"]', evidence)]);
  assert.equal(a.question.correctAnswer, energy.correctAnswer);
  assert.equal(a.optionExplanations?.["A wooden table"], corrected.optionExplanations["0"]);
  assert.deepEqual(a.wrongAnswerExplanations, { "A wooden table": corrected.optionExplanations["0"] });
  assert.notEqual(a, b);
  a.explanation = "Caller mutation";
  assert.equal((await explain(energy, '["A wooden table"]', evidence)).explanation, corrected.explanation);
  assert.equal(prompts.length, 4);
  assert.equal(warnings[0][1].answerCorrect, true);
  assert.match(warnings[0][1].reason, /overbroad/);
});

test("an explicitly rejected saved answer stops without explanation regeneration", async t => {
  t.mock.method(console, "warn", () => {});
  let calls = 0;
  const explain = createSubmittedAnswerExplainer(async prompt => {
    calls++;
    return prompt.startsWith("Explain this submitted") ? { verified: true, explanation: "Three is even.", wrongExplanation: "",
      optionExplanations: { "1": "Three is even." } } : { answerCorrect: false, feedbackConsistent: false,
      reason: "The saved key says three is even, but three is odd.", feedbackIssues: [] };
  });
  const wrongKey = { ...question, correctAnswer: "3" };
  await assert.rejects(explain(wrongKey, "3"), UnverifiedAnswerError);
  await assert.rejects(explain(wrongKey, "3"), UnverifiedAnswerError);
  assert.equal(calls, 4);
  assert.equal(wrongKey.correctAnswer, "3");
});

test("malformed review verdicts retry the review and never imply a wrong saved answer", async t => {
  t.mock.method(console, "warn", () => {});
  for (const recover of [true, false]) {
    let calls = 0;
    const explain = createSubmittedAnswerExplainer(async prompt => {
      calls++;
      if (prompt.startsWith("Explain this submitted")) return { verified: true, explanation: "Two is even.", wrongExplanation: "",
        optionExplanations: { "0": "Two is divisible by two." } };
      if (prompt.includes("REVIEW RETRY REQUIREMENT") && recover) return { answerCorrect: true, feedbackConsistent: true };
      return { answerCorrect: "true", feedbackConsistent: "false" };
    });
    if (recover) {
      assert.equal((await explain(question, "2")).question.correctAnswer, "2");
      await explain(question, "2");
      assert.equal(calls, 3);
    } else {
      for (let attempt = 0; attempt < 2; attempt++) await assert.rejects(explain(question, "2"), (error: unknown) =>
        error instanceof Error && !(error instanceof UnverifiedAnswerError) && /invalid verdict after retry/.test(error.message));
      assert.equal(calls, 6);
    }
  }
});

test("review corrections cannot get another output retry or bypass output validation", async t => {
  t.mock.method(console, "warn", () => {});
  const candidate = { verified: true, explanation: "Two is even.", wrongExplanation: "", optionExplanations: { "0": "Two is even." } };
  let calls = 0;
  const explain = createSubmittedAnswerExplainer(async () => {
    calls++;
    if (calls === 1 || calls === 4) return { ...candidate, optionExplanations: {} };
    if (calls === 2) return candidate;
    return { answerCorrect: true, feedbackConsistent: false, reason: "Use precise wording.", feedbackIssues: [] };
  });
  await assert.rejects(explain(question, "2"), /invalid individual option feedback after retry/);
  assert.equal(calls, 4);
});

test("repairs Unicode math in every feedback field before reviewing and caching", async t => {
  t.mock.method(console, "warn", () => {});
  const repaired = {
    verified: true, explanation: String.raw`An even number has remainder $0$; $2 = 2 \times 1$.`,
    wrongExplanation: String.raw`The submitted number has remainder $1 \ne 0$.`,
    wrongOptionExplanations: { "1": String.raw`Its remainder is $1 \ne 0$.` },
    optionExplanations: { "0": String.raw`Its remainder is $0$.`, "1": String.raw`Its remainder is $1 \ne 0$.` },
  };
  for (const field of ["explanation", "wrongExplanation", "optionExplanations"] as const) {
    await t.test(field, async () => {
      const invalid = structuredClone(repaired);
      if (field === "optionExplanations") invalid[field]["1"] = "Its remainder is 1 ≠ 0.";
      else invalid[field] = "The calculation uses 2 × 1.";
      const prompts: string[] = [];
      const item = { ...question, imageUrl: "question-image" };
      const evidence = { sourceText: "Even numbers are divisible by two.", images: ["source-image"], quizLanguageContext: "Arithmetic quiz" };
      const explain = createSubmittedAnswerExplainer(async (prompt, images) => {
        prompts.push(prompt);
        assert.deepEqual(images, ["question-image", "source-image"]);
        if (prompts.length === 1) return invalid;
        if (prompts.length === 2) {
          assert.match(prompt, /RETRY REQUIREMENT:.*invalid mathematical formatting/);
          assert.match(prompt, new RegExp(`${field}.*Unicode math symbol`));
          assert.match(prompt, /"correctAnswer":"2"/);
          assert.match(prompt, /"isCorrect":false/);
          assert.match(prompt, /QUIZ LANGUAGE CONTEXT:\nArithmetic quiz/);
          assert.match(prompt, /SOURCE EVIDENCE:\nEven numbers/);
          return repaired;
        }
        assert.match(prompt, /^Review these explanations/);
        assert.doesNotMatch(prompt.split("EXPLANATIONS:\n")[1], /≠|×/);
        return { answerCorrect: true, feedbackConsistent: true };
      });
      const [a, b] = await Promise.all([explain(item, "3", evidence), explain(item, "3", evidence)]);
      assert.equal(a.explanation, repaired.explanation);
      assert.equal(a.wrongExplanation, repaired.wrongExplanation);
      assert.equal(a.optionExplanations?.["3"], repaired.optionExplanations["1"]);
      assert.equal(a.question.correctAnswer, "2");
      assert.notEqual(a, b);
      a.explanation = "Changed by caller";
      assert.equal((await explain(item, "3", evidence)).explanation, repaired.explanation);
      assert.equal(prompts.length, 3);
    });
  }
});

test("persistent formatting failures have one retry, no review, and no cache", async t => {
  t.mock.method(console, "warn", () => {});
  for (const firstIsEmpty of [false, true]) {
    let calls = 0;
    const explain = createSubmittedAnswerExplainer(async prompt => {
      calls++;
      assert.match(prompt, /^Explain this submitted/);
      return firstIsEmpty && calls % 2 === 1 ? {} : { verified: true, explanation: "Use 2 × 1.",
        wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Two is even." } };
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(explain(question, "2"), (error: unknown) => error instanceof Error &&
        !(error instanceof UnverifiedAnswerError) && /invalid.*formatting after retry/.test(error.message));
    }
    assert.equal(calls, 4);
    assert.equal(question.explanation, undefined);
  }
});

test("formatting retries retain verification and independent factual review", async t => {
  t.mock.method(console, "warn", () => {});
  for (const rejectedAt of ["generation", "review"]) {
    let calls = 0;
    const explain = createSubmittedAnswerExplainer(async prompt => {
      calls++;
      if (!prompt.includes("RETRY REQUIREMENT") && prompt.startsWith("Explain this submitted")) {
        return { verified: true, explanation: "Use 2 × 1." };
      }
      if (prompt.includes("RETRY REQUIREMENT")) return rejectedAt === "generation" ? { verified: false }
        : { verified: true, explanation: String.raw`Use $2 \times 1$.`, wrongExplanation: "", wrongOptionExplanations: {},
          optionExplanations: { "0": "Two is even." } };
      return { answerCorrect: false, feedbackConsistent: false, reason: "The saved key is factually incorrect." };
    });
    await assert.rejects(explain(question, "2"), UnverifiedAnswerError);
    await assert.rejects(explain(question, "2"), UnverifiedAnswerError);
    assert.equal(calls, rejectedAt === "generation" ? 4 : 6);
    assert.equal(question.correctAnswer, "2");
  }
});

test("generates explanations only on submission and retains the generated key", async () => {
  const prompts: string[] = [];
  const explain = createSubmittedAnswerExplainer(async prompt => {
    prompts.push(prompt);
    return prompt.startsWith("Explain this submitted")
      ? { verified: true, correctAnswer: "3", explanation: "Two is divisible by two.", wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Two is divisible by two." } }
      : { answerCorrect: true, feedbackConsistent: true };
  });
  assert.equal(prompts.length, 0);
  const [a, b] = await Promise.all([explain(question, "2"), explain({ ...question, id: "q2" }, "2")]);
  assert.equal(a.question.correctAnswer, "2");
  assert.equal(b.question.id, "q2");
  assert.match(prompts[0], /"correctAnswer":"2"/);
  assert.match(prompts[0], /"isCorrect":true/);
  assert.equal(prompts.length, 2);
  a.explanation = "Mutation";
  assert.equal((await explain(question, "2")).explanation, "Two is divisible by two.");
  assert.equal(question.explanation, undefined);
});

test("wrong submissions explain only submitted mistakes and omissions", async () => {
  const selection: Question = { ...question, type: "selection", options: ["2", "3", "5", "4"], correctAnswer: '["2","3","5"]' };
  const explain = createSubmittedAnswerExplainer(async prompt => {
    if (prompt.startsWith("Explain this submitted")) {
      assert.match(prompt, /"wrongOptionIndexes":\[3\]/);
      assert.match(prompt, /"isCorrect":false/);
      assert.match(prompt, /"optionExplanationIndexes":\[0,1,2,3\]/);
      assert.match(prompt, /explain ONLY the option associated with its index/);
      return { verified: true, explanation: "Two, three, and five are prime.", wrongExplanation: "Include three and five, and omit four.", wrongOptionExplanations: { "3": "Four is composite." },
        optionExplanations: { "0": "Two is prime.", "1": "Three is prime.", "2": "Five is prime.", "3": "Four is composite." } };
    }
    return { answerCorrect: true, feedbackConsistent: true };
  });
  const result = await explain(selection, '["2","4"]');
  assert.deepEqual(result.wrongAnswerExplanations, { "4": "Four is composite." });
  assert.equal(result.question.correctAnswer, selection.correctAnswer);
  assert.deepEqual(result.optionExplanations, { "2": "Two is prime.", "3": "Three is prime.", "5": "Five is prime.", "4": "Four is composite." });
});

test("selection feedback covers correct options without explaining unselected distractors", async () => {
  const selection: Question = { ...question, type: "selection", options: ["2", "3", "4", "5"], correctAnswer: '["2","3"]' };
  const explain = createSubmittedAnswerExplainer(async prompt => {
    if (prompt.startsWith("Explain this submitted")) {
      assert.match(prompt, /"optionExplanationIndexes":\[0,1\]/);
      return { verified: true, explanation: "Two and three are prime.", wrongExplanation: "", wrongOptionExplanations: {},
        optionExplanations: { "0": "Two is prime.", "1": "Three is prime." } };
    }
    assert.match(prompt, /Reject any per-option explanation that discusses another option/);
    return { answerCorrect: true, feedbackConsistent: true };
  });
  const result = await explain(selection, '["2","3"]');
  assert.deepEqual(result.optionExplanations, { "2": "Two is prime.", "3": "Three is prime." });
});

test("invalid option feedback retries once and fails as a generation error without caching", async t => {
  t.mock.method(console, "warn", () => {});
  const selection: Question = { ...question, type: "selection", options: ["2", "3", "4", "5"], correctAnswer: '["2","3"]' };
  for (const optionExplanations of [undefined, [], {}, { "0": "Two is prime." },
    { "0": "Two is prime.", "1": "Three is prime.", "3": "Five is prime." },
    { "0": "Two is prime.", "1": "Three is prime.", "2": "" },
    { "0": "Two is prime.", "1": "Three is prime.", "2": 42 },
    { "00": "Two is prime.", "1": "Three is prime.", "2": "Four is composite." }]) {
    let calls = 0;
    const explain = createSubmittedAnswerExplainer(async prompt => {
      calls++;
      assert.match(prompt, /^Explain this submitted/);
      return { verified: true, explanation: "Two and three are prime.", wrongExplanation: "Four is composite.", optionExplanations };
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(explain(selection, '["2","4"]'), (error: unknown) => error instanceof Error &&
        !(error instanceof UnverifiedAnswerError) && /invalid individual option feedback after retry/.test(error.message));
    }
    assert.equal(calls, 4);
  }
});

test("wrong-answer feedback comes from one reviewed option entry regardless of duplicate wording", async () => {
  for (const type of ["multiple_choice", "selection", "true_false"] as const) {
    const item: Question = type === "true_false" ? { ...question, type, options: undefined, correctAnswer: "True" }
      : type === "selection" ? { ...question, type, options: ["2", "4", "3"], correctAnswer: '["2","4"]' } : question;
    const selectedAnswer = type === "true_false" ? "False" : type === "selection" ? '["2","3"]' : "3";
    const wrongOption = type === "true_false" ? "False" : "3";
    const index = type === "selection" ? "2" : "1";
    for (const legacyDuplicate of [undefined, { [index]: "Different wording from a redundant field." }]) {
      let calls = 0;
      const explain = createSubmittedAnswerExplainer(async prompt => {
        calls++;
        if (prompt.startsWith("Explain this submitted")) {
          assert.match(prompt, /Generate each option explanation once, only in optionExplanations/);
          return { verified: true, explanation: "Two is even.", wrongExplanation: "The submission includes an incorrect choice.",
            wrongOptionExplanations: legacyDuplicate,
            optionExplanations: { "0": "Two is divisible by two.", ...(type === "selection" ? { "1": "Four is divisible by two." } : {}),
              [index]: "The selected choice is incorrect because two is even." } };
        }
        assert.doesNotMatch(prompt, /Different wording from a redundant field/);
        assert.match(prompt, /The selected choice is incorrect because two is even/);
        return { answerCorrect: true, feedbackConsistent: true };
      });
      const result = await explain(item, selectedAnswer);
      assert.equal(result.wrongAnswerExplanations[wrongOption], result.optionExplanations?.[wrongOption]);
      assert.deepEqual(Object.keys(result.wrongAnswerExplanations), [wrongOption]);
      assert.equal(result.question.correctAnswer, item.correctAnswer);
      await explain(item, selectedAnswer);
      assert.equal(calls, 2);
    }
  }
});

test("repairs option indexes and missing entries before factual review", async t => {
  t.mock.method(console, "warn", () => {});
  let calls = 0;
  const explain = createSubmittedAnswerExplainer(async prompt => {
    calls++;
    if (calls === 1) return { verified: true, explanation: "Two is even.", wrongExplanation: "Three is odd.",
      optionExplanations: { "1": "Two is even.", "2": "Three is odd." } };
    if (calls === 2) {
      assert.match(prompt, /RETRY REQUIREMENT:.*invalid individual option feedback/);
      assert.match(prompt, /unexpected index 2/);
      assert.match(prompt, /"optionExplanationIndexes":\[0,1\]/);
      assert.match(prompt, /"correctAnswer":"2"/);
      return { verified: true, explanation: "Two is even.", wrongExplanation: "Three is odd.",
        optionExplanations: { "0": "Two is even.", "1": "Three is odd." } };
    }
    assert.match(prompt, /^Review these explanations/);
    return { answerCorrect: true, feedbackConsistent: true };
  });
  const result = await explain(question, "3");
  assert.equal(result.wrongAnswerExplanations["3"], "Three is odd.");
  assert.equal(result.optionExplanations?.["2"], "Two is even.");
  assert.equal(calls, 3);
});

test("derived wrong-option feedback must pass factual review and failed reviews are not cached", async t => {
  t.mock.method(console, "warn", () => {});
  let calls = 0;
  const explain = createSubmittedAnswerExplainer(async prompt => {
    calls++;
    if (prompt.startsWith("Explain this submitted")) return { verified: true, explanation: "Two is even.", wrongExplanation: "Three is odd.",
      optionExplanations: { "0": "Two is even.", "1": "Three is even." } };
    assert.match(prompt, /"wrongAnswerExplanations":\{"3":"Three is even\."\}/);
    return { answerCorrect: true, feedbackConsistent: false, reason: "The explanation incorrectly says three is even." };
  });
  await assert.rejects(explain(question, "3"), /failed feedback review after retry/);
  await assert.rejects(explain(question, "3"), /failed feedback review after retry/);
  assert.equal(calls, 8);
});

test("quiz language overrides foreign-language sources in generation and review", async () => {
  const prompts: string[] = [];
  const explain = createSubmittedAnswerExplainer(async prompt => {
    prompts.push(prompt);
    assert.match(prompt, /quiz language overrides the source evidence language/i);
    assert.match(prompt, /QUIZ LANGUAGE CONTEXT:\nÔn tập số học/);
    return prompt.startsWith("Explain this submitted")
      ? { verified: true, explanation: "Hai chia hết cho hai.", wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Hai chia hết cho hai." } }
      : { answerCorrect: true, feedbackConsistent: true };
  });
  const vietnamese = { ...question, question: "Số nào là số chẵn?" };
  const evidence = { sourceText: "An even number is divisible by two.", quizLanguageContext: "Ôn tập số học" };
  assert.equal((await explain(vietnamese, "2", evidence)).explanation, "Hai chia hết cho hai.");
  assert.equal(prompts.length, 2);
});

test("review rejects wrong-language or cross-option feedback and does not cache it", async t => {
  t.mock.method(console, "warn", () => {});
  let calls = 0;
  const explain = createSubmittedAnswerExplainer(async prompt => {
    calls++;
    return prompt.startsWith("Explain this submitted")
      ? { verified: true, explanation: "English explanation for a Vietnamese quiz.", wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Two is even." } }
      : { answerCorrect: true, feedbackConsistent: false, reason: "The explanation uses the wrong instructional language." };
  });
  const vietnamese = { ...question, question: "Số nào là số chẵn?" };
  await assert.rejects(explain(vietnamese, "2"), /failed feedback review after retry/);
  await assert.rejects(explain(vietnamese, "2"), /failed feedback review after retry/);
  assert.equal(calls, 8);
});

test("short-answer explanations retain the immediate exact-match result", async () => {
  const explain = createSubmittedAnswerExplainer(async prompt => {
    if (prompt.startsWith("Explain this submitted")) {
      assert.match(prompt, /"isCorrect":false/);
      return { verified: true, explanation: "The saved answer is Paris.", wrongExplanation: "Your answer differs from Paris.", wrongOptionExplanations: {} };
    }
    return { answerCorrect: true, feedbackConsistent: true };
  });
  const result = await explain({ ...question, type: "short_answer", options: undefined, correctAnswer: "Paris" }, "London");
  assert.equal(result.question.correctAnswer, "Paris");
  assert.match(result.wrongExplanation, /differs/);
});

test("review rejects selection feedback that discusses another option", async t => {
  t.mock.method(console, "warn", () => {});
  const selection: Question = { ...question, type: "selection", options: ["2", "3", "4"], correctAnswer: '["2","3"]' };
  const explain = createSubmittedAnswerExplainer(async prompt => {
    if (prompt.startsWith("Explain this submitted")) return { verified: true, explanation: "Two and three are prime.",
      wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Two and three are prime, unlike four.", "1": "Three is prime." } };
    assert.match(prompt, /Check every entry individually/);
    assert.match(prompt, /Two and three are prime, unlike four/);
    return { answerCorrect: true, feedbackConsistent: false, reason: "The option explanation discusses another option." };
  });
  await assert.rejects(explain(selection, '["2","3"]'), /failed feedback review after retry/);
});

test("empty truth-statement selections require no option explanations", async () => {
  const selection: Question = { ...question, type: "selection", selectionMode: "truth_statements",
    question: "Which statements are true?", options: ["Two is odd.", "Three is even."], correctAnswer: "[]" };
  const explain = createSubmittedAnswerExplainer(async prompt => prompt.startsWith("Explain this submitted")
    ? { verified: true, explanation: "None of these statements is true.", wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: {} }
    : { answerCorrect: true, feedbackConsistent: true });
  assert.deepEqual((await explain(selection, "[]")).optionExplanations, {});
});

test("contradictory explanations fail without rewriting the key or caching failures", async t => {
  t.mock.method(console, "warn", () => {});
  let calls = 0;
  const explain = createSubmittedAnswerExplainer(async () => { calls++; return { verified: false }; });
  await assert.rejects(explain(question, "2"), UnverifiedAnswerError);
  await assert.rejects(explain(question, "2"), UnverifiedAnswerError);
  assert.equal(calls, 2);
  assert.equal(question.correctAnswer, "2");
});

test("missing, empty, and non-string explanations retry once and are reviewed before caching", async t => {
  t.mock.method(console, "warn", () => {});
  for (const explanation of [undefined, null, "", "   ", 42]) {
    const prompts: string[] = [];
    const explain = createSubmittedAnswerExplainer(async (prompt, images) => {
      prompts.push(prompt);
      assert.deepEqual(images, ["question-image", "source-image"]);
      if (prompts.length === 1) return { verified: true, explanation, wrongOptionExplanations: {} };
      if (prompts.length === 2) {
        assert.match(prompt, /RETRY REQUIREMENT/);
        assert.match(prompt, /"correctAnswer":"2"/);
        assert.match(prompt, /SOURCE EVIDENCE:\nEven numbers are divisible by two/);
        return { verified: true, explanation: "Two is divisible by two.", wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Two is divisible by two." } };
      }
      assert.match(prompt, /^Review these explanations/);
      return { answerCorrect: true, feedbackConsistent: true };
    });
    const item = { ...question, imageUrl: "question-image" };
    const evidence = { sourceText: "Even numbers are divisible by two", images: ["source-image"] };
    const result = await explain(item, "2", evidence);
    assert.equal(result.explanation, "Two is divisible by two.");
    assert.equal(result.question.correctAnswer, "2");
    await explain(item, "2", evidence);
    assert.equal(prompts.length, 3);
  }
});

test("persistent empty explanations are generation failures with bounded retries and no cache", async t => {
  t.mock.method(console, "warn", () => {});
  let calls = 0;
  const explain = createSubmittedAnswerExplainer(async prompt => {
    calls++;
    assert.match(prompt, /^Explain this submitted/);
    return {};
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await assert.rejects(explain(question, "2"), (error: unknown) =>
      error instanceof Error && !(error instanceof UnverifiedAnswerError) && /missing or empty.*after retry/.test(error.message));
  }
  assert.equal(calls, 4);
  assert.equal(question.correctAnswer, "2");
});

test("a retry cannot bypass rejection of the saved answer or the explanation review", async t => {
  t.mock.method(console, "warn", () => {});
  for (const rejectedAt of ["generation", "review"]) {
    let calls = 0;
    const explain = createSubmittedAnswerExplainer(async () => {
      calls++;
      if (calls === 1) return { verified: true, explanation: "" };
      if (calls === 2) return rejectedAt === "generation" ? { verified: false }
        : { verified: true, explanation: "Two is divisible by two.", wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Two is divisible by two." } };
      return { answerCorrect: false, feedbackConsistent: false, reason: "The saved key contradicts the evidence." };
    });
    await assert.rejects(explain(question, "2"), UnverifiedAnswerError);
    assert.equal(calls, rejectedAt === "generation" ? 2 : 3);
    assert.equal(question.correctAnswer, "2");
  }
});

test("multiple choice and true/false generate separate feedback for correct and submitted wrong options", async t => {
  for (const type of ["multiple_choice", "true_false"] as const) {
    await t.test(type, async () => {
      const item: Question = type === "multiple_choice" ? { ...question, options: ["2", "3", "5"] }
        : { ...question, type, question: "Two is even.", options: undefined, correctAnswer: "True" };
      const options = type === "true_false" ? ["True", "False"] : item.options!;
      for (const selectedIndex of [0, 1]) {
        const correctText = "Two is divisible by two.";
        const wrongText = type === "true_false" ? "Denying the statement is incorrect because two is divisible by two." : "Three leaves a remainder when divided by two.";
        const explain = createSubmittedAnswerExplainer(async prompt => {
          if (prompt.startsWith("Explain this submitted")) {
            assert.match(prompt, /For selection, multiple_choice, and true_false questions/);
            assert.match(prompt, /explain ONLY the option associated with its index/);
            assert.match(prompt, selectedIndex === 0 ? /"optionExplanationIndexes":\[0\]/ : /"optionExplanationIndexes":\[0,1\]/);
            return { verified: true, explanation: "Whole-answer summary.", wrongExplanation: selectedIndex === 1 ? "Whole-submission summary." : "",
              wrongOptionExplanations: selectedIndex === 1 ? { "1": wrongText } : {},
              optionExplanations: selectedIndex === 1 ? { "0": correctText, "1": wrongText } : { "0": correctText } };
          }
          assert.match(prompt, /Reject any per-option explanation that discusses another option/);
          return { answerCorrect: true, feedbackConsistent: true };
        });
        const result = await explain(item, options[selectedIndex]);
        assert.equal(result.optionExplanations?.[options[0]], correctText);
        assert.equal(result.optionExplanations?.[options[1]], selectedIndex === 1 ? wrongText : undefined);
        if (type === "multiple_choice") assert.equal(result.optionExplanations?.["5"], undefined);
        assert.equal(result.question.correctAnswer, item.correctAnswer);
      }
    });
  }
});

test("multiple choice and true/false reject missing per-option feedback and cross-option reviews", async t => {
  t.mock.method(console, "warn", () => {});
  for (const type of ["multiple_choice", "true_false"] as const) {
    const item: Question = type === "multiple_choice" ? question
      : { ...question, type, question: "Two is even.", options: undefined, correctAnswer: "True" };
    let reviewed = false;
    const explain = createSubmittedAnswerExplainer(async prompt => {
      if (prompt.startsWith("Explain this submitted")) return { verified: true, explanation: "Two is even, unlike three.",
        wrongExplanation: "", wrongOptionExplanations: {}, optionExplanations: { "0": "Two is even, unlike the other option." } };
      reviewed = true;
      return { answerCorrect: true, feedbackConsistent: false, reason: "The option explanation compares other options." };
    });
    await assert.rejects(explain(item, item.correctAnswer), /failed feedback review after retry/);
    assert.equal(reviewed, true);
    const incomplete = createSubmittedAnswerExplainer(async () => ({ verified: true, explanation: "Two is even.", wrongExplanation: "", wrongOptionExplanations: {} }));
    await assert.rejects(incomplete(item, item.correctAnswer), /invalid individual option feedback after retry/);
  }
});

test("an unexplained rejection retries once while distinguishing a saved False key from a wrong submission", async t => {
  t.mock.method(console, "warn", () => {});
  let reviews = 0;
  const item: Question = { id: "false-key", type: "true_false", question: "Two is odd.", correctAnswer: "False" };
  const explain = createSubmittedAnswerExplainer(async prompt => {
    if (prompt.startsWith("Explain this submitted")) return { verified: true, explanation: "Two is even, so the statement is false.",
      wrongExplanation: "Two is even.", optionExplanations: { "0": "The statement is false because two is even.", "1": "Two is even." } };
    reviews++;
    assert.match(prompt, /a false statement correctly keyed "False" requires answerCorrect:true/);
    assert.match(prompt, /Decimal commas inside dollar delimiters are valid KaTeX/);
    if (reviews === 1) return { answerCorrect: false, feedbackConsistent: true, reason: "" };
    assert.match(prompt, /rejected without explaining the substantive failure/);
    return { answerCorrect: true, feedbackConsistent: true };
  });
  const result = await explain(item, "True");
  assert.equal(result.question.correctAnswer, "False");
  assert.equal(reviews, 2);
  await explain(item, "True");
  assert.equal(reviews, 2);
});

test("persistent unexplained reviewer rejection fails closed and is never cached", async t => {
  t.mock.method(console, "warn", () => {});
  let reviews = 0;
  const explain = createSubmittedAnswerExplainer(async prompt => {
    if (prompt.startsWith("Explain this submitted")) return { verified: true, explanation: "Two is even.", wrongExplanation: "",
      optionExplanations: { "0": "Two is even." } };
    reviews++;
    return { answerCorrect: false, feedbackConsistent: true, reason: "" };
  });
  for (let attempt = 0; attempt < 2; attempt++) await assert.rejects(explain(question, "2"), /invalid verdict after retry/);
  assert.equal(reviews, 4);
});
