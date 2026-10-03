// Defaults for tests of unrelated generation behaviors. Quality regressions
// construct explicit verdicts themselves, including missing and false fields.
export function withQuestionReviewDefaults(value: any): any {
  if (!value || typeof value !== "object") return value;
  const defaults = { selfContained: true, sourceSupported: true, hardReasoning: true, credibleDistractors: true,
    reasoningJustification: "Apply the source facts, then compare the derived conclusion with each condition." };
  return { ...value,
    ...(Array.isArray(value.evaluations) ? { evaluations: value.evaluations.map((item: any) => ({ ...defaults, ...item })) } : {}),
    ...(Array.isArray(value.verifications) ? { verifications: value.verifications.map((item: any) => ({ ...defaults, ...item })) } : {}),
  };
}
