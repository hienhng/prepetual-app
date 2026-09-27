import { selectionAnswersMatch } from "../shared/selection-answer";
const route = new URLSearchParams(location.search).get("view") || "/quiz";
let quiz = { id: "selection-qa", userId: "qa", title: "Selection practice", sourceText: "Prime numbers have exactly two positive divisors.", category: "categories.math", difficulty: "easy", createdAt: new Date().toISOString(), questions: [1, 2, 3].map(i => ({ id: "q" + i, type: "selection", question: `Select all prime numbers (question ${i}).`, options: ["2", "3", "4", "9"], correctAnswer: '["2","3"]', explanation: "2 and 3 are prime. 4 and 9 are composite." })) };
sessionStorage.setItem("quiz_progress", JSON.stringify({ quiz, answers: {}, checkedQuestions: [] }));
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = String(input);
  if (!url.startsWith("/api/")) return originalFetch(input, init);
  let data: unknown = [];
  if (url === "/api/auth/user") data = { id: "qa", username: "Selection QA", email: "qa@example.test", onboardingCompleted: true, emailVerified: true, skipRevisionQuestions: true, consecutiveCorrectConfetti: false };
  if (url === "/api/quiz/selection-qa") {
    if (init?.method === "PUT") quiz = { ...quiz, ...JSON.parse(String(init.body)) };
    data = quiz;
  }
  if (url === "/api/submit-quiz") {
    const { answers } = JSON.parse(String(init?.body));
    const wrongQuestionIds = quiz.questions.filter(q => !selectionAnswersMatch(answers[q.id], q.correctAnswer)).map(q => q.id);
    data = { id: "qa-result", quizId: quiz.id, answers, score: Math.round((3 - wrongQuestionIds.length) / 3 * 100), correctAnswers: 3 - wrongQuestionIds.length, totalQuestions: 3, wrongQuestionIds };
  }
  if (url === "/api/generate-explanation") data = { explanation: "2 and 3 are prime. 4 and 9 are composite.", wrongExplanation: "Select both 2 and 3, and no composite numbers." };
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};
history.replaceState(null, "", route);
await import("./src/main");
