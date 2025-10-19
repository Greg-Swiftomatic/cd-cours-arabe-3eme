import type { PagesFunction } from "@cloudflare/workers-types";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@lib/db";
import { requireSession } from "@lib/session";

const DEFAULT_PASS_THRESHOLD = 80;

type AttemptPayload = {
  lessonSlug?: string;
  score?: number;
  detail?: unknown;
};

type Env = {
  DB: D1Database;
};

function parseScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

async function loadAttemptsForUser(
  env: Env,
  userId: number,
  lessonSlug?: string | null,
) {
  const db = getDb(env);
  const conditions = [eq(schema.attempts.userId, userId)] as Array<ReturnType<typeof eq>>;

  const rows = await db
    .select({
      id: schema.attempts.id,
      score: schema.attempts.score,
      detailJson: schema.attempts.detailJson,
      finishedAt: schema.attempts.finishedAt,
      startedAt: schema.attempts.startedAt,
      lessonSlug: schema.lessons.slug,
      lessonTitle: schema.lessons.titleAr,
    })
    .from(schema.attempts)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.attempts.lessonId))
    .where(
      lessonSlug
        ? and(eq(schema.attempts.userId, userId), eq(schema.lessons.slug, lessonSlug))
        : eq(schema.attempts.userId, userId),
    )
    .orderBy(desc(schema.attempts.finishedAt), desc(schema.attempts.id))
    .all();

  return rows.map((row) => {
    let detail: unknown = null;
    if (row.detailJson) {
      try {
        detail = JSON.parse(row.detailJson);
      } catch (error) {
        detail = row.detailJson;
      }
    }

    return {
      id: row.id,
      score: row.score,
      detail,
      finishedAt: row.finishedAt,
      startedAt: row.startedAt,
      lessonSlug: row.lessonSlug,
      lessonTitle: row.lessonTitle,
    };
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { user } = await requireSession(request, env);
  const url = new URL(request.url);
  const lessonFilter = url.searchParams.get("lesson");

  const attempts = await loadAttemptsForUser(env, user.id, lessonFilter);

  return new Response(JSON.stringify({ attempts }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { user } = await requireSession(request, env);
  const db = getDb(env);
  const body = (await request.json().catch(() => ({}))) as AttemptPayload;

  const lessonSlug = body.lessonSlug?.trim();
  if (!lessonSlug) {
    return new Response(
      JSON.stringify({ success: false, message: "معرّف الدرس مطلوب." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const lessons = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.slug, lessonSlug))
    .limit(1)
    .all();

  const lesson = lessons[0];
  if (!lesson) {
    return new Response(
      JSON.stringify({ success: false, message: "الدرس غير موجود." }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const score = parseScore(body.score);
  const detailJson = body.detail ? JSON.stringify(body.detail) : null;
  const now = Date.now();

  await db
    .insert(schema.attempts)
    .values({
      lessonId: lesson.id,
      quizId: null,
      userId: user.id,
      score,
      detailJson,
      startedAt: now,
      finishedAt: now,
    })
    .run();

  const [insertedAttempt] = await db
    .select()
    .from(schema.attempts)
    .where(eq(schema.attempts.userId, user.id))
    .orderBy(desc(schema.attempts.id))
    .limit(1)
    .all();

  const quizzes = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.lessonId, lesson.id))
    .limit(1)
    .all();

  let passThreshold = DEFAULT_PASS_THRESHOLD;
  const quiz = quizzes[0];
  if (quiz) {
    try {
      const parsed = JSON.parse(quiz.configJson ?? "{}");
      if (typeof parsed?.quiz?.pass_threshold === "number") {
        passThreshold = parsed.quiz.pass_threshold;
      }
    } catch (error) {
      console.warn("تعذر قراءة pass_threshold من config_json", error);
    }
  }

  const existingProgress = await db
    .select()
    .from(schema.progress)
    .where(
      and(
        eq(schema.progress.userId, user.id),
        eq(schema.progress.lessonId, lesson.id),
      ),
    )
    .limit(1)
    .all();

  const progressRow = existingProgress[0];
  const achievedScore = score ?? 0;
  const previousBest = progressRow?.bestScore ?? 0;
  const bestScore = score === null ? previousBest : Math.max(previousBest, achievedScore);
  const status = score !== null && score >= passThreshold ? "complete" : progressRow?.status ?? "incomplete";

  if (progressRow) {
    await db
      .update(schema.progress)
      .set({
        status,
        bestScore,
        lastAttemptId: insertedAttempt?.id ?? progressRow.lastAttemptId,
      })
      .where(eq(schema.progress.id, progressRow.id))
      .run();
  } else {
    await db
      .insert(schema.progress)
      .values({
        userId: user.id,
        lessonId: lesson.id,
        status,
        bestScore,
        lastAttemptId: insertedAttempt?.id ?? null,
      })
      .run();
  }

  const attempts = await loadAttemptsForUser(env, user.id, lessonSlug);
  const latestAttempt = attempts.find((item) => item.id === insertedAttempt?.id) ?? attempts[0] ?? null;

  const progressSummary = await db
    .select({
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

  return new Response(
    JSON.stringify({
      success: true,
      attempt: latestAttempt,
      attempts,
      progress: progressSummary,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
