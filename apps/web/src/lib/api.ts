const API_BASE = "/api";

async function request<T>(
  path: string,
  init?: RequestInit & { parse?: "json" | "text" },
): Promise<T> {
  const { parse = "json", ...rest } = init ?? {};
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    ...rest,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (parse === "text") {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

export function login(email: string) {
  return request<{ success: boolean; message: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function fetchMe() {
  return request<{
    email: string;
    name?: string;
    role?: string;
    progress: unknown;
  }>("/me", {
    method: "GET",
  });
}

export function createAttempt(payload: {
  quizId: number | null;
  lessonSlug: string;
  score: number;
  detail: unknown;
}) {
  return request<{ success: boolean }>("/attempts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAttempts(lessonSlug: string) {
  const params = new URLSearchParams({ lesson: lessonSlug });
  return request<{ attempts: unknown[] }>(`/attempts?${params.toString()}`, {
    method: "GET",
  });
}

export function seedContent() {
  return request<{ imported: number }>("/seed", {
    method: "POST",
  });
}
