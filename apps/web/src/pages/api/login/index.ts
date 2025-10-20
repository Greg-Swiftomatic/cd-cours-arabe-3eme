import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@lib/db";
import { generateOneTimeCode, hashString } from "@lib/auth";

type LoginPayload = {
  email?: string;
};

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const rawEmail = body.email?.trim();

  if (!rawEmail || !emailPattern.test(rawEmail)) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "يرجى إدخال بريد إلكتروني صالح.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const email = rawEmail.toLowerCase();
  const db = getDb(locals.runtime.env);

  let user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
    .all();

  if (user.length === 0) {
    await db.insert(schema.users).values({ email }).run();

    user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
      .all();
  }

  if (user.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "تعذر إنشاء الحساب. حاول مرة أخرى.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const code = generateOneTimeCode();
  const codeHash = await hashString(`${email}:${code}`);
  const expiresAt = Date.now() + CODE_TTL_MS;

  await db
    .insert(schema.loginCodes)
    .values({
      email,
      codeHash,
      expiresAt,
    })
    .run();

  return new Response(
    JSON.stringify({
      success: true,
      message: "تم إنشاء رمز الدخول. استخدمه للتحقق.",
      code, // TODO: أرسل الرمز عبر البريد أو الرسائل القصيرة. هذا الحقل للتجربة فقط.
      expiresAt,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
