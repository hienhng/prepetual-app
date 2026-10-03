import { selectionAnswersMatch } from "../shared/selection-answer";
import { markQuestionFeedbackPrepared } from "../shared/quiz-feedback";
import type { Question } from "../shared/schema";
const route = new URLSearchParams(location.search).get("view") || "/quiz";
let quiz = { id: "selection-qa", userId: "qa", title: "Selection practice", sourceText: "Prime numbers have exactly two positive divisors.", category: "categories.math", difficulty: "easy", createdAt: new Date().toISOString(), questions: [1, 2, 3].map(i => ({ id: "q" + i, type: "selection", question: `Select all prime numbers (question ${i}).`, options: ["2", "3", "4", "9"], correctAnswer: '["2","3"]', explanation: "2 and 3 are prime. 4 and 9 are composite." })) };
const boilingCase = new URLSearchParams(location.search).get("case") === "boiling";
const unverifiedCase = new URLSearchParams(location.search).get("case") === "unverified";
const legacyCase = new URLSearchParams(location.search).get("case") === "legacy";
if (boilingCase || unverifiedCase) {
  quiz = { ...quiz, title: "Boiling feedback regression", questions: [{
    id: "q1", type: "multiple_choice", question: "Khi chất lỏng sôi, hiện tượng hoá hơi xảy ra ở vị trí nào?",
    options: ["Chỉ ở trong lòng chất lỏng", "Cả trong lòng và bề mặt chất lỏng", "Chỉ ở trên bề mặt chất lỏng", "Chỉ ở sát bề mặt chất lỏng"],
    correctAnswer: "Chỉ ở trong lòng chất lỏng", explanation: "Trong quá trình sôi, hơi được tạo ra cả trong lòng và trên bề mặt.",
  }] };
}
const prepareFixtureQuiz = () => {
  quiz = { ...quiz, questions: quiz.questions.map(question => markQuestionFeedbackPrepared({
    ...question as Question,
    correctAnswer: boilingCase ? question.options[1] : question.correctAnswer,
    explanation: boilingCase ? "Khi sôi, chất lỏng hoá hơi cả trong lòng và trên bề mặt." : question.explanation,
  })) } as typeof quiz;
};
if (!unverifiedCase && !legacyCase) prepareFixtureQuiz();
sessionStorage.setItem("quiz_progress", JSON.stringify({ quiz, answers: {}, checkedQuestions: [] }));
const qaRequests: string[] = [];
(window as any).__quizQaRequests = qaRequests;
const qaCounter = document.createElement("output");
qaCounter.setAttribute("aria-label", "Explanation requests");
document.body.append(qaCounter);
qaCounter.textContent = "Explanation requests: 0";
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = String(input);
  if (!url.startsWith("/api/")) return originalFetch(input, init);
  qaRequests.push(`${init?.method || "GET"} ${url}`);
  document.documentElement.dataset.quizQaRequests = JSON.stringify(qaRequests);
  qaCounter.textContent = `Explanation requests: ${qaRequests.filter(request => request === "POST /api/generate-explanation").length}`;
  let data: unknown = [];
  if (url === "/api/auth/user") data = { id: "qa", username: "Selection QA", email: "qa@example.test", onboardingCompleted: true, emailVerified: true, skipRevisionQuestions: true, consecutiveCorrectConfetti: false };
  if (url === "/api/quiz/selection-qa") {
    if (init?.method === "PUT") { quiz = { ...quiz, ...JSON.parse(String(init.body)) }; prepareFixtureQuiz(); }
    data = quiz;
  }
  if (url === "/api/quiz/selection-qa/prepare") {
    if (unverifiedCase) return new Response(JSON.stringify({ code: "ANSWER_REVIEW_REQUIRED" }), { status: 422, headers: { "Content-Type": "application/json" } });
    prepareFixtureQuiz();
    data = quiz;
  }
  if (url === "/api/submit-quiz") {
    const { answers } = JSON.parse(String(init?.body));
    const wrongQuestionIds = quiz.questions.filter(q => q.type === "selection" ? !selectionAnswersMatch(answers[q.id], q.correctAnswer) : answers[q.id] !== q.correctAnswer).map(q => q.id);
    data = { id: "qa-result", quizId: quiz.id, answers, score: Math.round((quiz.questions.length - wrongQuestionIds.length) / quiz.questions.length * 100), correctAnswers: quiz.questions.length - wrongQuestionIds.length, totalQuestions: quiz.questions.length, wrongQuestionIds };
  }
  if (url === "/api/generate-explanation") {
    if (unverifiedCase) return new Response(JSON.stringify({ code: "ANSWER_REVIEW_REQUIRED" }), { status: 422, headers: { "Content-Type": "application/json" } });
    const request = JSON.parse(String(init?.body));
    const question = quiz.questions.find(q => q.id === request.questionId)!;
    if (boilingCase) {
      question.correctAnswer = question.options[1];
      question.explanation = "Khi sôi, chất lỏng hoá hơi cả trong lòng và trên bề mặt.";
    }
    const wrongOptions = boilingCase ? {
      [question.options[0]]: "Hoá hơi cũng xảy ra ở bề mặt.", [question.options[2]]: "Bọt hơi cũng hình thành trong lòng chất lỏng.", [question.options[3]]: "Hoá hơi xảy ra cả trong lòng chất lỏng.",
    } : { "4": "4 is composite.", "9": "9 is composite." };
    const selected = question.type === "selection" ? JSON.parse(request.selectedAnswer) : [request.selectedAnswer];
    data = { verified: true, question: markQuestionFeedbackPrepared(question as Question),
      wrongAnswerExplanations: Object.fromEntries(Object.entries(wrongOptions).filter(([option]) => selected.includes(option))),
      correctAnswer: question.correctAnswer, isCorrect: question.type === "selection" ? selectionAnswersMatch(request.selectedAnswer, question.correctAnswer) : request.selectedAnswer === question.correctAnswer,
      explanation: question.explanation, wrongExplanation: "Select both 2 and 3, and no composite numbers." };
  }
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};
history.replaceState(null, "", route);
await import("./src/main");
