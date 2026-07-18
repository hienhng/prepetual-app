import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db.js";
import { quizzes, users } from "../shared/schema.js";

const CURATED_USER_EMAIL = "giahienhn@gmail.com";

const seededQuizTitles = [
  "SAT Math Problem Set",
  "IELTS Reading Skills Quiz",
  "AP Biology Cell Structure Quiz",
  "AP U.S. History Founding Era",
  "AP Spanish Language Practice",
  "GRE Verbal Reasoning Practice",
];

/**
 * Removes the legacy curated public quizzes without affecting quizzes that
 * users have chosen to share publicly.
 */
export async function removeSeededPublicQuizzes() {
  const [curatedUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, CURATED_USER_EMAIL));

  if (!curatedUser) {
    return;
  }

  const deleted = await db
    .delete(quizzes)
    .where(
      and(
        eq(quizzes.isPublic, 1),
        inArray(quizzes.title, seededQuizTitles),
        eq(quizzes.userId, curatedUser.id),
      ),
    )
    .returning({ id: quizzes.id });

  if (deleted.length > 0) {
    console.log(`Removed ${deleted.length} legacy seeded public quizzes.`);
  }
}

if (process.argv[1]?.endsWith("remove-seeded-public-quizzes.ts")) {
  removeSeededPublicQuizzes().catch((error) => {
    console.error("Failed to remove seeded public quizzes:", error);
    process.exitCode = 1;
  });
}
