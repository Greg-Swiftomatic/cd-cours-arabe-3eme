import type { PagesFunction } from "@cloudflare/workers-types";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "@lib/db";
import {
  createSessionCookie,
  generateSessionToken,
  hashString,
  SESSION_TTL_SECONDS,
} from "@lib/auth";

type VerifyPayload = {
  email?: string;
  code?: string;
};

const ERROR_RESPONSE = {
  success: false,
  message: "رمز الدخول غير صالح أو منتهي.",
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => ({}))) as VerifyPayload;
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return new Response(JSON.stringify(ERROR_RESPONSE), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = getDb(env);
  const codeHash = await hashString(`${email}:${code}`);
  const now = Date.now();

  const matches = await db
    .select()
    .from(schema.loginCodes)
    .where(
      and(
        eq(schema.loginCodes.email, email),
        eq(schema.loginCodes.codeHash, codeHash),
        gt(schema.loginCodes.expiresAt, now),
        isNull(schema.loginCodes.usedAt),
      ),
    )
    .orderBy(desc(schema.loginCodes.createdAt))
    .limit(1)
    .all();

  const match = matches[0];

  if (!match) {
    return new Response(JSON.stringify(ERROR_RESPONSE), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db
    .update(schema.loginCodes)
    .set({ usedAt: now })
    .where(eq(schema.loginCodes.id, match.id))
    .run();

  let users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
    .all();

  if (users.length === 0) {
    await db.insert(schema.users).values({ email }).run();

    users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
      .all();
  }

  const user = users[0];

  if (!user) {
    return new Response(JSON.stringify(ERROR_RESPONSE), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = generateSessionToken();
  const tokenHash = await hashString(token);
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;

  await db
    .insert(schema.sessions)
    .values({
      userId: user.id,
      tokenHash,
      expiresAt,
      lastSeen: now,
    })
    .run();

  const cookie = createSessionCookie(token, SESSION_TTL_SECONDS);

  return new Response(
    JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    },
  );
};

type Env = {
  DB: D1Database;
};
