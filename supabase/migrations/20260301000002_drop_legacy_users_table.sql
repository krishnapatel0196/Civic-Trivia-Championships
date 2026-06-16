-- Phase 44: Remove legacy local users table infrastructure
-- The local users table was from the old PostgreSQL-based auth system (Phase 01).
-- It was never created in this shared Supabase project (kxsdzaojfaibhuzmclfq).
-- Identity now lives in Supabase Auth (public.users) + trivia.player_stats/player_prefs.
--
-- NOTE: public.users is Supabase Auth's built-in table -- DO NOT DROP IT.
-- This migration is a safety guard only.

DROP TABLE IF EXISTS trivia.users CASCADE;
