export type LessonRecord = {
  lesson: LessonDetail;
  quiz: QuizConfig;
};

export type LessonDetail = {
  cycle: string;
  slug: string;
  order: number;
  title_ar: string;
  title_fr?: string;
  body_html_ar: string;
  body_html_fr?: string;
};

export type QuizQuestion = {
  id: string;
  type: string;
  prompt_ar: string;
  choices_ar?: string[];
  answer_index?: number;
  explain_fr?: string;
};

export type QuizConfig = {
  questions: QuizQuestion[];
  pass_threshold: number;
};

type LessonEntry = LessonRecord & { path: string };

const rawModules = import.meta.glob<Record<string, unknown>>(
  "../content/**/*.json",
  {
    eager: true,
  },
);

const lessonEntries: LessonEntry[] = Object.entries(rawModules).map(
  ([path, mod]) => {
    const data = (mod as { default: LessonRecord }).default;
    return {
      path,
      ...data,
    };
  },
);

const byKey = new Map<string, LessonEntry>();

for (const entry of lessonEntries) {
  const key = `${entry.lesson.cycle}/${entry.lesson.slug}`;
  byKey.set(key, entry);
}

export function getAllLessons(): LessonDetail[] {
  return lessonEntries
    .map((entry) => entry.lesson)
    .sort((a, b) => a.order - b.order);
}

export function getLessonsByCycle(cycle: string): LessonDetail[] {
  return lessonEntries
    .filter((entry) => entry.lesson.cycle === cycle)
    .map((entry) => entry.lesson)
    .sort((a, b) => a.order - b.order);
}

export function getLesson(cycle: string, slug: string) {
  return byKey.get(`${cycle}/${slug}`) ?? null;
}

export function getQuiz(cycle: string, slug: string) {
  const record = byKey.get(`${cycle}/${slug}`);
  return record ? record.quiz : null;
}
