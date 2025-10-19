import { and, eq, gt } from "drizzle-orm";
import { getDb, AppEnv, schema } from "@lib/db";
import { hashString, readSessionToken } from "@lib/auth";

type SessionResult = {
  user: typeof schema.users.$inferSelect;
  session: typeof schema.sessions.$inferSelect;
};

export async function getActiveSession(
  request: Request,
  env: AppEnv,
): Promise<SessionResult | null> {
  const token = readSessionToken(request);
  if (!token) return null;

  const db = getDb(env);
  const tokenHash = await hashString(token);
  const now = Date.now();

  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.tokenHash, tokenHash),
        gt(schema.sessions.expiresAt, now),
      ),
    )
    .limit(1)
    .all();

  const session = sessions[0];
  if (!session) return null;

  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1)
    .all();

  const user = users[0];
  if (!user) {
    return null;
  }

  await db
    .update(schema.sessions)
    .set({ lastSeen: now })
    .where(eq(schema.sessions.id, session.id))
    .run();

  return { user, session };
}

export async function requireSession(
  request: Request,
  env: AppEnv,
): Promise<SessionResult> {
  const result = await getActiveSession(request, env);
  if (!result) {
    throw new Response(
      JSON.stringify({ success: false, message: "يرجى تسجيل الدخول." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return result;
}
