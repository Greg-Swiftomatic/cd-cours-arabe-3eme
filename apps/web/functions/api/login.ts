import type { PagesFunction } from "@cloudflare/workers-types";

type LoginPayload = {
  email?: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = body.email?.trim();

  if (!email) {
    return new Response(
      JSON.stringify({ success: false, message: "Email requis" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // TODO: générer et envoyer un code à usage unique via email ou autre canal.
  return new Response(
    JSON.stringify({
      success: true,
      message:
        "Code de connexion envoyé (simulation). Intégrer un service mail avant la mise en production.",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};

type Env = {
  DB: D1Database;
};
