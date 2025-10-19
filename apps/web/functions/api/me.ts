import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequestGet: PagesFunction<Env> = async () => {
  // TODO: استبدل هذا الهيكل بقيم حقيقية من D1 مع التحقق من الجلسة.
  const mockProgress = [
    {
      lessonSlug: "01-aamal-al-masdar",
      title_fr: "إعمال المصدر",
      score: 90,
      attempts: 2,
      updatedAt: new Date().toISOString(),
    },
  ];

  return new Response(
    JSON.stringify({
      email: "parent@example.com",
      name: "ولي الأمر",
      role: "guardian",
      progress: mockProgress,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};

type Env = {
  DB: D1Database;
};
