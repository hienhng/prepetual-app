
import { db } from "./server/db.js";
import { quizResults, users } from "./shared/schema.js";
import { isNull, eq } from "drizzle-orm";

async function migrateData() {
  try {
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
      console.log("No user found to migrate to.");
      return;
    }

    console.log(`Migrating NULL userId results to user: ${user.username} (${user.id})`);

    const updated = await db
      .update(quizResults)
      .set({ userId: user.id })
      .where(isNull(quizResults.userId))
      .returning();

    console.log(`Successfully migrated ${updated.length} results.`);

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
      process.exit(0);
  }
}

migrateData();
