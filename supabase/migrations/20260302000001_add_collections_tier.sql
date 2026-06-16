-- Phase 47: Add tier column to trivia.collections for DB-driven hierarchy (INFRA-01)
ALTER TABLE trivia.collections
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'city';

-- Set correct tier values for existing collections
UPDATE trivia.collections SET tier = 'federal' WHERE slug = 'federal';
UPDATE trivia.collections SET tier = 'state' WHERE slug IN ('indiana-state', 'california-state');
-- All other collections default to 'city' which is correct
