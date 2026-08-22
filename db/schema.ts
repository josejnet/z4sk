import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: text("id").primaryKey(), creatorTokenHash: text("creator_token_hash").notNull(), creatorEmail: text("creator_email").notNull().default(""), creatorName: text("creator_name").notNull(), recipientName: text("recipient_name").notNull(), title: text("title").notNull(), level: text("level").notNull(), locale: text("locale").notNull().default("en"), libraryVersion: text("library_version").notNull().default("2026.08"), questionsJson: text("questions_json").notNull(), encryptionPublicKey: text("encryption_public_key").notNull().default(""), premium: integer("premium").notNull().default(0), viewOnce: integer("view_once").notNull().default(0), doubleBlind: integer("double_blind").notNull().default(0), matchQuestion: text("match_question").notNull().default(""), timedMode: integer("timed_mode").notNull().default(0), creatorInterest: integer("creator_interest").notNull().default(0), packSlug: text("pack_slug").notNull().default("original"), openedAt: text("opened_at"), closed: integer("closed").notNull().default(0), createdAt: text("created_at").notNull(), expiresAt: text("expires_at").notNull(),
});

export const questionMetrics = sqliteTable("question_metrics", {
  questionHash: text("question_hash").notNull(), locale: text("locale").notNull(), level: text("level").notNull(), libraryVersion: text("library_version").notNull(), selectedCount: integer("selected_count").notNull().default(0), completedCount: integer("completed_count").notNull().default(0), totalAnswerChars: integer("total_answer_chars").notNull().default(0), lastCompletedAt: text("last_completed_at"),
}, (table) => [primaryKey({ columns: [table.questionHash, table.locale, table.level, table.libraryVersion] })]);

export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(), gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }), respondentName: text("respondent_name").notNull(), answersJson: text("answers_json").notNull(), reactionsJson: text("reactions_json").notNull().default("[]"), encryptedPayload: text("encrypted_payload").notNull().default(""), matched: integer("matched").notNull().default(0), createdAt: text("created_at").notNull(),
}, (table) => [index("idx_responses_game_created").on(table.gameId, table.createdAt)]);

export const trendMetrics = sqliteTable("trend_metrics", { questionHash: text("question_hash").notNull(), country: text("country").notNull(), locale: text("locale").notNull(), level: text("level").notNull(), completedCount: integer("completed_count").notNull().default(0), totalAnswerChars: integer("total_answer_chars").notNull().default(0), lastCompletedAt: text("last_completed_at").notNull() }, (table) => [primaryKey({ columns: [table.questionHash, table.country, table.locale, table.level] })]);
export const productEvents = sqliteTable("product_events", { id: text("id").primaryKey(), eventType: text("event_type").notNull(), gameId: text("game_id").notNull(), locale: text("locale").notNull(), level: text("level").notNull(), country: text("country").notNull(), packSlug: text("pack_slug").notNull(), source: text("source").notNull(), libraryVersion: text("library_version").notNull(), createdAt: text("created_at").notNull() }, (table) => [index("idx_product_events_type_created").on(table.eventType, table.createdAt)]);
export const abuseReports = sqliteTable("abuse_reports", { id:text("id").primaryKey(), gameId:text("game_id").notNull(), reason:text("reason").notNull(), country:text("country").notNull(), createdAt:text("created_at").notNull() }, (table)=>[index("idx_abuse_reports_game").on(table.gameId)]);
export const rateLimits = sqliteTable("rate_limits", { identifierHash:text("identifier_hash").notNull(), scope:text("scope").notNull(), windowStart:integer("window_start").notNull(), requestCount:integer("request_count").notNull().default(1) }, (table)=>[primaryKey({columns:[table.identifierHash,table.scope,table.windowStart]})]);

export const privacyStatus = sqliteTable("privacy_status", {
  id: text("id").primaryKey(),
  lastRunAt: text("last_run_at").notNull(),
  lastSource: text("last_source").notNull(),
  lastExpiredGames: integer("last_expired_games").notNull().default(0),
  lastDeletedResponses: integer("last_deleted_responses").notNull().default(0),
  totalExpiredGames: integer("total_expired_games").notNull().default(0),
  totalDeletedResponses: integer("total_deleted_responses").notNull().default(0),
});
