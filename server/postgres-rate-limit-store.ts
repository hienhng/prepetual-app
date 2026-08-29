import { sql } from "drizzle-orm";

import { db } from "./db.js";
import type { RateLimitStore } from "./rate-limit.js";

export const postgresRateLimitStore: RateLimitStore = {
  async increment(bucketId, expiresAt) {
    const result = await db.execute<{ count: number }>(sql`
      INSERT INTO sessions (sid, sess, expire)
      VALUES (${bucketId}, jsonb_build_object('count', 1), ${expiresAt})
      ON CONFLICT (sid) DO UPDATE
      SET
        sess = jsonb_build_object(
          'count',
          COALESCE((sessions.sess->>'count')::integer, 0) + 1
        ),
        expire = EXCLUDED.expire
      RETURNING (sess->>'count')::integer AS count
    `);

    const count = Number(result.rows[0]?.count);
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new Error("Rate limiter returned an invalid counter");
    }
    return count;
  },
};
