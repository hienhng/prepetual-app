import type { QuestionType } from "../shared/schema.js";

export type AssessmentPracticeProfile = {
  id: "digital-sat-reading-writing" | "digital-sat-math" | "digital-sat";
  guidance: string;
  preferredQuestionTypes?: QuestionType[];
};

const explicitlyRequestsSatMetadata = (request: string): boolean => {
  const normalized = request.toLowerCase().replace(/\s+/g, " ").trim();

  return [
    /(?:quiz|test)\s+(?:me\s+)?(?:on|about)\s+(?:the\s+)?(?:digital\s+)?sat\b(?:\s*$|\s+(?:format|structure|scoring|rules|history|registration))/,
    /(?:quiz|test)\s+(?:me\s+)?(?:on|about)\s+(?:the\s+)?(?:digital\s+)?sat(?:'s)?\s+(?:format|structure|scoring|rules|history|registration)/,
    /(?:quiz|test|questions?).*\babout\b.*(?:format|structure|scoring|rules|history|registration).*\b(?:digital\s+)?sat\b/,
    /(?:how many questions|how long|what is the score range|who administers)\b.*\b(?:digital\s+)?sat\b/,
  ].some((pattern) => pattern.test(normalized));
};

const SAT_READING_AND_WRITING_GUIDANCE = `STANDARDIZED ASSESSMENT PROFILE — DIGITAL SAT READING AND WRITING:
- Interpret this as a request to PRACTICE THE SKILLS ASSESSED, not as a request for trivia about the SAT. Never ask what SAT stands for, how the test is organized, how it is scored, how long it lasts, or which skills/domains it contains.
- Write wholly original practice material. Do not quote, closely imitate, or claim that any item is an official College Board question.
- Put the complete stimulus and question stem together in the question field so the learner has everything needed to answer.
- Model the digital SAT's discrete item format: one short stimulus followed by one question. Reading stimuli or passage pairs should generally be 25–150 words. A writing item may instead use a short passage with a blank or a concise set of student notes when that is appropriate to the skill.
- Draw original stimulus topics from literature, history/social studies, the humanities, and science. The learner should answer from the supplied stimulus, not from specialized outside knowledge.
- Cover the assessed domains when the request is broad: Information and Ideas (central ideas/details, inference, command of evidence); Craft and Structure (words in context, text structure/purpose, cross-text connections); Expression of Ideas (rhetorical synthesis, transitions); and Standard English Conventions (boundaries, form/structure/sense).
- Prefer an approximate domain mix of 26% Information and Ideas, 28% Craft and Structure, 20% Expression of Ideas, and 26% Standard English Conventions when enough questions are requested. If the user names a narrower skill or domain, focus on it instead.
- Authentic SAT Reading and Writing items have four answer choices. When multiple_choice is an allowed type, use it for every item.`;

const SAT_MATH_GUIDANCE = `STANDARDIZED ASSESSMENT PROFILE — DIGITAL SAT MATH:
- Interpret this as a request to PRACTICE THE SKILLS ASSESSED, not as a request for trivia about the SAT. Never ask what SAT stands for, how the test is organized, how it is scored, how long it lasts, or which domains it contains.
- Write wholly original practice material. Do not quote, closely imitate, or claim that any item is an official College Board question.
- Assess Algebra, Advanced Math, Problem-Solving and Data Analysis, and Geometry and Trigonometry unless the user requests a narrower domain.
- Give every problem all conditions needed for one objective answer. Use realistic science, social-studies, or real-world contexts where helpful, but do not require specialized outside knowledge.
- Digital SAT Math uses four-option multiple-choice and student-produced responses. In this app, short_answer is the closest supported form to a student-produced response.`;

const SAT_GENERAL_GUIDANCE = `STANDARDIZED ASSESSMENT PROFILE — DIGITAL SAT:
- Interpret this as a request to PRACTICE SAT-ASSESSED SKILLS, not as a request for trivia about the SAT. Never ask what SAT stands for, how the test is organized, how it is scored, how long it lasts, or which domains it contains.
- Write wholly original practice material. Do not quote, closely imitate, or claim that any item is an official College Board question.
- Use the Reading and Writing profile for literacy items: a complete short stimulus followed by one skill-based question covering Information and Ideas, Craft and Structure, Expression of Ideas, or Standard English Conventions.
- Use the Math profile for math items: Algebra, Advanced Math, Problem-Solving and Data Analysis, or Geometry and Trigonometry.
- If the request implies a section, keep every item in that section. If it truly requests general SAT practice, balance Reading and Writing with Math.`;

export function getAssessmentPracticeProfile(request: string): AssessmentPracticeProfile | null {
  if (!/\b(?:digital\s+)?sat\b/i.test(request) || explicitlyRequestsSatMetadata(request)) {
    return null;
  }

  const normalized = request
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\/_+\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const requestsReadingAndWriting =
    /\breading\s+and\s+writing\b/.test(normalized) ||
    /\breading\s+writing\b/.test(normalized) ||
    /\br\s+and\s+w\b/.test(normalized) ||
    /\b(?:verbal|english)\b/.test(normalized);
  const requestsMath = /\bmath(?:ematics)?\b/.test(normalized);

  if (requestsReadingAndWriting && !requestsMath) {
    return {
      id: "digital-sat-reading-writing",
      guidance: SAT_READING_AND_WRITING_GUIDANCE,
      preferredQuestionTypes: ["multiple_choice"],
    };
  }

  if (requestsMath && !requestsReadingAndWriting) {
    return {
      id: "digital-sat-math",
      guidance: SAT_MATH_GUIDANCE,
    };
  }

  return {
    id: "digital-sat",
    guidance: SAT_GENERAL_GUIDANCE,
  };
}

export function applyAssessmentQuestionTypePreference(
  requestedTypes: QuestionType[],
  profile: AssessmentPracticeProfile | null,
): QuestionType[] {
  if (!profile?.preferredQuestionTypes) return requestedTypes;

  const supportedPreferredTypes = profile.preferredQuestionTypes.filter((type) =>
    requestedTypes.includes(type),
  );
  return supportedPreferredTypes.length > 0 ? supportedPreferredTypes : requestedTypes;
}

export function isOffScopeAssessmentMetadataQuestion(
  question: unknown,
  profile: AssessmentPracticeProfile | null,
): boolean {
  if (!profile || typeof question !== "string") return false;

  const normalized = question.toLowerCase().replace(/\s+/g, " ").trim();
  return [
    /\bwhat does (?:the )?sat stand for\b/,
    /\bhow many (?:questions|sections|modules)\b.*\b(?:digital )?sat\b/,
    /\bhow long\b.*\b(?:digital )?sat\b/,
    /\bwhat (?:is|are)\b.*\b(?:sat )?(?:score range|scoring scale|time limit)\b/,
    /\bwho (?:administers|owns|runs|created)\b.*\b(?:digital )?sat\b/,
    /\bwhich (?:of the following )?(?:is|are)\b.*\b(?:sat )?(?:section|sections|domain|domains)\b/,
  ].some((pattern) => pattern.test(normalized));
}
