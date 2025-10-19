const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

export const SESSION_COOKIE_NAME = "arabic_course_session";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function toArabicDigits(value: number | string) {
  return value
    .toString()
    .replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

export function generateOneTimeCode(length = 6) {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => (byte % 10).toString()).join("");
}

export function generateSessionToken(size = 32) {
  const buffer = new Uint8Array(size);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashString(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function createSessionCookie(token: string, maxAgeSeconds: number) {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ];
  return attributes.join("; ");
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=deleted; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function readSessionToken(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return cookie.slice(SESSION_COOKIE_NAME.length + 1);
    }
  }
  return null;
}
