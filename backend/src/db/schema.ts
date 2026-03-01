import { pgSchema, serial, text, integer, boolean, timestamp, jsonb, index, primaryKey, unique, uuid, real } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define the trivia schema (renamed from civic_trivia for v1.8 shared Supabase project)
export const triviaSchema = pgSchema('trivia');

// Collections table
export const collections = triviaSchema.table('collections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  localeCode: text('locale_code').notNull(),
  localeName: text('locale_name').notNull(),
  iconIdentifier: text('icon_identifier').notNull(),
  themeColor: text('theme_color').notNull(), // 7-char hex like '#1E3A8A'
  isActive: boolean('is_active').notNull().default(false),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  activeSortIdx: index('idx_collections_active_sort')
    .on(table.isActive, table.sortOrder)
    .where(sql`${table.isActive} = true`)
}));

// Topics table
export const topics = triviaSchema.table('topics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // Display name like "Constitution"
  slug: text('slug').notNull().unique(),
  description: text('description'), // Nullable
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  slugIdx: index('idx_topics_slug').on(table.slug)
}));

// Collection-Topics junction table
export const collectionTopics = triviaSchema.table('collection_topics', {
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  topicId: integer('topic_id')
    .notNull()
    .references(() => topics.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.collectionId, table.topicId] }),
  collectionIdx: index('idx_collection_topics_collection').on(table.collectionId),
  topicIdx: index('idx_collection_topics_topic').on(table.topicId)
}));

// Election Races table
export const electionRaces = triviaSchema.table('election_races', {
  id: serial('id').primaryKey(),
  seat: text('seat').notNull(), // e.g., "Mayor of Bloomington"
  electionType: text('election_type').notNull(), // primary, general, runoff, by-election
  electionDate: timestamp('election_date', { withTimezone: true }).notNull(),
  timezone: text('timezone').notNull(), // IANA format, e.g., "America/Indiana/Indianapolis"
  jurisdiction: text('jurisdiction').notNull(), // e.g., "Bloomington, IN"
  candidates: jsonb('candidates').$type<Array<{name: string; party: string; incumbent: boolean}>>().notNull().default([]),
  questionsGenerated: boolean('questions_generated').notNull().default(false),
  followupGenerated: boolean('followup_generated').notNull().default(false),
  result: text('result'), // nullable, filled after election resolves
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type ElectionRace = typeof electionRaces.$inferSelect;
export type NewElectionRace = typeof electionRaces.$inferInsert;

// Questions table
export const questions = triviaSchema.table('questions', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(), // Preserves "q001" style IDs from JSON
  text: text('text').notNull(),
  options: jsonb('options').$type<string[]>().notNull(), // Array of 4 strings
  correctAnswer: integer('correct_answer').notNull(), // 0-based index
  explanation: text('explanation').notNull(),
  difficulty: text('difficulty').notNull(), // 'easy' | 'medium' | 'hard'
  topicId: integer('topic_id')
    .notNull()
    .references(() => topics.id),
  subcategory: text('subcategory'), // Stores the topicCategory value like 'bill-of-rights', 'federalism'
  source: jsonb('source').$type<{
    name: string;
    url: string;
  }>().notNull(), // Required for ALL questions
  learningContent: jsonb('learning_content').$type<{
    paragraphs: string[];
    corrections: Record<string, string>; // Per-wrong-answer explanations
  }>(), // Nullable - optional deep-dive content
  expiresAt: timestamp('expires_at', { withTimezone: true }), // Nullable
  status: text('status').notNull().default('active'), // 'active' | 'expired' | 'archived'
  expirationHistory: jsonb('expiration_history').$type<Array<{
    action: 'expired' | 'renewed' | 'archived';
    timestamp: string; // ISO 8601
    previousExpiresAt?: string;
    newExpiresAt?: string;
  }>>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  encounterCount: integer('encounter_count').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  qualityScore: integer('quality_score'),
  violationCount: integer('violation_count'),
  flagCount: integer('flag_count').notNull().default(0),
  electionRaceId: integer('election_race_id')
    .references(() => electionRaces.id, { onDelete: 'set null' })
}, (table) => ({
  topicIdx: index('idx_questions_topic_id').on(table.topicId),
  learningContentIdx: index('idx_questions_learning_content')
    .using('gin', sql`${table.learningContent} jsonb_path_ops`),
  expiresAtIdx: index('idx_questions_expires_at')
    .on(table.expiresAt)
    .where(sql`${table.expiresAt} IS NOT NULL`),
  statusIdx: index('idx_questions_status').on(table.status),
  qualityScoreIdx: index('idx_questions_quality_score').on(table.qualityScore),
  flagCountIdx: index('idx_questions_flag_count').on(table.flagCount)
}));

// Collection-Questions junction table
export const collectionQuestions = triviaSchema.table('collection_questions', {
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.collectionId, table.questionId] }),
  collectionIdx: index('idx_collection_questions_collection').on(table.collectionId),
  questionIdx: index('idx_collection_questions_question').on(table.questionId)
}));

// Question Flags table
// NOTE: user_id is UUID (references public.users(id) on shared Supabase project)
// Old integer user_id from the civic_trivia era must NOT be migrated — start fresh
export const questionFlags = triviaSchema.table('question_flags', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),  // UUID referencing public.users(id) on shared Supabase
  questionId: integer('question_id').notNull().references(() => questions.id),
  sessionId: text('session_id').notNull(),  // UUID from Redis game session
  reasons: jsonb('reasons').$type<string[]>(),
  elaborationText: text('elaboration_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userQuestionUnique: unique().on(table.userId, table.questionId),
  userIdx: index('idx_question_flags_user').on(table.userId),
  questionIdx: index('idx_question_flags_question').on(table.questionId),
  createdAtIdx: index('idx_question_flags_created_at').on(table.createdAt),
}));

// Player Stats table (new in v1.8 — replaces XP/stats columns on local users table)
// UUID primary key references public.users(id) on the shared Supabase project
export const playerStats = triviaSchema.table('player_stats', {
  userId: uuid('user_id').primaryKey(),
  totalXp: integer('total_xp').notNull().default(0),
  gamesPlayed: integer('games_played').notNull().default(0),
  bestScore: integer('best_score').notNull().default(0),
  totalCorrect: integer('total_correct').notNull().default(0),
  totalQuestions: integer('total_questions').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  lifetimeGems: integer('lifetime_gems').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Player Prefs table (new in v1.8 — replaces timer_multiplier column on local users table)
// UUID primary key references public.users(id) on the shared Supabase project
export const playerPrefs = triviaSchema.table('player_prefs', {
  userId: uuid('user_id').primaryKey(),
  timerMultiplier: real('timer_multiplier').notNull().default(1.0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Export TypeScript types
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;

export type CollectionTopic = typeof collectionTopics.$inferSelect;
export type NewCollectionTopic = typeof collectionTopics.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type CollectionQuestion = typeof collectionQuestions.$inferSelect;
export type NewCollectionQuestion = typeof collectionQuestions.$inferInsert;

export type QuestionFlag = typeof questionFlags.$inferSelect;
export type NewQuestionFlag = typeof questionFlags.$inferInsert;

export type PlayerStats = typeof playerStats.$inferSelect;
export type NewPlayerStats = typeof playerStats.$inferInsert;

export type PlayerPrefs = typeof playerPrefs.$inferSelect;
export type NewPlayerPrefs = typeof playerPrefs.$inferInsert;
