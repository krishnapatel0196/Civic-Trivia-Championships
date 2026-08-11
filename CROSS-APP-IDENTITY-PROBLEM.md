# Cross-App Identity Problem: CTC ↔ Validation Quests

**Date:** 2026-03-08
**Reported by:** Chris (Empowered Vote)
**Affects:** Civic Trivia Challenge (CTC), Validation Quests, and any future Connect-pillar apps

---

## The Problem

A user who has an account in CTC and an account in Validation Quests ends up with **two separate identities** — their XP, gems, and veracity data do not carry across apps. This breaks the core platform promise that a Connected Account is a single civic identity that earns and accumulates across all Empowered Vote experiences.

**Observed symptom:** Chris's account on Validation Quests (`chris@empowered.vote`, user ID `4e6dde8f-2bd0-4054-824f-4164744165ea`) shows `xp.total: 0` even though XP was earned through CTC activity on what appears to be a different account record.

---

## Why This Matters

The Empowered Vote platform is built around a unified Connected Account. Gems and XP are the core reward loop:

- **Yellow gems** → accuracy (earned when consensus confirms your answer is correct)
- **Red gems** → civic impact (earned for verified civic leadership)
- **XP** → progression signal across all apps

If each app creates or references a separate identity, the reward loop is siloed. A user who earns 500 XP in CTC starts at 0 in Validation Quests. This destroys the incentive to engage across the platform and makes the gem/XP economy meaningless.

---

## What Each App Currently Does

### Validation Quests
- Authenticates via **Supabase Auth** (email/password) using the shared Supabase project
- After login, calls `GET https://ev-accounts-api.onrender.com/api/account/me` to fetch the Connected Account profile
- Reads `connected_profile.xp.total`, `connected_profile.gem_balance`, `connected_profile.display_name`
- Awards gems via `connect.credit_gems()` RPC on the shared Supabase project
- Awards XP via `connect.award_xp()` RPC on the shared Supabase project

### CTC (Civic Trivia Challenge)
- **Unknown** — needs investigation. Does it:
  - Use the same Supabase project and `auth.users` table?
  - Call `ev-accounts-api` for authentication, or authenticate directly?
  - Write XP/gems to `connect.connected_profiles` via the same RPCs?
  - Have its own user table separate from `connect.connected_profiles`?

---

## Hypotheses (needs investigation)

**Hypothesis A — Different Supabase projects**
CTC uses a different Supabase project entirely. `auth.users` UUIDs don't match. A user who signs up in both apps gets two separate UUIDs and two separate `connected_profiles` rows.

**Hypothesis B — Same Supabase project, different auth flow**
Both apps share the same Supabase project, but CTC authenticates differently (e.g. social login, magic link, or a different email). The user signed up with a different credential and ended up with two `auth.users` rows.

**Hypothesis C — Same UUID, XP not written by CTC**
Both apps share the same Supabase project and the same UUID. CTC awards XP to a different column or table than `connect.connected_profiles.xp`, so `GET /api/account/me` doesn't see it.

**Hypothesis D — Same UUID, XP schema mismatch**
`GET /api/account/me` returns `xp` as an object `{total, level, xp_in_level, xp_to_next_level}`. CTC may have been built against a version of the API where `xp` was a plain integer, and its XP awards write to an old column that the current API no longer reads.

---

## Questions for Accounts Claude

1. What is the canonical auth flow for a Connected Account? Does every app authenticate through `ev-accounts-api`, or directly through Supabase Auth?
2. Is there a single `auth.users` row per Connected Account across all apps, or can multiple rows exist?
3. How does `GET /api/account/me` compute `xp.total`? Which table/column does it read from?
4. Is `connect.award_xp()` the correct and only way to award XP? Does it write to the same field that `GET /api/account/me` reads?
5. Does `ev-accounts-api` enforce that only one `connected_profiles` row exists per email address?

## Questions for CTC Claude

1. Which Supabase project does CTC connect to? Is it the same shared project as `ev-accounts-api`?
2. How does CTC authenticate users — directly through Supabase Auth, or via `ev-accounts-api`?
3. When a user earns XP in CTC, what RPC or query is called? What table/column is written to?
4. Does CTC have its own user table, or does it rely entirely on `connect.connected_profiles`?
5. What user ID did Chris's CTC account register under?

---

## What a Fix Looks Like

The goal is: **one `auth.users` UUID per person, one `connected_profiles` row, XP and gems written and read through the same RPCs by all apps.**

- All apps must authenticate through the same Supabase project
- All apps must use `connect.award_xp()` and `connect.credit_gems()` to write rewards
- All apps must read profile data from `GET /api/account/me` (or equivalent)
- Account merging tooling may be needed for users who already have duplicate records

---

## Resolution (2026-03-08)

**Status: RESOLVED**

Two root causes identified and fixed:

**Root cause 1 — Identity (historical artifact, not ongoing):**
CTC was mid-migration between two Supabase projects (EV-Backend-Dev → shared `kxsdzaojfaibhuzmclfq`) during Phase 40 (2026-02-28). Test game completions during that window created orphan rows in `connect` using old-project UUIDs. CTC is now confirmed on the shared project; all current users have correct UUIDs. The orphan rows were transition artifacts — cascade-deleted when `public.users` was cleaned up.

**Root cause 2 — Code bug in accounts API (the real culprit for `xp.total: 0`):**
`GET /api/account/me` was reading the legacy `xp` column, which is never written to. `award_xp` writes to `total_xp`. Four-line fix on the accounts side — now reading the correct column.

**Diagnostic tooling added to CTC:**
`GET /api/users/profile/identity` (requires Bearer token) returns the authenticated user's `user_id` UUID for cross-app comparison.

**Remaining known issue:**
CTC's `awardPlatformGems()` calls the `connect.credit_gems` RPC directly via Supabase service role, bypassing the accounts API and any user validation. This should be routed through the accounts API for consistency — filed as a future cleanup item, does not affect current functionality.
