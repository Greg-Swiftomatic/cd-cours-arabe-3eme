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
  return request<{
    success: boolean;
    message: string;
    code?: string;
    expiresAt?: number;
  }>("/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyLogin(email: string, code: string) {
  return request<{
    success: boolean;
    user?: {
      id: number;
      email: string;
      name?: string | null;
      role?: string | null;
    };
  }>("/login/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function fetchMe() {
  return request<{
    email: string;
    name?: string | null;
    role?: string | null;
    stats: {
      totalAttempts: number;
      bestScore: number;
      completedLessons: number;
    };
    progress: Array<{
      lessonSlug: string;
      title: string;
      status: string;
      bestScore: number;
      attempts: number;
      updatedAt: string | null;
      lastScore: number | null;
    }>;
  }>("/me", {
    method: "GET",
  });
}

export function createAttempt(payload: {
  lessonSlug: string;
  score: number | null;
  detail: unknown;
}) {
  return request<{
    success: boolean;
    attempt: unknown;
    attempts: unknown[];
    progress: unknown;
  }>("/attempts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAttempts(lessonSlug: string) {
  const params = new URLSearchParams({ lesson: lessonSlug });
  return request<{
    attempts: Array<{
      id: number;
      score: number | null;
      detail: unknown;
      finishedAt: number | null;
      startedAt: number | null;
      lessonSlug: string;
      lessonTitle: string;
    }>;
  }>(`/attempts?${params.toString()}`, {
    method: "GET",
  });
}

export function seedContent() {
  return request<{ imported: number }>("/seed", {
    method: "POST",
  });
}
