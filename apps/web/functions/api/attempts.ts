import type { PagesFunction } from "@cloudflare/workers-types";

type AttemptPayload = {
  lessonSlug?: string;
  quizId?: number | null;
  score?: number;
  detail?: unknown;
};

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url);
  const lesson = url.searchParams.get("lesson");

  // TODO: قراءة المحاولات الحقيقية من قاعدة البيانات.
  const mockAttempts = [
    {
      id: 1,
      lessonSlug: lesson ?? "01-aamal-al-masdar",
      score: 90,
      createdAt: new Date().toISOString(),
    },
  ];

  return new Response(
    JSON.stringify({ attempts: mockAttempts }),
    { headers: { "Content-Type": "application/json" } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as AttemptPayload;

  if (!body.lessonSlug) {
    return new Response(
      JSON.stringify({ success: false, message: "معرّف الدرس مطلوب." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const payload = {
    lessonSlug: body.lessonSlug,
    quizId: body.quizId ?? null,
    score: typeof body.score === "number" ? body.score : null,
    detail: body.detail ?? null,
    createdAt: new Date().toISOString(),
  };

  // TODO: حفظ المحاولة داخل D1.

  return new Response(
    JSON.stringify({ success: true, attempt: payload }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};

type Env = {
  DB: D1Database;
};
