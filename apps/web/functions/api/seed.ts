import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequestPost: PagesFunction<Env> = async () => {
  // TODO: parcourir le contenu JSON et l'insérer dans D1.
  return new Response(
    JSON.stringify({
      success: true,
      imported: 0,
      note: "Initialisation de la base à implémenter.",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};

type Env = {
  DB: D1Database;
};
