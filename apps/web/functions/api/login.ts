import type { PagesFunction } from "@cloudflare/workers-types";

type LoginPayload = {
  email?: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = body.email?.trim();

  if (!email) {
    return new Response(JSON.stringify({ success: false, message: "البريد الإلكتروني مطلوب." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // TODO: توليد رمز دخول وإرساله عبر البريد أو أي وسيلة مفضلة.
  return new Response(
    JSON.stringify({
      success: true,
      message: "تم إرسال رمز الدخول (محاكاة). أضف خدمة البريد قبل الإطلاق.",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};

type Env = {
  DB: D1Database;
};
