
import { db } from "./server/db.js";
import { quizResults, users, quizzes } from "./shared/schema.js";
import { eq, isNull } from "drizzle-orm";

async function checkData() {
  try {
    const allUsers = await db.select().from(users).limit(10);
    console.log("Users Count:", allUsers.length);
    console.log("Users IDs:", allUsers.map(u => u.id));

    const allResultsCount = await db.select().from(quizResults);
    console.log("Total Results Count:", allResultsCount.length);

    const resultsWithNoUser = await db.select().from(quizResults).where(isNull(quizResults.userId));
    console.log("Results with NULL userId:", resultsWithNoUser.length);

    if (allUsers.length > 0) {
      for (const user of allUsers) {
        const userResults = await db.select().from(quizResults).where(eq(quizResults.userId, user.id));
        console.log(`Results for user ${user.username || user.email} (${user.id}):`, userResults.length);
      }
    }

    // Check if results exist but the quiz is missing
    const results = await db.select().from(quizResults).limit(100);
    let missingQuizzes = 0;
    for (const r of results) {
        const [q] = await db.select().from(quizzes).where(eq(quizzes.id, r.quizId));
        if (!q) missingQuizzes++;
    }
    console.log("Results with missing quizzes (in sample of 100):", missingQuizzes);

  } catch (error) {
    console.error("Error checking data:", error);
  } finally {
      process.exit(0);
  }
}

checkData();
