// Run with `tsx --test client/quiz-submission.browser.test.ts` and Playwright
// available via NODE_PATH. Set QUIZ_QA_BROWSER_PATH for an installed Chromium.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import { markQuestionFeedbackPrepared } from "../shared/quiz-feedback.js";
import { signShortAnswerGrade, verifyShortAnswerGrade } from "../server/short-answer-grade.js";
process.env.SESSION_SECRET ||= "short-answer-browser-test-secret";

const { chromium } = createRequire(import.meta.url)("playwright");
const question = {
  id: "spring", type: "multiple_choice" as const,
  question: "Which type of energy is stored in an extended spring?",
  options: ["chemical energy.", "radiant energy.", "kinetic energy.", "potential energy."],
  correctAnswer: "potential energy.",
};
const quiz = { id: "spring-qa", userId: "qa", title: "Energy practice",
  sourceText: "An extended spring stores elastic potential energy.",
  category: "categories.science", difficulty: "easy", createdAt: new Date().toISOString(), questions: [question] };
const user = { id: "qa", username: "QA", email: "qa@example.test", onboardingCompleted: true,
  emailVerified: true, skipRevisionQuestions: true, consecutiveCorrectConfetti: false };
let browser: any;
let server: Awaited<ReturnType<typeof createServer>>;
let baseUrl: string;

before(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
  await server.listen();
  baseUrl = server.resolvedUrls!.local[0];
  browser = await chromium.launch({ headless: true,
    ...(process.env.QUIZ_QA_BROWSER_PATH ? { executablePath: process.env.QUIZ_QA_BROWSER_PATH } : {}) });
});
after(async () => { await browser?.close(); await server?.close(); });

async function fixture({ cold = false, savedAnswer, failure = 502, shortAnswer, guest = false, rejectGradeOnce = false }: {
  cold?: boolean; savedAnswer?: string; failure?: number; guest?: boolean;
  rejectGradeOnce?: boolean;
  shortAnswer?: { isCorrect: boolean; isPartial: boolean; failFirst?: boolean };
} = {}) {
  const fixtureQuestion = shortAnswer ? { id: "spring", type: "short_answer" as const,
    question: question.question, correctAnswer: "Elastic potential energy" } : question;
  const fixtureQuiz = { ...quiz, questions: [fixtureQuestion] };
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error: Error) => errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route: any) => route.abort());
  await page.addInitScript(({ quiz, cold }: any) => {
    if (!sessionStorage.getItem("qa_initialized")) {
      sessionStorage.setItem("qa_initialized", "true");
      if (!cold) sessionStorage.setItem("quiz_progress", JSON.stringify({ quiz, answers: {}, checkedQuestions: [] }));
      localStorage.setItem("language", "en");
    }
  }, { quiz: fixtureQuiz, cold });
  let releaseProgress!: () => void;
  const progressGate = new Promise<void>(resolve => { releaseProgress = resolve; });
  let releaseJudge!: () => void;
  const judgeGate = new Promise<void>(resolve => { releaseJudge = resolve; });
  let judgments = 0;
  let explanations = 0;
  let submitted: any;
  let submissions = 0;
  let quizFetches = 0;
  await page.route("**/api/**", async (route: any) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/user") return route.fulfill({ status: guest ? 401 : 200, json: guest ? null : user });
    if (path === "/api/quiz-progress") {
      await progressGate;
      return route.fulfill({ json: [{ quiz: fixtureQuiz, quizId: quiz.id, answers: savedAnswer ? { spring: savedAnswer } : {},
        checkedQuestions: savedAnswer ? ["spring"] : [], savedAt: new Date().toISOString() }] });
    }
    if (path === "/api/quiz/spring-qa") {
      quizFetches++;
      return route.fulfill({ json: fixtureQuiz });
    }
    if (path === "/api/grade-short-answer" && shortAnswer) {
      judgments++;
      const { userAnswer } = route.request().postDataJSON();
      await judgeGate;
      if (shortAnswer.failFirst && judgments === 1) return route.fulfill({ status: 502, json: { message: "Judge unavailable" } });
      return route.fulfill({ json: { isCorrect: shortAnswer.isCorrect, isPartial: shortAnswer.isPartial,
        explanation: "The model assessed your understanding of stored spring energy.",
        gradingToken: signShortAnswerGrade(quiz.id, fixtureQuestion, userAnswer, shortAnswer) } });
    }
    if (path === "/api/generate-explanation") {
      explanations++;
      if (explanations === 1) return route.fulfill({ status: failure, json: {
        ...(failure === 422 ? { code: "ANSWER_REVIEW_REQUIRED" } : {}), message: "Explanation unavailable" } });
      const { selectedAnswer } = route.request().postDataJSON();
      const isCorrect = selectedAnswer === question.correctAnswer;
      const explanation = "Extending a spring stores elastic potential energy.";
      const optionExplanations = { [question.correctAnswer]: explanation,
        ...(!isCorrect ? { [selectedAnswer]: "This is not the energy stored by extending a spring." } : {}) };
      return route.fulfill({ json: { verified: true, question: markQuestionFeedbackPrepared({ ...question, explanation }),
        correctAnswer: question.correctAnswer, isCorrect, explanation,
        wrongExplanation: isCorrect ? "" : "The stored energy is elastic potential energy.", optionExplanations } });
    }
    if (path === "/api/submit-quiz") {
      submitted = route.request().postDataJSON();
      submissions++;
      if (rejectGradeOnce && submissions === 1) return route.fulfill({ status: 409,
        json: { code: "SHORT_ANSWER_GRADING_REQUIRED", questionId: "spring" } });
      const isCorrect = shortAnswer
        ? verifyShortAnswerGrade(submitted.shortAnswerGradingTokens?.spring, quiz.id, fixtureQuestion, submitted.answers.spring)?.isCorrect
        : submitted.answers.spring === question.correctAnswer;
      return route.fulfill({ json: { id: "qa-result", quizId: quiz.id, answers: submitted.answers,
        score: isCorrect ? 100 : 0, correctAnswers: isCorrect ? 1 : 0, totalQuestions: 1,
        wrongQuestionIds: isCorrect ? [] : ["spring"], completedAt: new Date().toISOString() } });
    }
    return route.fulfill({ json: [] });
  });
  return { context, page, errors, releaseProgress, releaseJudge,
    get judgments() { return judgments; },
    get explanations() { return explanations; }, get submitted() { return submitted; }, get quizFetches() { return quizFetches; } };
}

async function snapshot(page: any) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("quiz_progress")!));
}

for (const [option, failure] of [[3, 502], [2, 502], [3, 422]] as const) {
  test(`spring option ${option}: failed explanation (${failure}) retains grade through late progress, retry, reload and finish`, async () => {
    const f = await fixture({ failure });
    try {
      await f.page.goto(`${baseUrl}quiz?id=spring-qa`);
      await f.page.getByTestId(`option-${option}`).click();
      await f.page.getByTestId("button-check").click();
      await f.page.getByTestId("explanation-unavailable").waitFor();
      assert.match(await f.page.getByTestId("explanation-unavailable").innerText(), /Your answer is graded/);
      assert.deepEqual((await snapshot(f.page)).checkedQuestions, ["spring"]);
      const progressResponse = f.page.waitForResponse((response: any) => response.url().endsWith("/api/quiz-progress"));
      f.releaseProgress();
      await progressResponse;
      // Allow effects caused by the old server snapshot to complete.
      await f.page.waitForTimeout(300);
      assert.equal((await snapshot(f.page)).answers.spring, question.options[option]);
      assert.deepEqual((await snapshot(f.page)).checkedQuestions, ["spring"]);
      assert.equal(await f.page.getByTestId("button-check").isVisible(), false);
      assert.equal(await f.page.getByTestId("button-finish").isEnabled(), true);
      assert.match(await f.page.getByTestId("option-3").getAttribute("class"), /border-green-500/);
      if (option !== 3) assert.match(await f.page.getByTestId(`option-${option}`).getAttribute("class"), /border-red-500/);
      await f.page.getByTestId("button-retry-explanation").click();
      await f.page.getByText("Extending a spring stores elastic potential energy.", { exact: true }).waitFor();
      assert.equal(f.explanations, 2);
      assert.deepEqual((await snapshot(f.page)).checkedQuestions, ["spring"]);
      await f.page.reload();
      await f.page.getByTestId("button-finish").waitFor();
      assert.equal((await snapshot(f.page)).answers.spring, question.options[option]);
      assert.equal(await f.page.getByTestId("button-check").isVisible(), false);
      await f.page.getByTestId("button-finish").click();
      await f.page.waitForURL("**/quiz-results");
      assert.deepEqual(f.submitted.answers, { spring: question.options[option] });
      assert.deepEqual(f.errors, []);
    } finally { f.releaseProgress(); await f.context.close(); }
  });
}

test("cold quiz links wait for saved progress and resume checked answers", async () => {
  const f = await fixture({ cold: true, savedAnswer: question.correctAnswer });
  try {
    await f.page.goto(`${baseUrl}quiz?id=spring-qa`);
    await f.page.getByTestId("quiz-loading-screen").waitFor();
    assert.equal(await f.page.getByTestId("button-check").isVisible(), false);
    assert.equal(f.quizFetches, 0);
    f.releaseProgress();
    await f.page.getByTestId("button-finish").waitFor();
    assert.equal((await snapshot(f.page)).answers.spring, question.correctAnswer);
    assert.deepEqual((await snapshot(f.page)).checkedQuestions, ["spring"]);
    assert.equal(f.quizFetches, 0);
    assert.deepEqual(f.errors, []);
  } finally { f.releaseProgress(); await f.context.close(); }
});

for (const verdict of [{ isCorrect: true, isPartial: false, label: "Correct", color: "green" },
  { isCorrect: false, isPartial: true, label: "Partially correct", color: "yellow" },
  { isCorrect: false, isPartial: false, label: "Incorrect", color: "red" }]) {
  test(`short answer waits for the judge's ${verdict.label} verdict and preserves it through reload and scoring`, async () => {
    const f = await fixture({ shortAnswer: verdict });
    try {
      f.releaseProgress();
      await f.page.goto(`${baseUrl}quiz?id=spring-qa`);
      await f.page.getByTestId("input-short-answer").fill("Energy stored by stretching the spring");
      await f.page.getByTestId("button-check").click();
      await f.page.getByTestId("short-answer-grading").waitFor();
      assert.equal(await f.page.getByTestId("button-check").isEnabled(), false);
      assert.equal(await f.page.getByTestId("toggle-explanation-short-answer").isVisible(), false);
      assert.doesNotMatch(await f.page.getByTestId("input-short-answer").getAttribute("class"), /border-(green|red|yellow)-500/);
      assert.deepEqual((await snapshot(f.page)).checkedQuestions, []);
      f.releaseJudge();
      await f.page.getByTestId("toggle-explanation-short-answer").waitFor();
      assert.match(await f.page.getByTestId("toggle-explanation-short-answer").innerText(), new RegExp(verdict.label));
      assert.match(await f.page.getByTestId("input-short-answer").getAttribute("class"), new RegExp(`border-${verdict.color}-500`));
      assert.equal(f.explanations, 0);
      assert.equal(f.judgments, 1);
      assert.deepEqual((await snapshot(f.page)).checkedQuestions, ["spring"]);
      await f.page.reload();
      await f.page.getByTestId("toggle-explanation-short-answer").waitFor();
      assert.match(await f.page.getByTestId("toggle-explanation-short-answer").innerText(), new RegExp(verdict.label));
      assert.equal(f.judgments, 1);
      await f.page.getByTestId("button-finish").click();
      await f.page.waitForURL("**/quiz-results");
      assert.ok(f.submitted.shortAnswerGradingTokens.spring);
      assert.deepEqual(f.errors, []);
    } finally { f.releaseProgress(); f.releaseJudge(); await f.context.close(); }
  });
}

test("judge failure leaves even an exact match ungraded and allows another check", async () => {
  const f = await fixture({ shortAnswer: { isCorrect: false, isPartial: true, failFirst: true } });
  try {
    f.releaseProgress();
    await f.page.goto(`${baseUrl}quiz?id=spring-qa`);
    await f.page.getByTestId("input-short-answer").fill("Elastic potential energy");
    await f.page.getByTestId("button-check").click();
    await f.page.getByTestId("short-answer-grading").waitFor();
    f.releaseJudge();
    await f.page.getByTestId("short-answer-grading-unavailable").waitFor();
    assert.deepEqual((await snapshot(f.page)).checkedQuestions, []);
    assert.equal(await f.page.getByTestId("button-finish").isVisible(), false);
    assert.equal(await f.page.getByTestId("button-check").isEnabled(), true);
    assert.doesNotMatch(await f.page.getByTestId("input-short-answer").getAttribute("class"), /border-(green|red|yellow)-500/);
    await f.page.getByTestId("button-check").click();
    await f.page.getByTestId("toggle-explanation-short-answer").waitFor();
    assert.match(await f.page.getByTestId("toggle-explanation-short-answer").innerText(), /Partially correct/);
    assert.equal(f.judgments, 2);
    assert.equal(f.explanations, 0);
    assert.deepEqual(f.errors, []);
  } finally { f.releaseProgress(); f.releaseJudge(); await f.context.close(); }
});

test("guests also see the model verdict only after judging completes", async () => {
  const f = await fixture({ guest: true, shortAnswer: { isCorrect: true, isPartial: false } });
  try {
    f.releaseProgress();
    await f.page.goto(`${baseUrl}quiz?id=spring-qa`);
    await f.page.getByTestId("input-short-answer").fill("Energy stored by stretching the spring");
    await f.page.getByTestId("button-check").click();
    await f.page.getByTestId("short-answer-grading").waitFor();
    assert.equal(await f.page.getByTestId("toggle-explanation-short-answer").isVisible(), false);
    f.releaseJudge();
    await f.page.getByTestId("toggle-explanation-short-answer").waitFor();
    assert.match(await f.page.getByTestId("toggle-explanation-short-answer").innerText(), /Correct/);
    assert.deepEqual(f.errors, []);
  } finally { f.releaseProgress(); f.releaseJudge(); await f.context.close(); }
});

test("legacy checked short answers wait for a model verdict when resumed", async () => {
  const f = await fixture({ cold: true, savedAnswer: "Elastic potential energy", shortAnswer: { isCorrect: true, isPartial: false } });
  try {
    f.releaseProgress();
    await f.page.goto(`${baseUrl}quiz?id=spring-qa`);
    await f.page.getByTestId("input-short-answer").waitFor();
    assert.equal(await f.page.getByTestId("input-short-answer").inputValue(), "Elastic potential energy");
    assert.equal(await f.page.getByTestId("button-finish").isVisible(), false);
    assert.equal(await f.page.getByTestId("toggle-explanation-short-answer").isVisible(), false);
    await f.page.getByTestId("button-check").click();
    await f.page.getByTestId("short-answer-grading").waitFor();
    assert.doesNotMatch(await f.page.getByTestId("input-short-answer").getAttribute("class"), /border-(green|red|yellow)-500/);
    f.releaseJudge();
    await f.page.getByTestId("toggle-explanation-short-answer").waitFor();
    assert.equal(f.judgments, 1);
    assert.deepEqual(f.errors, []);
  } finally { f.releaseProgress(); f.releaseJudge(); await f.context.close(); }
});

test("a rejected saved model receipt can be judged again before final scoring", async () => {
  const f = await fixture({ rejectGradeOnce: true, shortAnswer: { isCorrect: true, isPartial: false } });
  try {
    f.releaseProgress(); f.releaseJudge();
    await f.page.goto(`${baseUrl}quiz?id=spring-qa`);
    await f.page.getByTestId("input-short-answer").fill("Energy stored by stretching the spring");
    await f.page.getByTestId("button-check").click();
    await f.page.getByTestId("button-finish").waitFor();
    await f.page.getByTestId("button-finish").click();
    await f.page.getByTestId("short-answer-grading-unavailable").waitFor();
    assert.equal(await f.page.getByTestId("toggle-explanation-short-answer").isVisible(), false);
    await f.page.getByTestId("button-check").click();
    await f.page.getByTestId("button-finish").waitFor();
    await f.page.getByTestId("button-finish").click();
    await f.page.waitForURL("**/quiz-results");
    assert.equal(f.judgments, 2);
    assert.deepEqual(f.errors, []);
  } finally { f.releaseProgress(); f.releaseJudge(); await f.context.close(); }
});
