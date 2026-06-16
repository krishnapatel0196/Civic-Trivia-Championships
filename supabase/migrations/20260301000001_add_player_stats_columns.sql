-- supabase/migrations/20260301000001_add_player_stats_columns.sql
-- Phase 42: Add streak and lifetime_gems columns to trivia.player_stats
-- Required by Phase 42 gem & progression integration

ALTER TABLE trivia.player_stats
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_gems integer NOT NULL DEFAULT 0;
