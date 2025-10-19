import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequestGet: PagesFunction<Env> = async () => {
  // TODO: remplacer par une vérification d'authentification réelle et lecture D1.
  const mockProgress = [
    {
      lessonSlug: "01-aamal-al-masdar",
      title_fr: "L’action du masdar",
      score: 90,
      attempts: 2,
      updatedAt: new Date().toISOString(),
    },
  ];

  return new Response(
    JSON.stringify({
      email: "parent@example.com",
      name: "Famille Demo",
      role: "parent",
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
