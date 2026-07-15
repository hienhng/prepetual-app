import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import * as schema from "../../shared/schema.js";

async function main() {
  console.log("Starting deletion of public quizzes...");
  const publicRows = await db.select({ id: schema.quizzes.id }).from(schema.quizzes).where(eq(schema.quizzes.isPublic, 1));
  const ids = publicRows.map(r => r.id);
  console.log(`Found ${ids.length} public quizzes`);

  let deletedCount = 0;

  for (const id of ids) {
    try {
      await db.delete(schema.quizResults).where(eq(schema.quizResults.quizId, id));
      await db.delete(schema.quizComments).where(eq(schema.quizComments.quizId, id));
      await db.delete(schema.quizVotes).where(eq(schema.quizVotes.quizId, id));
      await db.delete(schema.quizProgress).where(eq(schema.quizProgress.quizId, id));
      await db.delete(schema.quizzes).where(eq(schema.quizzes.id, id));
      deletedCount++;
      console.log(`Deleted quiz ${id}`);
    } catch (e) {
      console.error(`Failed to delete quiz ${id}:`, e);
    }
  }

  console.log(`Deletion complete. Deleted ${deletedCount}/${ids.length} quizzes.`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
