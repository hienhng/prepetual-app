type QuizAccessRecord = {
  userId: string | null;
  isPublic: number | null;
};

type QuizResultAccessRecord = {
  userId: string | null;
};

export function canReadQuiz(
  quiz: QuizAccessRecord,
  requesterId?: string | null,
): boolean {
  return quiz.isPublic === 1 || Boolean(requesterId && quiz.userId === requesterId);
}

export function canManageQuiz(
  quiz: Pick<QuizAccessRecord, "userId">,
  requesterId?: string | null,
): boolean {
  return Boolean(requesterId && quiz.userId === requesterId);
}

export function canReadQuizResult(
  quiz: Pick<QuizAccessRecord, "userId">,
  result: QuizResultAccessRecord,
  requesterId?: string | null,
): boolean {
  return Boolean(
    requesterId &&
    (result.userId === requesterId || quiz.userId === requesterId),
  );
}
