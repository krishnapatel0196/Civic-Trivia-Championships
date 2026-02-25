# Stack Research: v1.7 Live Civic Intelligence

**Project:** Civic Trivia Championship
**Researched:** 2026-02-25
**Focus:** Election data sourcing, scheduling, UK civic data for Norwich

---

## Summary Recommendation

**US local elections:** No reliable free API exists for city-level candidate data. The practical approach for v1.7 is **admin-entered race data** (as the Architecture doc concludes), with the election pipeline ready to accept automated scraping when a data source is chosen. Ballotpedia is the gold standard but paid.

**UK elections:** Democracy Club is a **free, open API** with comprehensive candidate data for all UK local elections. Ideal for Norwich.

**Scheduling:** node-cron is already installed and running. No new dependency needed.

---

## US Election Data Sources

### Option Comparison

| Source | Coverage | Cost | Local elections | Candidate data | Status |
|--------|----------|------|----------------|----------------|--------|
| **Ballotpedia API** | Comprehensive, 31 states for 2026 | Paid subscription (contact data@ballotpedia.org) | ✓ City/county level | ✓ Name, party, incumbency, election date | Active |
| **Google Civic Information API** | Federal/state representatives | Free with API key | ✗ Representatives API deprecated April 2025 | ✗ Candidate data removed | Partially deprecated |
| **Democracy Works Elections API** | Federal, state, county, municipal (>5k population) | Paid (contact for pricing) | ✓ | Limited — election dates and ballot info, not full candidate lists | Active |
| **OpenStates** | State legislature only | Free tier | ✗ No local elections | ✗ | Active but wrong scope |
| **County/state portals (scraped)** | Jurisdiction-specific | Free | ✓ Best coverage | ✓ Official source | Fragile HTML |

### Recommendation: Admin Entry for v1.7, Ballotpedia for v1.8+

County election portals (acvote.alamedacountyca.gov for Fremont, etc.) are the authoritative source but have no structured API — only HTML pages. Scraping them is brittle (structure changes with each election cycle).

**For v1.7:** Admin manually enters race data into `election_races` table. The generation pipeline is built to consume this data. This delivers the full election question lifecycle without the fragility of web scraping.

**For v1.8+:** Evaluate Ballotpedia's paid API or build targeted scrapers for specific county portals. The pipeline architecture already supports this — scraping just populates `election_races`.

**Key finding:** Alameda County (Fremont) has a 2026 Direct Primary scheduled for June 2, 2026. The candidate filing period is currently open. Official data is at acvote.alamedacountyca.gov.

---

## UK Election Data Sources

### Democracy Club — Recommended ✓

**URL:** https://democracyclub.org.uk / https://candidates.democracyclub.org.uk

- **Cost:** Free (open data, Creative Commons license)
- **Coverage:** Every UK election from district council level upward
- **Data:** Candidate name, party, ward/constituency, election date, result (after election)
- **API:** REST API available, plus free CSV downloads
- **2025 elections:** Full data for May 2025 local elections already available
- **Norwich:** Norwich City Council elections are covered (13 wards, 3 councillors each)
- **Norfolk County Council elections:** Also covered (separate from City Council)

**Elections API endpoint:**
```
GET https://elections.democracyclub.org.uk/api/elections/?current=true&format=json
GET https://candidates.democracyclub.org.uk/api/people/?format=json&election_id=local.norwich.2026-05-07
```

**No API key required for read access.** Rate limiting applies (standard REST API).

### Electoral Commission UK
- **URL:** https://www.electoralcommission.org.uk
- **Data:** Election dates, registration deadlines, general election guidance
- **Not a candidate database** — for election calendar/dates only

### Recommendation for Norwich
Use Democracy Club for:
1. Confirming Norwich City Council election dates
2. Sourcing candidate data when generating election questions for Norwich collection
3. Finding councillor names for non-election civic questions ("Who is the councillor for [ward]?")

---

## Scheduling

### No New Dependencies Needed

`node-cron` is already installed and running the hourly expiration sweep. Adding a daily election detection job is a one-line addition to `startCron.ts` (see ARCHITECTURE.md).

```typescript
cron.schedule('0 6 * * *', async () => {
  await runElectionDetection();
});
```

**Frequency decision:** Daily at 6 AM. Election data doesn't change hourly; daily is sufficient to detect races entering the 60-day generation window.

---

## Anti-Recommendations

| What | Why Not |
|------|---------|
| **Google Civic Information API (representatives)** | Deprecated April 2025. Elections API still works but doesn't provide candidate lists |
| **OpenStates** | State legislature only, not city council elections |
| **Playwright/Puppeteer for county scraping** | Heavy dependency (Chromium), complex maintenance, breaks on HTML changes. If scraping needed, use `cheerio` (HTML parsing) with `axios` (HTTP) — both lightweight |
| **pgvector or vector DB for election data** | Not needed — election races are structured relational data, not embeddings |
| **Paid election data subscription for v1.7** | Budget-inefficient when admin entry achieves the same result for initial build |

---

## Summary: New Dependencies for v1.7

| Dependency | Version | Purpose | Required? |
|------------|---------|---------|-----------|
| **No new npm packages required** | — | node-cron, axios/fetch already present | — |
| Democracy Club API | REST, no key | UK election candidates for Norwich | For Norwich election questions |
| Ballotpedia (optional) | Paid | US local candidate data | v1.8+ consideration |

**v1.7 needs zero new npm packages.** The election pipeline uses existing infrastructure: node-cron (scheduling), PostgreSQL (election_races table), Claude SDK (generation), Drizzle ORM (schema).

---

*Research completed: 2026-02-25*
