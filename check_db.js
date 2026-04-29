
import { db } from "./server/db.js";
import { quizResults, users, quizzes } from "./shared/schema.js";
import { eq, isNull } from "drizzle-orm";

async function checkData() {
  try {
    const allUsers = await db.select().from(users).limit(10);
    console.log("Users Count:", allUsers.length);
    
    const allResults = await db.select().from(quizResults);
    console.log("Total Results Count:", allResults.length);

    const resultsWithNoUser = await db.select().from(quizResults).where(isNull(quizResults.userId));
    console.log("Results with NULL userId:", resultsWithNoUser.length);

    if (allUsers.length > 0) {
      for (const user of allUsers) {
        const userResults = await db.select().from(quizResults).where(eq(quizResults.userId, user.id));
        console.log(`Results for user ${user.username || user.email} (${user.id}):`, userResults.length);
      }
    }

    // Check sample join
    const joinCheck = await db
      .select({
        result: quizResults,
        quiz: quizzes
      })
      .from(quizResults)
      .innerJoin(quizzes, eq(quizResults.quizId, quizzes.id))
      .limit(10);
    
    console.log("Join check results (sample 10):", joinCheck.length);

  } catch (error) {
    console.error("Error checking data:", error);
  } finally {
      process.exit(0);
  }
}

checkData();
