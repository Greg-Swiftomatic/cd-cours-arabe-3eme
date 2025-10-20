import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@lib/db";
import { requireSession } from "@lib/session";

export const GET: APIRoute = async ({ request, locals }) => {
  const { user } = await requireSession(request, locals.runtime.env);
  const db = getDb(locals.runtime.env);

  const attemptRows = await db
    .select({
      id: schema.attempts.id,
      lessonId: schema.attempts.lessonId,
      score: schema.attempts.score,
      finishedAt: schema.attempts.finishedAt,
    })
    .from(schema.attempts)
    .where(eq(schema.attempts.userId, user.id))
    .all();

  const attemptsByLesson = new Map<
    number,
    { count: number; lastFinishedAt: number | null; lastScore: number | null }
  >();
  const attemptsById = new Map<number, { finishedAt: number | null; score: number | null }>();

  for (const row of attemptRows) {
    if (!row.lessonId) continue;
    attemptsById.set(row.id, { finishedAt: row.finishedAt, score: row.score });
    const stats =
      attemptsByLesson.get(row.lessonId) ?? {
        count: 0,
        lastFinishedAt: null,
        lastScore: null,
      };
    stats.count += 1;
    if (row.finishedAt && (!stats.lastFinishedAt || row.finishedAt > stats.lastFinishedAt)) {
      stats.lastFinishedAt = row.finishedAt;
      stats.lastScore = row.score ?? stats.lastScore;
    }
    attemptsByLesson.set(row.lessonId, stats);
  }

  const progressRows = await db
    .select({
      lessonId: schema.progress.lessonId,
      lessonSlug: schema.lessons.slug,
      lessonTitle: schema.lessons.titleAr,
      status: schema.progress.status,
      bestScore: schema.progress.bestScore,
      lastAttemptId: schema.progress.lastAttemptId,
    })
    .from(schema.progress)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.progress.lessonId))
    .where(eq(schema.progress.userId, user.id))
    .all();

  const progress = progressRows.map((row) => {
    const stats = row.lessonId ? attemptsByLesson.get(row.lessonId) : undefined;
    const lastAttempt = row.lastAttemptId
      ? attemptsById.get(row.lastAttemptId)
      : undefined;

    return {
      lessonSlug: row.lessonSlug,
      title: row.lessonTitle,
      status: row.status ?? "incomplete",
      bestScore: row.bestScore ?? 0,
      attempts: stats?.count ?? 0,
      updatedAt: (lastAttempt?.finishedAt ?? stats?.lastFinishedAt)
        ? new Date((lastAttempt?.finishedAt ?? stats?.lastFinishedAt)!)
            .toISOString()
        : null,
      lastScore: lastAttempt?.score ?? stats?.lastScore ?? null,
    };
  });

  const totalAttempts = attemptRows.length;
  const bestScore = Math.max(0, ...progress.map((item) => item.bestScore ?? 0));
  const completedLessons = progress.filter((item) => item.status === "complete").length;

  return new Response(
    JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      stats: {
        totalAttempts,
        bestScore,
        completedLessons,
      },
      progress,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
