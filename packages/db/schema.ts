import {
  integer,
  sqliteTable,
  text,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").default("student"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`(strftime('%s','now') * 1000)`,
  ),
});

export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cycle: text("cycle").notNull(),
  slug: text("slug").notNull().unique(),
  titleAr: text("title_ar").notNull(),
  titleFr: text("title_fr"),
  bodyHtmlAr: text("body_html_ar").notNull(),
  bodyHtmlFr: text("body_html_fr"),
  order: integer("order_idx").notNull(),
});

export const quizzes = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id),
  configJson: text("config_json").notNull(),
});

export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizId: integer("quiz_id").references(() => quizzes.id),
  userId: integer("user_id").references(() => users.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).default(
    sql`(strftime('%s','now') * 1000)`,
  ),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  score: real("score"),
  detailJson: text("detail_json"),
});

export const progress = sqliteTable("progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  status: text("status").default("incomplete"),
  bestScore: real("best_score").default(0),
  lastAttemptId: integer("last_attempt_id").references(() => attempts.id),
});

export const loginCodes = sqliteTable(
  "login_codes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
      sql`(strftime('%s','now') * 1000)`,
    ),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    emailIdx: index("login_codes_email_idx").on(table.email),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
      sql`(strftime('%s','now') * 1000)`,
    ),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    lastSeen: integer("last_seen", { mode: "timestamp_ms" }).default(
      sql`(strftime('%s','now') * 1000)`,
    ),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    userIdx: index("sessions_user_idx").on(table.userId),
  }),
);
