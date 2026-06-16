# Phase 41: Auth & Tier Integration (Backend) - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace local JWT middleware with Supabase JWT validation, add a Connected-tier guard, and wire admin role checks to the platform `user_roles` table. All existing admin routes must keep working under the new guards. Anonymous play (game start and question fetch with no auth header) continues to work without modification to those routes. No frontend changes — this is backend middleware only.

</domain>

<decisions>
## Implementation Decisions

### Error response shape
- Match whatever error response format the existing backend already uses
- Claude's discretion on exact shape (status code + body structure)

### Migration / cutover
- Hard cutover: old local JWTs are immediately rejected when Phase 41 ships
- No grace period — users must re-authenticate with Supabase JWTs
- This is safe because the frontend (Phase 43) hasn't shipped yet; no real users are sending new JWTs until the frontend is swapped atomically

### Tier determination
- Follow the `empowered-accounts-integration-guide.md` contract exactly
- Claude reads the guide and implements `requireConnected` per the specified API/claims structure
- Do not invent a tier-checking approach — use what the integration guide specifies

### Anonymous play boundary
- Require auth for any route that **writes data** (stats, flags, gem awards, etc.)
- Anonymous reads remain open (game start, question fetch, collection browsing)
- Claude audits existing routes and applies this rule consistently

### Claude's Discretion
- Exact error response body shape (match existing convention)
- Internal middleware composition and ordering
- How to structure the jose `jwtVerify` call and JWT secret loading

</decisions>

<specifics>
## Specific Ideas

- The `empowered-accounts-integration-guide.md` at the repo root is the authoritative contract for tier determination — researcher should read it carefully
- The hard cutover is intentional: Phase 41 (backend) and Phase 43 (frontend) are designed to ship together as a coordinated swap

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 41-auth-tier-integration*
*Context gathered: 2026-02-28*
