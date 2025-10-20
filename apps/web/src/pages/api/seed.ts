import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@lib/db";

type ContentRecord = {
  lesson: {
    cycle: string;
    slug: string;
    order: number;
    title_ar: string;
    title_fr?: string;
    body_html_ar: string;
    body_html_fr?: string;
  };
  quiz?: unknown;
};

const contentModules = import.meta.glob<ContentRecord>("../../content/**/*.json", {
  eager: true,
});

export const POST: APIRoute = async ({ request, locals }) => {
  // Temporarily allow unauthenticated seeding for initial setup
  // TODO: Re-enable authentication after initial seed
  /*
  const seedToken = locals.runtime.env.SEED_TOKEN;
  if (seedToken) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${seedToken}`) {
      return new Response(
        JSON.stringify({ success: false, message: "ممنوع الوصول إلى الاستيراد." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
  */

  const db = getDb(locals.runtime.env);
  let lessonsUpserted = 0;
  let quizzesUpserted = 0;

  for (const moduleRecord of Object.values(contentModules)) {
    const record = moduleRecord;
    if (!record?.lesson) continue;

    const lessonData = record.lesson;
    const quizData = record.quiz ?? null;

    await db.transaction(async (tx) => {
      const existingLessons = await tx
        .select({ id: schema.lessons.id })
        .from(schema.lessons)
        .where(eq(schema.lessons.slug, lessonData.slug))
        .limit(1)
        .all();

      let lessonId: number;

      if (existingLessons.length > 0) {
        lessonId = existingLessons[0].id;
        await tx
          .update(schema.lessons)
          .set({
            cycle: lessonData.cycle,
            order: lessonData.order,
            titleAr: lessonData.title_ar,
            titleFr: lessonData.title_fr ?? null,
            bodyHtmlAr: lessonData.body_html_ar,
            bodyHtmlFr: lessonData.body_html_fr ?? null,
          })
          .where(eq(schema.lessons.id, lessonId))
          .run();
      } else {
        const inserted = await tx
          .insert(schema.lessons)
          .values({
            cycle: lessonData.cycle,
            slug: lessonData.slug,
            order: lessonData.order,
            titleAr: lessonData.title_ar,
            titleFr: lessonData.title_fr ?? null,
            bodyHtmlAr: lessonData.body_html_ar,
            bodyHtmlFr: lessonData.body_html_fr ?? null,
          })
          .returning({ id: schema.lessons.id })
          .get();

        lessonId = inserted.id;
      }

      lessonsUpserted += 1;

      if (quizData) {
        const existingQuiz = await tx
          .select({ id: schema.quizzes.id })
          .from(schema.quizzes)
          .where(eq(schema.quizzes.lessonId, lessonId))
          .limit(1)
          .all();

        const configJson = JSON.stringify(quizData);

        if (existingQuiz.length > 0) {
          await tx
            .update(schema.quizzes)
            .set({ configJson })
            .where(eq(schema.quizzes.id, existingQuiz[0].id))
            .run();
        } else {
          await tx
            .insert(schema.quizzes)
            .values({ lessonId, configJson })
            .run();
        }

        quizzesUpserted += 1;
      }
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      lessons: lessonsUpserted,
      quizzes: quizzesUpserted,
      filesProcessed: Object.keys(contentModules).length,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
