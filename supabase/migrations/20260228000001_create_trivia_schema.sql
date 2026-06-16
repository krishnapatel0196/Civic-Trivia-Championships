-- supabase/migrations/20260228000001_create_trivia_schema.sql
-- Phase 40: Create trivia schema on shared Supabase project
-- Source: empowered-accounts-integration-guide.md + Supabase custom schemas docs

-- ============================================================
-- 1. Create trivia schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS trivia;

-- ============================================================
-- 2. Grant PostgREST access
-- NOTE: Dashboard step also required:
--   Settings > API > Exposed Schemas > add "trivia"
-- ============================================================
GRANT USAGE ON SCHEMA trivia TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA trivia TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA trivia TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA trivia
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA trivia
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================
-- 3. Content tables (no user FK; SERIAL PKs preserved)
-- ============================================================

CREATE TABLE trivia.topics (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trivia.collections (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL,
  locale_code     TEXT NOT NULL,
  locale_name     TEXT NOT NULL,
  icon_identifier TEXT NOT NULL,
  theme_color     TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trivia.election_races (
  id                  SERIAL PRIMARY KEY,
  seat                TEXT NOT NULL,
  election_type       TEXT NOT NULL,
  election_date       TIMESTAMPTZ NOT NULL,
  timezone            TEXT NOT NULL,
  jurisdiction        TEXT NOT NULL,
  candidates          JSONB NOT NULL DEFAULT '[]',
  questions_generated BOOLEAN NOT NULL DEFAULT false,
  followup_generated  BOOLEAN NOT NULL DEFAULT false,
  result              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trivia.questions (
  id                  SERIAL PRIMARY KEY,
  external_id         TEXT NOT NULL UNIQUE,
  text                TEXT NOT NULL,
  options             JSONB NOT NULL,
  correct_answer      INTEGER NOT NULL,
  explanation         TEXT NOT NULL,
  difficulty          TEXT NOT NULL,
  topic_id            INTEGER NOT NULL REFERENCES trivia.topics(id),
  subcategory         TEXT,
  source              JSONB NOT NULL,
  learning_content    JSONB,
  expires_at          TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'active',
  expiration_history  JSONB NOT NULL DEFAULT '[]',
  encounter_count     INTEGER NOT NULL DEFAULT 0,
  correct_count       INTEGER NOT NULL DEFAULT 0,
  quality_score       INTEGER,
  violation_count     INTEGER,
  flag_count          INTEGER NOT NULL DEFAULT 0,
  election_race_id    INTEGER REFERENCES trivia.election_races(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT check_correct_answer CHECK (correct_answer >= 0 AND correct_answer <= 3)
);

CREATE TABLE trivia.collection_topics (
  collection_id INTEGER NOT NULL REFERENCES trivia.collections(id) ON DELETE CASCADE,
  topic_id      INTEGER NOT NULL REFERENCES trivia.topics(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, topic_id)
);

CREATE TABLE trivia.collection_questions (
  collection_id INTEGER NOT NULL REFERENCES trivia.collections(id) ON DELETE CASCADE,
  question_id   INTEGER NOT NULL REFERENCES trivia.questions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, question_id)
);

-- ============================================================
-- 4. User-scoped tables (UUID user FK references public.users)
-- ============================================================

CREATE TABLE trivia.question_flags (
  id               SERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id      INTEGER NOT NULL REFERENCES trivia.questions(id) ON DELETE CASCADE,
  session_id       TEXT NOT NULL,
  reasons          JSONB,
  elaboration_text TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_flags_user_question_unique UNIQUE (user_id, question_id)
);

CREATE TABLE trivia.player_stats (
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp        INTEGER NOT NULL DEFAULT 0,
  games_played    INTEGER NOT NULL DEFAULT 0,
  best_score      INTEGER NOT NULL DEFAULT 0,
  total_correct   INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id),
  CONSTRAINT check_total_xp_non_negative CHECK (total_xp >= 0),
  CONSTRAINT check_games_played_non_negative CHECK (games_played >= 0)
);

CREATE TABLE trivia.player_prefs (
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  timer_multiplier REAL NOT NULL DEFAULT 1.0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id),
  CONSTRAINT check_timer_multiplier CHECK (timer_multiplier IN (1.0, 1.5, 2.0))
);

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX idx_questions_topic_id         ON trivia.questions (topic_id);
CREATE INDEX idx_questions_status           ON trivia.questions (status);
CREATE INDEX idx_questions_quality_score    ON trivia.questions (quality_score);
CREATE INDEX idx_questions_flag_count       ON trivia.questions (flag_count);
CREATE INDEX idx_questions_expires_at       ON trivia.questions (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_questions_learning_content ON trivia.questions USING gin (learning_content jsonb_path_ops);
CREATE INDEX idx_collections_active_sort    ON trivia.collections (is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_topics_slug                ON trivia.topics (slug);
CREATE INDEX idx_collection_questions_collection ON trivia.collection_questions (collection_id);
CREATE INDEX idx_collection_questions_question   ON trivia.collection_questions (question_id);
CREATE INDEX idx_collection_topics_collection    ON trivia.collection_topics (collection_id);
CREATE INDEX idx_collection_topics_topic         ON trivia.collection_topics (topic_id);
CREATE INDEX idx_question_flags_user        ON trivia.question_flags (user_id);
CREATE INDEX idx_question_flags_question    ON trivia.question_flags (question_id);
CREATE INDEX idx_question_flags_created_at  ON trivia.question_flags (created_at);

-- ============================================================
-- 6. Enable Row Level Security on all 9 tables
-- ============================================================
ALTER TABLE trivia.topics               ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.collections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.election_races       ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.collection_topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.collection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.question_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.player_stats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia.player_prefs         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS Policies: content tables (public read, anon + authenticated)
-- ============================================================
CREATE POLICY "Public read topics"
  ON trivia.topics FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read collections"
  ON trivia.collections FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read election_races"
  ON trivia.election_races FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read questions"
  ON trivia.questions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read collection_topics"
  ON trivia.collection_topics FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read collection_questions"
  ON trivia.collection_questions FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- 8. RLS Policies: user-scoped tables (owner only)
--    Use (SELECT auth.uid()) wrapper for query planner performance
-- ============================================================

-- question_flags: authenticated users see/insert their own flags
CREATE POLICY "Users read own flags"
  ON trivia.question_flags FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own flags"
  ON trivia.question_flags FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- player_stats: authenticated users see/write their own stats
CREATE POLICY "Users read own stats"
  ON trivia.player_stats FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own stats"
  ON trivia.player_stats FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own stats"
  ON trivia.player_stats FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- player_prefs: authenticated users see/write their own prefs
CREATE POLICY "Users read own prefs"
  ON trivia.player_prefs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own prefs"
  ON trivia.player_prefs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own prefs"
  ON trivia.player_prefs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- NOTE: service_role key automatically bypasses ALL RLS policies.
-- No explicit service_role policies needed.
