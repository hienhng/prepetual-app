import type { Question } from "./schema.js";

export interface DailyRevision {
  quiz: { id: string; title: string; category: string };
  questions: Question[];
}
